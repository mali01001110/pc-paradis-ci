"""Tests for product reports API (spec §55 — Phase 8)."""
import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from apps.categories.models import Brand, Category
from apps.products.models import Product
from apps.reports.models import ProductReport


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
        "title": "GPU signale",
        "price": 100000,
        "condition": "OCCASION",
        "status": "AVAILABLE",
    }
    defaults.update(overrides)
    return Product.objects.create(**defaults)


@pytest.mark.django_db
def test_report_product_public(seeded, api_client, active_seller, gpu_category, gpu_brand):
    from apps.products.models import Product

    p = Product.objects.create(
        seller=active_seller,
        category=gpu_category,
        brand=gpu_brand,
        title="GPU signale",
        price=100000,
        status="AVAILABLE",
    )
    resp = api_client.post(
        reverse("reports:report-product", args=[p.slug]),
        {"reason": "FRAUD", "description": "Prix suspect", "reporter_email": "user@x.ci"},
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    assert ProductReport.objects.filter(product=p, reason="FRAUD").exists()


@pytest.mark.django_db
def test_report_unknown_product(seeded, api_client):
    resp = api_client.post(
        reverse("reports:report-product", args=["does-not-exist"]),
        {"reason": "FRAUD"},
        format="json",
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_report_invalid_reason(seeded, api_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = api_client.post(
        reverse("reports:report-product", args=[p.slug]),
        {"reason": "NOPE"},
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_report_list_requires_staff(seeded, api_client, auth_client):
    resp = api_client.get(reverse("reports:report-list"))
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    resp = auth_client.get(reverse("reports:report-list"))
    assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_staff_report_list_and_update(staff_client, active_seller, gpu_category, gpu_brand):
    p = Product.objects.create(
        seller=active_seller, category=gpu_category, title="GPU", price=100
    )
    ProductReport.objects.create(product=p, reason="FRAUD", description="Test")
    resp = staff_client.get(reverse("reports:report-list"))
    assert resp.status_code == status.HTTP_200_OK
    assert len(resp.data["results"]) == 1
    assert resp.data["results"][0]["reason"] == "FRAUD"


@pytest.mark.django_db
def test_staff_resolves_report(staff_client, staff_seller, active_seller, gpu_category, gpu_brand):
    p = Product.objects.create(
        seller=active_seller, category=gpu_category, title="GPU", price=100
    )
    report = ProductReport.objects.create(product=p, reason="FRAUD")
    resp = staff_client.patch(
        reverse("reports:report-update", args=[report.id]),
        {"status": "REVIEWED"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    report.refresh_from_db()
    assert report.status == "REVIEWED"
    assert report.handled_by == staff_seller


@pytest.mark.django_db
def test_staff_resolve_report(seeded, staff_client, active_seller, gpu_category, gpu_brand):
    p = Product.objects.create(
        seller=active_seller,
        category=gpu_category,
        title="GPU",
        price=100,
    )
    report = ProductReport.objects.create(product=p, reason="FRAUD", description="Test")
    resp = staff_client.patch(
        reverse("reports:report-update", args=[report.id]),
        {"status": "REVIEWED"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    report.refresh_from_db()
    assert report.status == "REVIEWED"
