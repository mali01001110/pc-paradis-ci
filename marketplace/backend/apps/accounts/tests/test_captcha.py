"""Tests for the arithmetic CAPTCHA protecting registration (Étape 5)."""
import pytest
from django.urls import reverse
from rest_framework import status


def solve_captcha(api_client):
    """Fetch a challenge and compute its answer."""
    resp = api_client.get(reverse("accounts:captcha"))
    question = resp.data["question"]
    a, op, b = question.split()
    answer = int(a) + int(b) if op == "+" else int(a) - int(b)
    return {"captcha_token": resp.data["token"], "captcha_answer": str(answer)}


def register_payload(**overrides):
    base = {
        "email": "vendeur@exemple.ci",
        "first_name": "Jean",
        "last_name": "Kouassi",
        "business_name": "TechStore",
        "phone": "+2250708091011",
        "whatsapp": "+2250708091011",
        "password": "S3cur3-Passw0rd!",
        "password2": "S3cur3-Passw0rd!",
        "terms_accepted": True,
    }
    base.update(overrides)
    return base


@pytest.mark.django_db
def test_captcha_endpoint_returns_challenge(api_client):
    resp = api_client.get(reverse("accounts:captcha"))
    assert resp.status_code == status.HTTP_200_OK
    assert "+" in resp.data["question"] or "-" in resp.data["question"]
    assert resp.data["token"]


@pytest.mark.django_db
def test_register_without_captcha_is_rejected(api_client):
    resp = api_client.post(reverse("accounts:register"), register_payload(), format="json")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "captcha_answer" in resp.data


@pytest.mark.django_db
def test_register_with_wrong_answer_is_rejected(api_client):
    resp = api_client.post(
        reverse("accounts:register"),
        {**register_payload(), "captcha_token": "fake", "captcha_answer": "99"},
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_register_with_valid_captcha_succeeds(api_client):
    resp = api_client.post(
        reverse("accounts:register"), {**register_payload(), **solve_captcha(api_client)}, format="json"
    )
    assert resp.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_register_with_filled_honeypot_is_rejected(api_client):
    resp = api_client.post(
        reverse("accounts:register"),
        {**register_payload(), **solve_captcha(api_client), "website": "http://spam.tld"},
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_register_with_tampered_token_is_rejected(api_client):
    fields = solve_captcha(api_client)
    resp = api_client.post(
        reverse("accounts:register"),
        {**register_payload(), "captcha_token": fields["captcha_token"] + "tampered", "captcha_answer": fields["captcha_answer"]},
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
