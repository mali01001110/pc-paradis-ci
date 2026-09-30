"""Tests for products API (spec §13, §35, §40, §53)."""
import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.urls import reverse
from PIL import Image
from rest_framework import status

from apps.categories.models import AttributeDefinition, Brand, Category
from apps.products.models import Product, ProductAttributeValue


@pytest.fixture
def seeded(db):
    call_command("seed_catalogue")


@pytest.fixture
def gpu_category(seeded):
    return Category.objects.get(slug="gpu")


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


def make_png_file(name="img.png"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color=(109, 40, 217)).save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


# ---------- Public API ----------
@pytest.mark.django_db
def test_public_list_only_available(api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand)
    make_product(active_seller, gpu_category, gpu_brand, status="SOLD", title="Vendu")
    resp = api_client.get(reverse("products:product-list"))
    assert resp.status_code == status.HTTP_200_OK
    titles = [p["title"] for p in resp.data["results"]]
    assert "RTX 4070 Super" in titles
    assert "Vendu" not in titles


@pytest.mark.django_db
def test_public_list_requires_no_auth(api_client, gpu_category, gpu_brand):
    resp = api_client.get(reverse("products:product-list"))
    assert resp.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_public_detail_increments_views(api_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = api_client.get(reverse("products:product-detail", args=[p.slug]))
    assert resp.status_code == status.HTTP_200_OK
    assert resp.data["views_count"] == 1
    p.refresh_from_db()
    assert p.views_count == 1


@pytest.mark.django_db
def test_public_detail_hides_sold(api_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand, status="SOLD")
    resp = api_client.get(reverse("products:product-detail", args=[p.slug]))
    assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------- Seller API ----------
@pytest.mark.django_db
def test_seller_create_product(auth_client, active_seller, gpu_category, gpu_brand):
    resp = auth_client.post(
        reverse("products:my-products"),
        {
            "title": "Nouveau GPU",
            "category_id": str(gpu_category.id),
            "brand_id": str(gpu_brand.id),
            "price": 300000,
            "condition": "NEUF",
            "city": "Abidjan",
            "phone": "+2250708091011",
            "whatsapp": "+2250708091011",
        },
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    assert Product.objects.filter(seller=active_seller, title="Nouveau GPU").exists()


@pytest.mark.django_db
def test_seller_create_requires_auth(api_client, gpu_category, gpu_brand):
    resp = api_client.post(reverse("products:my-products"), {"title": "x"}, format="json")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_seller_lists_only_own(auth_client, active_seller, seller_factory, gpu_category, gpu_brand):
    other = seller_factory(email="autre@x.ci", email_verified=True, status="ACTIVE")
    make_product(active_seller, gpu_category, gpu_brand, title="Le mien")
    make_product(other, gpu_category, gpu_brand, title="Le sien")
    resp = auth_client.get(reverse("products:my-products"))
    assert resp.status_code == status.HTTP_200_OK
    titles = [p["title"] for p in resp.data["results"]]
    assert "Le mien" in titles
    assert "Le sien" not in titles


@pytest.mark.django_db
def test_seller_cannot_update_other(auth_client, seller_factory, gpu_category, gpu_brand):
    other = seller_factory(email="autre@x.ci", email_verified=True, status="ACTIVE")
    p = make_product(other, gpu_category, gpu_brand)
    resp = auth_client.patch(reverse("products:my-product-detail", args=[p.id]), {"price": 1}, format="json")
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_seller_delete_product(auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = auth_client.delete(reverse("products:my-product-detail", args=[p.id]))
    assert resp.status_code == status.HTTP_204_NO_CONTENT
    # Soft delete: the row stays in DB but is flagged (spec §42).
    p.refresh_from_db()
    assert p.is_deleted is True
    assert p.deleted_at is not None


# ---------- Search & Filter ----------
@pytest.mark.django_db
def test_public_list_search_by_title(seeded, api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, title="RTX 4080 Super")
    resp = api_client.get(reverse("products:product-list"), {"q": "RTX 4080"})
    assert resp.status_code == status.HTTP_200_OK
    titles = [p["title"] for p in resp.data["results"]]
    assert "RTX 4080 Super" in titles


@pytest.mark.django_db
def test_public_list_filter_by_price(seeded, api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, title="Cher")
    resp = api_client.get(reverse("products:product-list"), {"min_price": "500000"})
    assert resp.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_public_list_ordering(seeded, api_client, active_seller, gpu_category, gpu_brand):
    make_product(active_seller, gpu_category, gpu_brand, title="Premier")
    resp = api_client.get(reverse("products:product-list"), {"ordering": "-price"})
    assert resp.status_code == status.HTTP_200_OK


# ---------- Attributes ----------
@pytest.mark.django_db
def test_set_product_attributes(auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    vram = AttributeDefinition.objects.get(category=gpu_category, key="vram")
    ray = AttributeDefinition.objects.get(category=gpu_category, key="ray_tracing")
    resp = auth_client.post(
        reverse("products:my-product-attributes", args=[p.id]),
        [
            {"attribute": str(vram.id), "value": 12},
            {"attribute": str(ray.id), "value": True},
        ],
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    assert ProductAttributeValue.objects.filter(product=p, attribute=vram, value=12).exists()


# ---------- Images ----------
@pytest.mark.django_db
def test_upload_product_image(auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = auth_client.post(
        reverse("products:my-product-images", args=[p.id]),
        {"images": [make_png_file()]},
        format="multipart",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    assert p.images.count() == 1


@pytest.mark.django_db
def test_upload_requires_auth(api_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = api_client.post(reverse("products:my-product-images", args=[p.id]), {}, format="multipart")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
