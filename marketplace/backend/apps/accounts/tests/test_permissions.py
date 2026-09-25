"""Tests for custom DRF permissions."""
import pytest
from django.contrib.auth.models import AnonymousUser

from apps.accounts.models import SellerStatus
from apps.accounts.permissions import IsSelf, IsVerifiedSeller


class FakeRequest:
    def __init__(self, user):
        self.user = user


class DummyView:
    pass


@pytest.mark.django_db
class TestIsVerifiedSeller:
    def test_anonymous_user_denied(self):
        assert IsVerifiedSeller().has_permission(FakeRequest(AnonymousUser()), DummyView()) is False

    def test_unverified_seller_denied(self, seller_factory):
        seller = seller_factory(email_verified=False, status=SellerStatus.ACTIVE)
        assert IsVerifiedSeller().has_permission(FakeRequest(seller), DummyView()) is False

    def test_verified_seller_allowed(self, active_seller):
        assert IsVerifiedSeller().has_permission(FakeRequest(active_seller), DummyView()) is True


@pytest.mark.django_db
class TestIsSelf:
    def test_other_object_denied(self, active_seller, seller_factory):
        other = seller_factory(email="other@example.com")
        assert IsSelf().has_object_permission(FakeRequest(active_seller), DummyView(), other) is False

    def test_own_object_allowed(self, active_seller):
        assert IsSelf().has_object_permission(FakeRequest(active_seller), DummyView(), active_seller) is True

    def test_anonymous_denied(self, active_seller):
        assert IsSelf().has_object_permission(FakeRequest(None), DummyView(), active_seller) is False
