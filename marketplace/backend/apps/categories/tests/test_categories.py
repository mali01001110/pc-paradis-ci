"""Tests for the catalogue API (spec §11, §30, §53)."""
import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from apps.categories.models import AttributeDefinition, Brand, Category


@pytest.fixture
def seeded_catalogue(db):
    call_command("seed_catalogue")
    return True


@pytest.mark.django_db
def test_seed_creates_categories(seeded_catalogue):
    assert Category.objects.filter(slug="composants-internes").exists()
    assert Category.objects.filter(slug="cpu").exists()
    assert Category.objects.filter(slug="stockage").exists()


@pytest.mark.django_db
def test_seed_storage_is_single_category(seeded_catalogue):
    """Storage must be ONE category — no SSD/NVMe/HDD split (spec §12)."""
    assert Category.objects.filter(slug="ssd").count() == 0
    assert Category.objects.filter(slug="nvme").count() == 0
    assert Category.objects.filter(slug="hdd").count() == 0
    assert Category.objects.filter(slug="stockage").count() == 1


@pytest.mark.django_db
def test_seed_creates_brands(seeded_catalogue):
    assert Brand.objects.filter(name="NVIDIA").exists()
    assert Brand.objects.filter(name="Corsair").exists()


@pytest.mark.django_db
def test_seed_creates_attributes(seeded_catalogue):
    cpu = Category.objects.get(slug="cpu")
    assert AttributeDefinition.objects.filter(category=cpu, key="cores").exists()
    gpu = Category.objects.get(slug="gpu")
    assert AttributeDefinition.objects.filter(category=gpu, key="vram").exists()


@pytest.mark.django_db
def test_category_tree_api(api_client, seeded_catalogue):
    resp = api_client.get(reverse("categories:category-tree"))
    assert resp.status_code == status.HTTP_200_OK
    top = next(c for c in resp.data if c["slug"] == "composants-internes")
    assert any(child["slug"] == "cpu" for child in top["children"])


@pytest.mark.django_db
def test_category_attributes_api(api_client, seeded_catalogue):
    resp = api_client.get(reverse("categories:category-attributes", args=["gpu"]))
    assert resp.status_code == status.HTTP_200_OK
    keys = {a["key"] for a in resp.data}
    assert "vram" in keys
    assert "ray_tracing" in keys


@pytest.mark.django_db
def test_brands_api(api_client, seeded_catalogue):
    resp = api_client.get(reverse("categories:brand-list"))
    assert resp.status_code == status.HTTP_200_OK
    assert any(b["name"] == "ASUS" for b in resp.data)
