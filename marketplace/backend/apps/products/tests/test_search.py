"""Tests for product search (spec §29).

These run against SQLite (config.settings.test) which exercises the icontains fallback
path in search_products(). The same API contract applies to PostgreSQL FTS in production.
"""
import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from apps.categories.models import Brand, Category
from apps.products.models import Product


@pytest.fixture
def seeded(db):
    call_command("seed_catalogue")


@pytest.fixture
def gpu_category(seeded):
    return Category.objects.get(slug="gpu")


@pytest.fixture
def cpu_category(seeded):
    return Category.objects.get(slug="cpu")


@pytest.fixture
def gpu_brand(seeded):
    return Brand.objects.get(name="MSI")


def make_product(seller, category, brand, **overrides):
    defaults = {
        "seller": seller,
        "category": category,
        "brand": brand,
        "title": "RTX 4070 Super",
        "model": "4070 Super",
        "description": "Carte graphique gaming",
        "price": 450000,
        "condition": "OCCASION",
        "status": "AVAILABLE",
        "city": "Abidjan",
        "commune": "Cocody",
    }
    defaults.update(overrides)
    return Product.objects.create(**defaults)


def search(client, q):
    resp = client.get(reverse("products:product-list"), {"q": q})
    assert resp.status_code == status.HTTP_200_OK
    return [p["title"] for p in resp.data["results"]]


@pytest.mark.django_db
def test_search_matches_title(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, title="RTX 4080 Super")
    make_product(active_seller, gpu_category, gpu_brand, title="Ryzen 5 7600")
    titles = search(api_client, "RTX 4080")
    assert "RTX 4080 Super" in titles
    assert "Ryzen 5 7600" not in titles


@pytest.mark.django_db
def test_search_matches_brand(api_client, active_seller, gpu_category, gpu_brand, seller_factory):
    msi = Brand.objects.get(name="MSI")
    asus = Brand.objects.get_or_create(name="ASUS", defaults={"slug": "asus"})[0]
    make_product(active_seller, gpu_category, msi, title="GPU MSI")
    make_product(active_seller, gpu_category, asus, title="GPU ASUS")
    titles = search(api_client, "MSI")
    assert "GPU MSI" in titles
    assert "GPU ASUS" not in titles


@pytest.mark.django_db
def test_search_matches_description(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, title="Carte", description="avec watercooling 360mm")
    titles = search(api_client, "watercooling")
    assert "Carte" in titles


@pytest.mark.django_db
def test_search_case_insensitive(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, title="Corsair RAM 32GB")
    titles = search(api_client, "corsair ram")
    assert "Corsair RAM 32GB" in titles


@pytest.mark.django_db
def test_search_no_results(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand)
    titles = search(api_client, "introuvable-xyz-123")
    assert titles == []


@pytest.mark.django_db
def test_search_empty_query_returns_all(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, title="Produit A")
    make_product(active_seller, gpu_category, gpu_brand, title="Produit B")
    titles = search(api_client, "")
    assert set(titles) == {"Produit A", "Produit B"}


@pytest.mark.django_db
def test_search_ignores_only_sold(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, title="RTX 4090", status="SOLD")
    titles = search(api_client, "RTX 4090")
    assert "RTX 4090" not in titles


@pytest.mark.django_db
def test_search_seller_only_own(auth_client, active_seller, gpu_category, gpu_brand, seller_factory):
    other = seller_factory(email="autre@x.ci", email_verified=True, status="ACTIVE")
    make_product(active_seller, gpu_category, gpu_brand, title="Mon GPU")
    make_product(other, gpu_category, gpu_brand, title="GPU de l'autre")
    resp = auth_client.get(reverse("products:my-products"), {"q": "GPU"})
    assert resp.status_code == status.HTTP_200_OK
    titles = [p["title"] for p in resp.data["results"]]
    assert "Mon GPU" in titles
    assert "GPU de l'autre" not in titles


@pytest.mark.django_db
def test_search_matches_category_name(api_client, active_seller, seeded, gpu_brand):
    """La recherche porte aussi sur le nom de categorie (§29)."""
    gpu_cat = Category.objects.get(slug="gpu")
    ram_cat = Category.objects.get(slug="ram")
    make_product(active_seller, gpu_cat, gpu_brand, title="Annonce A", description="")
    make_product(active_seller, ram_cat, gpu_brand, title="Annonce B", description="")
    titles = search(api_client, "graphiques")
    assert "Annonce A" in titles
    assert "Annonce B" not in titles


@pytest.mark.django_db
def test_search_matches_attribute_values(api_client, active_seller, seeded, gpu_brand):
    """La recherche couvre les valeurs de caractéristiques dynamiques (§29)."""
    from apps.categories.models import AttributeDefinition
    from apps.products.models import ProductAttributeValue

    ram_category = Category.objects.get(slug="ram")
    other_product = make_product(
        active_seller, ram_category, gpu_brand, title="Kit RAM", model="", description=""
    )
    p = make_product(
        active_seller, ram_category, gpu_brand, title="Kit DDR5", model="", description=""
    )
    ProductAttributeValue.objects.create(
        product=p,
        attribute=ram_category.attributes.get(key="speed"),
        value=6000,
    )
    titles = search(api_client, "6000")
    assert "Kit DDR5" in titles


@pytest.mark.django_db
def test_render_attribute_value_variants():
    """Booleans/lists render as searchable text (§29)."""
    from apps.products.search import render_attribute_value

    assert render_attribute_value(True) == "oui"
    assert render_attribute_value(False) == "non"
    assert render_attribute_value(["AM4", "AM5"]) == "AM4 AM5"
    assert render_attribute_value(6000) == "6000"
    assert render_attribute_value("Gold") == "Gold"


@pytest.mark.django_db
def test_attributes_text_synced_by_signal(api_client, active_seller, seeded, gpu_brand):
    """attributes_text est reconstruit apres ecriture des caracteristiques (§29)."""
    from apps.products.models import ProductAttributeValue

    ram_category = Category.objects.get(slug="ram")
    product = make_product(active_seller, ram_category, gpu_brand, title="Kit RAM", description="")
    assert product.attributes_text == ""
    speed = ram_category.attributes.get(key="speed")
    ProductAttributeValue.objects.create(product=product, attribute=speed, value=6000)
    product.refresh_from_db()
    assert "speed" in product.attributes_text
    assert "6000" in product.attributes_text
