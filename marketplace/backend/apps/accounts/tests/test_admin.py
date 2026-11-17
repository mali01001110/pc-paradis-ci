"""Tests for the Django admin interface (seller management, spec §38)."""
from datetime import timedelta

import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import PasswordResetCode, Seller, SellerStatus


@pytest.fixture
def admin_client(db, django_user_model):
    """A Django test client logged in as a superuser with admin access."""
    admin = django_user_model.objects.create_superuser(
        email="root-admin@example.com", password="Admin-Passw0rd!"
    )
    client = Client()
    client.force_login(admin)
    return client


@pytest.fixture
def sellers(seller_factory):
    """A mix of sellers with different statuses (all non-staff)."""
    pending = seller_factory(email="pending@example.com", status=SellerStatus.PENDING)
    active = seller_factory(email="active@example.com", status=SellerStatus.ACTIVE, email_verified=True)
    suspended = seller_factory(email="suspended@example.com", status=SellerStatus.SUSPENDED)
    return pending, active, suspended


def _post_action(client, action, pks):
    return client.post(
        reverse("admin:accounts_seller_changelist"),
        {"action": action, "_selected_action": [str(pk) for pk in pks]},
    )


@pytest.mark.django_db
class TestSellerAdminPages:
    def test_changelist_loads(self, admin_client):
        resp = admin_client.get(reverse("admin:accounts_seller_changelist"))
        assert resp.status_code == 200

    def test_changelist_shows_sellers(self, admin_client, seller_factory):
        seller_factory(email="visible@example.com", business_name="TechStore Abidjan")
        resp = admin_client.get(reverse("admin:accounts_seller_changelist"))
        assert resp.status_code == 200
        content = resp.content.decode()
        assert "visible@example.com" in content
        assert "TechStore Abidjan" in content

    def test_change_page_loads(self, admin_client, seller_factory):
        seller = seller_factory(email="editme@example.com")
        resp = admin_client.get(reverse("admin:accounts_seller_change", args=[seller.pk]))
        assert resp.status_code == 200
        assert "editme@example.com" in resp.content.decode()

    def test_changelist_requires_staff(self, seller_factory):
        seller = seller_factory(email="plain@example.com")
        client = Client()
        client.force_login(seller)
        resp = client.get(reverse("admin:accounts_seller_changelist"))
        assert resp.status_code == 302
        assert "/admin/login/" in resp.url


@pytest.mark.django_db
class TestSellerBulkActions:
    def test_activate_selected(self, admin_client, sellers):
        pending, _, suspended = sellers
        resp = _post_action(admin_client, "activate_selected", [pending.pk, suspended.pk])
        assert resp.status_code == 302
        pending.refresh_from_db()
        suspended.refresh_from_db()
        assert pending.status == SellerStatus.ACTIVE
        assert suspended.status == SellerStatus.ACTIVE

    def test_suspend_selected(self, admin_client, sellers):
        _, active, _ = sellers
        resp = _post_action(admin_client, "suspend_selected", [active.pk])
        assert resp.status_code == 302
        active.refresh_from_db()
        assert active.status == SellerStatus.SUSPENDED

    def test_ban_selected(self, admin_client, sellers):
        _, active, _ = sellers
        resp = _post_action(admin_client, "ban_selected", [active.pk])
        assert resp.status_code == 302
        active.refresh_from_db()
        assert active.status == SellerStatus.BANNED

    def test_bulk_actions_skip_superusers(self, admin_client, django_user_model, sellers):
        superuser = django_user_model.objects.get(email="root-admin@example.com")
        assert superuser.is_superuser
        for action in ("activate_selected", "suspend_selected", "ban_selected"):
            _post_action(admin_client, action, [superuser.pk])
            superuser.refresh_from_db()
            assert superuser.status == SellerStatus.ACTIVE


@pytest.mark.django_db
class TestPasswordResetCodeAdmin:
    def test_changelist_loads(self, admin_client, seller_factory):
        PasswordResetCode.objects.create(
            seller=seller_factory(email="resetter@example.com"),
            code_hash="a" * 128,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        resp = admin_client.get(reverse("admin:accounts_passwordresetcode_changelist"))
        assert resp.status_code == 200

    def test_code_hash_not_editable(self, admin_client, seller_factory):
        code = PasswordResetCode.objects.create(
            seller=seller_factory(email="hashcheck@example.com"),
            code_hash="b" * 128,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        resp = admin_client.get(reverse("admin:accounts_passwordresetcode_change", args=[code.pk]))
        assert resp.status_code == 200
        content = resp.content.decode()
        assert '<input type="text" name="code_hash"' not in content
