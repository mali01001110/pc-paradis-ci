"""Serializers for contacts app (spec §27)."""
from rest_framework import serializers

from .models import ProductContactEvent


class ProductContactEventSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)

    class Meta:
        model = ProductContactEvent
        fields = ("id", "product_title", "contact_type", "created_at")


class LogContactSerializer(serializers.Serializer):
    """Log a new contact event on a product."""

    contact_type = serializers.ChoiceField(choices=["PHONE", "WHATSAPP"])