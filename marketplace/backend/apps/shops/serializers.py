"""Serializers for shops (spec §10)."""
from rest_framework import serializers

from .models import Shop


class ShopSerializer(serializers.ModelSerializer):
    """Public shop representation (with product count via context)."""

    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            "slug",
            "name",
            "description",
            "logo",
            "phone",
            "whatsapp",
            "city",
            "commune",
            "location",
            "is_active",
            "product_count",
            "created_at",
        )
        read_only_fields = ("slug", "created_at")

    def get_product_count(self, obj) -> int:
        try:
            return obj.products.filter(status="AVAILABLE").count()
        except Exception:  # noqa: BLE001 — products model may not exist yet (Phase 5)
            return 0


class MyShopSerializer(ShopSerializer):
    """Shop representation for the owner (includes slug)."""

    class Meta(ShopSerializer.Meta):
        read_only_fields = ("slug", "created_at")
