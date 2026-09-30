"""Serializers for seller authentication endpoints."""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from . import captcha
from .models import Seller, SellerProfile


class RegisterSerializer(serializers.ModelSerializer):
    """Seller registration (spec §6), protected by arithmetic CAPTCHA + honeypot."""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField()
    captcha_token = serializers.CharField(write_only=True)
    captcha_answer = serializers.CharField(write_only=True, trim_whitespace=True)
    # Honeypot: real users never see or fill this field.
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Seller
        fields = (
            "email",
            "first_name",
            "last_name",
            "business_name",
            "phone",
            "whatsapp",
            "password",
            "password2",
            "terms_accepted",
            "captcha_token",
            "captcha_answer",
            "website",
        )

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        if not attrs.get("terms_accepted"):
            raise serializers.ValidationError(
                {"terms_accepted": "Vous devez accepter les conditions d'utilisation."}
            )
        # Honeypot: any value means a bot filled the hidden field.
        if attrs.get("website"):
            raise serializers.ValidationError(
                {"captcha_answer": "Validation anti-robot échouée. Veuillez réessayer."}
            )
        if not captcha.verify_challenge(attrs.get("captcha_token"), attrs.get("captcha_answer")):
            raise serializers.ValidationError(
                {"captcha_answer": "Vérification anti-robot échouée. Merci de réessayer."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        validated_data.pop("captcha_token")
        validated_data.pop("captcha_answer")
        validated_data.pop("website", None)
        terms = validated_data.pop("terms_accepted")
        seller = Seller.objects.create_user(**validated_data)
        seller.terms_accepted = terms
        seller.save(update_fields=["terms_accepted", "updated_at"])
        return seller


class SellerProfileSerializer(serializers.ModelSerializer):
    """Seller public profile (spec §9)."""

    class Meta:
        model = SellerProfile
        fields = ("logo", "photo", "description", "city", "commune", "location")


class SellerSerializer(serializers.ModelSerializer):
    """Seller account summary."""

    profile = SellerProfileSerializer(read_only=True)

    class Meta:
        model = Seller
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "business_name",
            "phone",
            "whatsapp",
            "status",
            "email_verified",
            "mfa_enabled",
            "created_at",
            "profile",
        )
        read_only_fields = ("id", "email", "status", "email_verified", "created_at")


class LoginSerializer(serializers.Serializer):
    """Email + password login (spec §8 flow start)."""

    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False)


class MFACodeSerializer(serializers.Serializer):
    """One-time MFA code submission."""

    code = serializers.CharField(max_length=6, min_length=6)


class EnableMFASerializer(serializers.Serializer):
    """Enable/disable MFA — confirmed via the seller's current password."""

    password = serializers.CharField(trim_whitespace=False)


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request a password reset."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm a password reset."""

    email = serializers.EmailField()
    code = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """Change password for authenticated seller (spec §46)."""

    current_password = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate_new_password(self, value):
        if self.context["request"].user.check_password(value):
            raise serializers.ValidationError(
                "Le nouveau mot de passe doit être différent de l'actuel."
            )
        return value
