"""Tests for contact tracking API (spec §27)."""
import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from apps.categories.models import Brand, Category
from apps.contacts.models import ProductContactEvent
from apps.products.models import Product


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
        "price": 450000,
        "condition": "OCCASION",
        "status": "AVAILABLE",
    }
    defaults.update(overrides)
    return Product.objects.create(**defaults)


@pytest.mark.django_db
def test_log_contact_unknown_product(seeded, api_client):
    resp = api_client.post(
        reverse("contacts:log-contact", kwargs={"product_slug": "does-not-exist"}),
        {"contact_type": "PHONE"},
        format="json",
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_log_phone_contact(seeded, api_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = api_client.post(
        reverse("contacts:log-contact", kwargs={"product_slug": p.slug}),
        {"contact_type": "PHONE"},
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    assert ProductContactEvent.objects.filter(product=p, contact_type="PHONE").exists()


@pytest.mark.django_db
def test_log_whatsapp_contact(seeded, api_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = api_client.post(
        reverse("contacts:log-contact", kwargs={"product_slug": p.slug}),
        {"contact_type": "WHATSAPP"},
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    assert ProductContactEvent.objects.filter(product=p, contact_type="WHATSAPP").exists()


@pytest.mark.django_db
def test_log_contact_invalid_type(seeded, api_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = api_client.post(
        reverse("contacts:log-contact", kwargs={"product_slug": p.slug}),
        {"contact_type": "EMAIL"},
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_log_contact_on_sold_product_404(seeded, api_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand, status="SOLD")
    resp = api_client.post(
        reverse("contacts:log-contact", kwargs={"product_slug": p.slug}),
        {"contact_type": "PHONE"},
        format="json",
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_seller_contact_list(seeded, auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand, title="Mon GPU")
    ProductContactEvent.objects.create(product=p, contact_type="PHONE")
    resp = auth_client.get(reverse("contacts:contact-list"))
    assert resp.status_code == status.HTTP_200_OK
    assert len(resp.data["results"]) == 1
    assert resp.data["results"][0]["product_title"] == "Mon GPU"


@pytest.mark.django_db
def test_seller_contact_stats(seeded, auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand, title="GPU stat")
    ProductContactEvent.objects.create(product=p, contact_type="PHONE")
    ProductContactEvent.objects.create(product=p, contact_type="WHATSAPP")
    resp = auth_client.get(reverse("contacts:contact-stats"))
    assert resp.status_code == status.HTTP_200_OK
    stats = {s["title"]: s for s in resp.data}
    assert stats["GPU stat"]["total_contacts"] == 2
    assert stats["GPU stat"]["phone_contacts"] == 1
    assert stats["GPU stat"]["whatsapp_contacts"] == 1


@pytest.mark.django_db
def test_contact_list_requires_auth(api_client):
    resp = api_client.get(reverse("contacts:contact-list"))
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
