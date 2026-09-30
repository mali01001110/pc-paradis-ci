"""Tests for dynamic attribute filters (attr_<key>=value) and filter-options endpoint."""
import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from apps.categories.models import AttributeDefinition, Brand, Category
from apps.products.models import Product, ProductAttributeValue

from .test_products import make_product


@pytest.fixture
def seeded(db):
    call_command("seed_catalogue")


@pytest.fixture
def gpu_category(seeded):
    return Category.objects.get(slug="gpu")


@pytest.fixture
def gpu_brand(seeded):
    return Brand.objects.get(name="MSI")


def set_attr(product, key, value):
    """Attach a dynamic attribute value to a product by definition key."""
    attr = AttributeDefinition.objects.get(key=key)
    ProductAttributeValue.objects.create(product=product, attribute=attr, value=value)


@pytest.fixture
def rgb_def(gpu_category):
    return AttributeDefinition.objects.create(
        category=gpu_category,
        key="rgb",
        label="RGB",
        value_type="boolean",
        filterable=True,
    )


@pytest.mark.django_db
class TestDynamicAttributeFilters:
    def test_filter_by_number_attribute(self, api_client, active_seller, gpu_category, gpu_brand):
        p8 = make_product(active_seller, gpu_category, gpu_brand, title="Carte 8Go")
        p16 = make_product(active_seller, gpu_category, gpu_brand, title="Carte 16Go")
        ProductAttributeValue.objects.create(product=p8, attribute=AttributeDefinition.objects.get(key="vram"), value=8)
        ProductAttributeValue.objects.create(product=p16, attribute=AttributeDefinition.objects.get(key="vram"), value=16)

        resp = api_client.get(reverse("products:product-list"), {"attr_vram": "8"})
        assert resp.status_code == status.HTTP_200_OK
        titles = [p["title"] for p in resp.data["results"]]
        assert titles == ["Carte 8Go"]

    def test_filter_number_or_semantics(self, api_client, active_seller, gpu_category, gpu_brand):
        p8 = make_product(active_seller, gpu_category, gpu_brand, title="8")
        p12 = make_product(active_seller, gpu_category, gpu_brand, title="12")
        p16 = make_product(active_seller, gpu_category, gpu_brand, title="16")
        for p, v in ((p8, 8), (p12, 12), (p16, 16)):
            ProductAttributeValue.objects.create(product=p, attribute=AttributeDefinition.objects.get(key="vram"), value=v)

        resp = api_client.get(reverse("products:product-list"), {"attr_vram": "8,12"})
        titles = {p["title"] for p in resp.data["results"]}
        assert titles == {"8", "12"}

    def test_filter_by_select_attribute(self, api_client, active_seller, gpu_category, gpu_brand):
        p6x = make_product(active_seller, gpu_category, gpu_brand, title="G6X")
        p6 = make_product(active_seller, gpu_category, gpu_brand, title="G6")
        ProductAttributeValue.objects.create(product=p6x, attribute=AttributeDefinition.objects.get(key="vram_type"), value="GDDR6X")
        ProductAttributeValue.objects.create(product=p6, attribute=AttributeDefinition.objects.get(key="vram_type"), value="GDDR6")

        resp = api_client.get(reverse("products:product-list"), {"attr_vram_type": "GDDR6X"})
        titles = [p["title"] for p in resp.data["results"]]
        assert titles == ["G6X"]

    def test_filter_by_boolean_attribute(self, api_client, active_seller, gpu_category, gpu_brand, rgb_def):
        p_yes = make_product(active_seller, gpu_category, gpu_brand, title="RGB")
        p_no = make_product(active_seller, gpu_category, gpu_brand, title="NoRGB")
        ProductAttributeValue.objects.create(product=p_yes, attribute=rgb_def, value=True)
        ProductAttributeValue.objects.create(product=p_no, attribute=rgb_def, value=False)

        resp = api_client.get(reverse("products:product-list"), {"attr_rgb": "true"})
        titles = [p["title"] for p in resp.data["results"]]
        assert titles == ["RGB"]

    def test_filter_by_multiselect_attribute(self, api_client, active_seller, gpu_category, gpu_brand):
        types_def = AttributeDefinition.objects.create(
            category=gpu_category,
            key="memory_types",
            label="Types mémoire",
            value_type="multiselect",
            filterable=True,
        )
        p1 = make_product(active_seller, gpu_category, gpu_brand, title="DDR4")
        p2 = make_product(active_seller, gpu_category, gpu_brand, title="DDR5")
        p3 = make_product(active_seller, gpu_category, gpu_brand, title="GDDR4")
        ProductAttributeValue.objects.create(product=p1, attribute=types_def, value=["DDR4"])
        ProductAttributeValue.objects.create(product=p2, attribute=types_def, value=["DDR5", "DDR4"])
        ProductAttributeValue.objects.create(product=p3, attribute=types_def, value=["GDDR4"])

        resp = api_client.get(reverse("products:product-list"), {"attr_memory_types": "DDR4"})
        titles = {p["title"] for p in resp.data["results"]}
        assert titles == {"DDR4", "DDR5"}

    def test_filter_by_text_attribute_case_insensitive(self, api_client, active_seller, gpu_category, gpu_brand):
        note = AttributeDefinition.objects.create(
            category=gpu_category,
            key="note",
            label="Note",
            value_type="text",
            filterable=True,
        )
        p1 = make_product(active_seller, gpu_category, gpu_brand, title="Match")
        p2 = make_product(active_seller, gpu_category, gpu_brand, title="NoMatch")
        ProductAttributeValue.objects.create(product=p1, attribute=note, value="Édition Palit GameRock")
        ProductAttributeValue.objects.create(product=p2, attribute=note, value="Standard")

        resp = api_client.get(reverse("products:product-list"), {"attr_note": "palit"})
        titles = [p["title"] for p in resp.data["results"]]
        assert titles == ["Match"]

    def test_attribute_filter_combined_with_price(self, api_client, active_seller, gpu_category, gpu_brand):
        cheap = make_product(active_seller, gpu_category, gpu_brand, title="Pas cher", price=100000)
        dear = make_product(active_seller, gpu_category, gpu_brand, title="Cher", price=900000)
        for p in (cheap, dear):
            ProductAttributeValue.objects.create(product=p, attribute=AttributeDefinition.objects.get(key="vram"), value=8)

        resp = api_client.get(reverse("products:product-list"), {"attr_vram": "8", "max_price": "500000"})
        titles = [p["title"] for p in resp.data["results"]]
        assert titles == ["Pas cher"]

    def test_unknown_attribute_key_ignored(self, api_client, active_seller, gpu_category, gpu_brand):
        p = make_product(active_seller, gpu_category, gpu_brand)
        ProductAttributeValue.objects.create(product=p, attribute=AttributeDefinition.objects.get(key="vram"), value=8)

        resp = api_client.get(reverse("products:product-list"), {"attr_inexistant": "8"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_seller_list_supports_attr_filters(self, auth_client, active_seller, gpu_category, gpu_brand):
        p8 = make_product(active_seller, gpu_category, gpu_brand, title="8")
        p16 = make_product(active_seller, gpu_category, gpu_brand, title="16")
        ProductAttributeValue.objects.create(product=p8, attribute=AttributeDefinition.objects.get(key="vram"), value=8)
        ProductAttributeValue.objects.create(product=p16, attribute=AttributeDefinition.objects.get(key="vram"), value=16)

        resp = auth_client.get(reverse("products:my-products"), {"attr_vram": "16"})
        titles = [p["title"] for p in resp.data["results"]]
        assert titles == ["16"]

    def test_admin_queue_supports_attr_filters(self, api_client, django_user_model, active_seller, gpu_category, gpu_brand):
        staff = django_user_model.objects.create_superuser(email="admin@example.com", password="Admin-Passw0rd!")
        p8 = make_product(active_seller, gpu_category, gpu_brand, title="8")
        p16 = make_product(active_seller, gpu_category, gpu_brand, title="16")
        ProductAttributeValue.objects.create(product=p8, attribute=AttributeDefinition.objects.get(key="vram"), value=8)
        ProductAttributeValue.objects.create(product=p16, attribute=AttributeDefinition.objects.get(key="vram"), value=16)

        api_client.force_authenticate(user=staff)
        resp = api_client.get(reverse("products:admin-products"), {"attr_vram": "8"})
        titles = [p["title"] for p in resp.data["results"]]
        assert titles == ["8"]


@pytest.mark.django_db
class TestFilterOptionsEndpoint:
    def test_returns_filterable_definitions_with_values(self, api_client, active_seller, gpu_category, gpu_brand):
        p1 = make_product(active_seller, gpu_category, gpu_brand)
        p2 = make_product(active_seller, gpu_category, gpu_brand, title="Deuxième")
        ProductAttributeValue.objects.create(product=p1, attribute=AttributeDefinition.objects.get(key="vram"), value=8)
        ProductAttributeValue.objects.create(product=p2, attribute=AttributeDefinition.objects.get(key="vram"), value=12)

        resp = api_client.get(reverse("categories:filter-options", args=["gpu"]))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["category"] == "gpu"

        by_key = {f["key"]: f for f in resp.data["filters"]}
        assert "vram" in by_key
        assert by_key["vram"]["label"] == "VRAM"
        assert by_key["vram"]["value_type"] == "number"
        assert by_key["vram"]["unit"] == "GB"
        assert by_key["vram"]["values"] == [8, 12]
        # select: static options + observed values
        assert by_key["vram_type"]["options"] == ["GDDR6", "GDDR6X", "GDDR5", "HBM"]

    def test_non_filterable_excluded(self, api_client, active_seller, gpu_category, gpu_brand):
        AttributeDefinition.objects.create(
            category=gpu_category, key="secret", label="Secret", value_type="text", filterable=False
        )
        resp = api_client.get(reverse("categories:filter-options", args=["gpu"]))
        keys = [f["key"] for f in resp.data["filters"]]
        assert "secret" not in keys

    def test_unknown_category_404(self, api_client, db):
        resp = api_client.get(reverse("categories:filter-options", args=["inexistant"]))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_attributes_of_other_categories_excluded(self, api_client, active_seller, gpu_category, gpu_brand):
        other = AttributeDefinition.objects.create(
            category=Category.objects.get(slug="cpu"), key="gpu_cache_leak", label="Cache", value_type="text", filterable=True
        )
        p = make_product(active_seller, gpu_category, gpu_brand)
        ProductAttributeValue.objects.create(product=p, attribute=other, value="32 Mo")
        ProductAttributeValue.objects.create(product=p, attribute=AttributeDefinition.objects.get(key="vram"), value=8)

        resp = api_client.get(reverse("categories:filter-options", args=["gpu"]))
        by_key = {f["key"] for f in resp.data["filters"]}
        assert "gpu_cache_leak" not in by_key
        assert "vram" in by_key
