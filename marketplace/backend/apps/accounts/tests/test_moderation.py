"""Tests for seller moderation (suspend/ban) and seller listing (spec §44, §56)."""
import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from apps.accounts.models import SellerStatus
from apps.shops.models import Shop


@pytest.fixture
def seeded(db):
    call_command("seed_catalogue")


@pytest.fixture
def seller_shop(active_seller):
    """Active seller with a shop (created by seed)."""
    shop, _ = Shop.objects.get_or_create(
        seller=active_seller,
        defaults={
            "slug": "techstore-abidjan",
            "name": "TechStore Abidjan",
            "city": "Abidjan",
            "commune": "Cocody",
        },
    )
    return shop


@pytest.mark.django_db
class TestSellerModeration:
    def test_staff_can_suspend(self, api_client, django_user_model, active_seller, seller_shop):
        staff = django_user_model.objects.create_superuser(email="admin@example.com", password="Admin-Passw0rd!")
        api_client.force_authenticate(user=staff)
        resp = api_client.post(
            reverse("accounts:seller-moderate", args=[active_seller.pk]),
            {"action": "suspend", "reason": "Contenu non conforme."},
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == SellerStatus.SUSPENDED
        active_seller.refresh_from_db()
        assert active_seller.status == SellerStatus.SUSPENDED

    def test_staff_can_unsuspend(self, api_client, django_user_model, active_seller, seller_shop):
        active_seller.status = SellerStatus.SUSPENDED
        active_seller.save(update_fields=["status"])
        staff = django_user_model.objects.create_superuser(
            email="admin2@example.com", password="Admin-Passw0rd!"
        )
        api_client.force_authenticate(user=staff)
        resp = api_client.post(
            reverse("accounts:seller-moderate", args=[active_seller.pk]),
            {"action": "unsuspend"},
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == SellerStatus.ACTIVE
        active_seller.refresh_from_db()
        assert active_seller.status == SellerStatus.ACTIVE

    def test_staff_can_ban(self, api_client, django_user_model, active_seller, seller_shop):
        staff = django_user_model.objects.create_superuser(
            email="admin3@example.com", password="Admin-Passw0rd!"
        )
        api_client.force_authenticate(user=staff)
        resp = api_client.post(
            reverse("accounts:seller-moderate", args=[active_seller.pk]),
            {"action": "ban", "reason": "Fraude confirmée."},
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == SellerStatus.BANNED

    def test_staff_cannot_moderate_superuser(self, api_client, django_user_model, active_seller):
        staff = django_user_model.objects.create_superuser(email="admin4@example.com", password="Admin-Passw0rd!")
        api_client.force_authenticate(user=staff)
        resp = api_client.post(
            reverse("accounts:seller-moderate", args=[staff.pk]),
            {"action": "suspend"},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "administrateur" in resp.data["detail"]

    def test_invalid_action_returns_400(self, api_client, django_user_model, active_seller, seller_shop):
        staff = django_user_model.objects.create_superuser(email="admin5@example.com", password="Admin-Passw0rd!")
        api_client.force_authenticate(user=staff)
        resp = api_client.post(
            reverse("accounts:seller-moderate", args=[active_seller.pk]),
            {"action": "destroy"},
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_regular_seller_cannot_moderate(self, auth_client, seller_factory):
        target = seller_factory(email="target@example.com")
        resp = auth_client.post(
            reverse("accounts:seller-moderate", args=[target.pk]),
            {"action": "suspend"},
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_returns_401(self, api_client, seller_factory):
        target = seller_factory(email="target2@example.com")
        resp = api_client.post(
            reverse("accounts:seller-moderate", args=[target.pk]),
            {"action": "suspend"},
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestSellerListView:
    def test_lists_active_verified_sellers(self, api_client, active_seller, seller_shop):
        resp = api_client.get(reverse("accounts:seller-list"))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] >= 1
        emails = [s["business_name"] for s in resp.data["results"]]
        assert "TechStore Abidjan" in emails

    def test_excludes_suspended_sellers(self, api_client, active_seller, seller_shop):
        active_seller.status = SellerStatus.SUSPENDED
        active_seller.save(update_fields=["status"])
        resp = api_client.get(reverse("accounts:seller-list"))
        assert resp.status_code == status.HTTP_200_OK
        emails = [s["business_name"] for s in resp.data["results"]]
        assert "TechStore Abidjan" not in emails

    def test_excludes_unverified_sellers(self, api_client, seller_factory):
        unverified = seller_factory(email="unverified@example.com")
        Shop.objects.create(seller=unverified, slug="unverified-shop", name="Unverified", city="Abidjan")
        resp = api_client.get(reverse("accounts:seller-list"))
        emails = [s["business_name"] for s in resp.data["results"]]
        assert "Unverified" not in emails

    def test_no_auth_required(self, api_client):
        resp = api_client.get(reverse("accounts:seller-list"))
        assert resp.status_code == status.HTTP_200_OK

    def test_includes_city_and_product_count(self, api_client, seller_factory, seeded):
        from apps.categories.models import Brand, Category
        from apps.products.tests.test_products import make_product
        from apps.accounts.models import SellerStatus

        gpu_category = Category.objects.get(slug="gpu")
        gpu_brand = Brand.objects.get(name="MSI")
        seller = seller_factory(email="city@example.com", email_verified=True, status=SellerStatus.ACTIVE)
        Shop.objects.create(seller=seller, slug="city-shop-2", name="City Shop", city="Bouaké", commune="Centre")
        make_product(seller, gpu_category, gpu_brand, title="Test Product")
        resp = api_client.get(reverse("accounts:seller-list"))
        assert resp.status_code == 200
        results = resp.data.get("results", [])
        city_shops = [s for s in results if s.get("city") == "Bouaké"]
        assert len(city_shops) == 1, f"Expected 1, got {len(city_shops)}. Cities: {[s.get('city') for s in results]}"
        assert city_shops[0]["city"] == "Bouaké"
        assert city_shops[0]["product_count"] == 1


@pytest.mark.django_db
class TestStaffSellerListView:
    def test_requires_staff(self, api_client, auth_client):
        resp = api_client.get(reverse("accounts:seller-admin-list"))
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        resp = auth_client.get(reverse("accounts:seller-admin-list"))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_lists_all_sellers_with_status(self, api_client, django_user_model, seller_factory):
        staff = django_user_model.objects.create_superuser(
            email="admin@example.com", password="Admin-Passw0rd!"
        )
        active = seller_factory(email="active@example.com", email_verified=True, status=SellerStatus.ACTIVE)
        suspended = seller_factory(email="suspended@example.com", status=SellerStatus.SUSPENDED)

        api_client.force_authenticate(user=staff)
        resp = api_client.get(reverse("accounts:seller-admin-list"))
        assert resp.status_code == status.HTTP_200_OK
        by_email = {s["email"]: s for s in resp.data["results"]}
        assert by_email["active@example.com"]["status"] == SellerStatus.ACTIVE
        assert by_email["suspended@example.com"]["status"] == SellerStatus.SUSPENDED

    def test_filters_by_status(self, api_client, django_user_model, seller_factory):
        staff = django_user_model.objects.create_superuser(
            email="admin@example.com", password="Admin-Passw0rd!"
        )
        seller_factory(email="active@example.com", status=SellerStatus.ACTIVE)
        seller_factory(email="banned@example.com", status=SellerStatus.BANNED)

        api_client.force_authenticate(user=staff)
        resp = api_client.get(reverse("accounts:seller-admin-list"), {"status": "BANNED"})
        emails = [s["email"] for s in resp.data["results"]]
        assert "banned@example.com" in emails
        assert "active@example.com" not in emails

    def test_search_by_email(self, api_client, django_user_model, seller_factory):
        staff = django_user_model.objects.create_superuser(
            email="admin@example.com", password="Admin-Passw0rd!"
        )
        seller_factory(email="gamingstore@example.com", status=SellerStatus.ACTIVE)
        seller_factory(email="other@example.com", status=SellerStatus.ACTIVE)

        api_client.force_authenticate(user=staff)
        resp = api_client.get(reverse("accounts:seller-admin-list"), {"search": "gaming"})
        emails = [s["email"] for s in resp.data["results"]]
        assert "gamingstore@example.com" in emails
        assert "other@example.com" not in emails