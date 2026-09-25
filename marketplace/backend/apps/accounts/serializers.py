"""Serializers for seller authentication endpoints."""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Seller, SellerProfile


class RegisterSerializer(serializers.ModelSerializer):
    """Seller registration (spec §6)."""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField()

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
        )

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        if not attrs.get("terms_accepted"):
            raise serializers.ValidationError(
                {"terms_accepted": "Vous devez accepter les conditions d'utilisation."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
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
