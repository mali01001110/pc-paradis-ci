"""Tests for the analytics app (spec §27, §44)."""
import pytest
from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from apps.analytics.models import DailyProductView
from apps.products.tests.test_products import make_product


@pytest.fixture
def seeded(db):
    call_command("seed_catalogue")


@pytest.fixture
def gpu_category(seeded):
    from apps.categories.models import Category

    return Category.objects.get(slug="gpu")


@pytest.fixture
def gpu_brand(seeded):
    from apps.categories.models import Brand

    return Brand.objects.get(name="MSI")


@pytest.mark.django_db
class TestDailyProductView:
    def test_increment_creates_then_increments(self, active_seller, gpu_category, gpu_brand):
        p = make_product(active_seller, gpu_category, gpu_brand)
        today = timezone.localdate()

        DailyProductView.increment_view(p.pk, today)
        DailyProductView.increment_view(p.pk, today)
        DailyProductView.increment_view(p.pk, today)

        row = DailyProductView.objects.get(product=p, date=today)
        assert row.count == 3

    def test_product_detail_records_daily_view(self, api_client, active_seller, gpu_category, gpu_brand):
        p = make_product(active_seller, gpu_category, gpu_brand)
        resp = api_client.get(reverse("products:product-detail", args=[p.slug]))
        assert resp.status_code == status.HTTP_200_OK

        today = timezone.localdate()
        row = DailyProductView.objects.get(product=p, date=today)
        assert row.count == 1
        p.refresh_from_db()
        assert p.views_count == 1


@pytest.mark.django_db
class TestProductAnalytics:
    def test_owner_can_read_product_analytics(self, auth_client, active_seller, gpu_category, gpu_brand):
        p = make_product(active_seller, gpu_category, gpu_brand)
        today = timezone.localdate()
        DailyProductView.increment_view(p.pk, today)
        from apps.products.models import Product

        Product.objects.filter(pk=p.pk).update(views_count=1)
        resp = auth_client.get(reverse("analytics:product-analytics", args=[p.pk]))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["total_views"] == 1
        assert resp.data["title"] == p.title
        assert len(resp.data["daily_views"]) == 1

    def test_other_seller_cannot_read(self, api_client, seller_factory, active_seller, gpu_category, gpu_brand):
        from rest_framework_simplejwt.tokens import RefreshToken

        other = seller_factory(email="other@example.com")
        p = make_product(active_seller, gpu_category, gpu_brand)
        client = api_client.__class__()
        refresh = RefreshToken.for_user(other)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        resp = client.get(reverse("analytics:product-analytics", args=[p.pk]))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_can_read_any(self, api_client, django_user_model, active_seller, gpu_category, gpu_brand):
        staff = django_user_model.objects.create_superuser(
            email="admin@example.com", password="Admin-Passw0rd!"
        )
        p = make_product(active_seller, gpu_category, gpu_brand)
        api_client.force_authenticate(user=staff)
        resp = api_client.get(reverse("analytics:product-analytics", args=[p.pk]))
        assert resp.status_code == status.HTTP_200_OK

    def test_requires_auth(self, api_client, active_seller, gpu_category, gpu_brand):
        p = make_product(active_seller, gpu_category, gpu_brand)
        resp = api_client.get(reverse("analytics:product-analytics", args=[p.pk]))
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestSellerAnalytics:
    def test_seller_sees_own_totals(self, auth_client, active_seller, gpu_category, gpu_brand):
        p1 = make_product(active_seller, gpu_category, gpu_brand, title="A")
        p2 = make_product(active_seller, gpu_category, gpu_brand, title="B")
        from apps.products.models import Product

        Product.objects.filter(pk=p1.pk).update(views_count=10)
        Product.objects.filter(pk=p2.pk).update(views_count=5)

        resp = auth_client.get(reverse("analytics:seller-analytics"))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["total_views"] == 15
        assert resp.data["product_count"] == 2
        titles = [p["title"] for p in resp.data["products"]]
        assert titles == ["A", "B"]

    def test_seller_sees_contact_breakdown(self, auth_client, active_seller, gpu_category, gpu_brand):
        """Le solde des clics téléphone/WhatsApp par produit (§37)."""
        from apps.contacts.models import ProductContactEvent

        p1 = make_product(active_seller, gpu_category, gpu_brand, title="A")
        p2 = make_product(active_seller, gpu_category, gpu_brand, title="B")
        ProductContactEvent.objects.create(product=p1, contact_type="PHONE")
        ProductContactEvent.objects.create(product=p1, contact_type="PHONE")
        ProductContactEvent.objects.create(product=p1, contact_type="WHATSAPP")

        resp = auth_client.get(reverse("analytics:seller-analytics"))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["total_phone_contacts"] == 2
        assert resp.data["total_whatsapp_contacts"] == 1
        by_title = {p["title"]: p for p in resp.data["products"]}
        assert by_title["A"]["phone_contacts"] == 2
        assert by_title["A"]["whatsapp_contacts"] == 1
        assert by_title["B"]["phone_contacts"] == 0
        assert by_title["B"]["whatsapp_contacts"] == 0

    def test_requires_auth(self, api_client):
        resp = api_client.get(reverse("analytics:seller-analytics"))
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestSearchQueryLog:
    def test_public_search_is_logged(self, api_client, active_seller, gpu_category, gpu_brand):
        from apps.analytics.models import SearchQueryLog

        make_product(active_seller, gpu_category, gpu_brand, title="RTX 4070")
        resp = api_client.get(reverse("products:product-list"), {"q": "RTX 4070"})
        assert resp.status_code == status.HTTP_200_OK
        log = SearchQueryLog.objects.get(query="RTX 4070")
        assert log.result_count == 1

    def test_empty_search_not_logged(self, api_client, active_seller, gpu_category, gpu_brand):
        from apps.analytics.models import SearchQueryLog

        make_product(active_seller, gpu_category, gpu_brand)
        api_client.get(reverse("products:product-list"), {"q": ""})
        assert SearchQueryLog.objects.count() == 0

    def test_long_query_truncated(self, api_client):
        from apps.analytics.models import SearchQueryLog

        resp = api_client.get(
            reverse("products:product-list"), {"q": "x" * 500}
        )
        assert resp.status_code == status.HTTP_200_OK
        assert SearchQueryLog.objects.count() == 1
        assert len(SearchQueryLog.objects.first().query) <= 200

    def test_admin_sees_top_searches(
        self, api_client, django_user_model, active_seller, gpu_category, gpu_brand
    ):
        from apps.analytics.models import SearchQueryLog

        make_product(active_seller, gpu_category, gpu_brand)
        api_client.get(reverse("products:product-list"), {"q": "RTX"})
        api_client.get(reverse("products:product-list"), {"q": "RTX"})
        api_client.get(reverse("products:product-list"), {"q": "DDR5"})

        staff = django_user_model.objects.create_superuser(
            email="admin3@example.com", password="Admin-Passw0rd!"
        )
        api_client.force_authenticate(user=staff)
        resp = api_client.get(reverse("analytics:admin-analytics"))
        assert resp.status_code == status.HTTP_200_OK
        searches = {row["query"]: row["search_count"] for row in resp.data["top_searches"]}
        assert searches["RTX"] == 2
        assert searches["DDR5"] == 1


@pytest.mark.django_db
class TestAdminAnalytics:
    def test_admin_sees_marketplace_totals(
        self, api_client, django_user_model, active_seller, gpu_category, gpu_brand
    ):
        staff = django_user_model.objects.create_superuser(
            email="admin2@example.com", password="Admin-Passw0rd!"
        )
        p = make_product(active_seller, gpu_category, gpu_brand)
        from apps.products.models import Product

        Product.objects.filter(pk=p.pk).update(views_count=7)

        api_client.force_authenticate(user=staff)
        resp = api_client.get(reverse("analytics:admin-analytics"))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["total_views"] == 7
        assert resp.data["total_products"] == 1
        assert resp.data["total_sellers"] >= 1
        assert "total_contacts" in resp.data
        assert resp.data["by_category"][0]["category__slug"] == "gpu"

    def test_rejects_non_staff(self, auth_client):
        resp = auth_client.get(reverse("analytics:admin-analytics"))
        assert resp.status_code == status.HTTP_403_FORBIDDEN