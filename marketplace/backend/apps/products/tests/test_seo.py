"""Tests for SEO endpoints (spec §47 — Phase 9)."""
import pytest
from django.core.management import call_command
from django.urls import reverse

from apps.categories.models import Brand, Category
from apps.products.models import Product


@pytest.fixture
def seeded(db):
    call_command("seed_catalogue")


@pytest.mark.django_db
def test_sitemap_xml(seeded, active_seller, api_client):
    category = Category.objects.get(slug="gpu")
    brand = Brand.objects.get(name="MSI")
    Product.objects.create(
        seller=active_seller, category=category, brand=brand,
        title="GPU SEO", price=1000, status="AVAILABLE",
    )
    resp = api_client.get("/sitemap.xml")
    assert resp.status_code == 200
    assert b"/products/" in resp.content


@pytest.mark.django_db
def test_robots_txt(api_client):
    resp = api_client.get("/robots.txt")
    assert resp.status_code == 200
    assert b"User-agent: *" in resp.content
    assert b"Disallow: /seller" in resp.content
    assert b"Sitemap:" in resp.content


@pytest.mark.django_db
def test_robots_disallows_admin_and_api(api_client):
    resp = api_client.get("/robots.txt")
    assert b"Disallow: /admin/" in resp.content
    assert b"Sitemap:" in resp.content
