"""Serializers for products (spec §13-14, §35)."""
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from rest_framework import serializers

from apps.categories.models import Brand, Category

from .models import Product, ProductAttributeValue, ProductImage


def to_fcfa(price, currency) -> int:
    """Convert a product price to FCFA using the configured rates (Étape 5)."""
    rates = getattr(settings, "CURRENCY_RATES_TO_FCFA", {"FCFA": 1})
    rate = Decimal(str(rates.get(currency, 1)))
    return int((Decimal(price) * rate).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "is_primary", "sort_order")


class ProductAttributeSerializer(serializers.ModelSerializer):
    key = serializers.CharField(source="attribute.key", read_only=True)
    label = serializers.CharField(source="attribute.label", read_only=True)

    class Meta:
        model = ProductAttributeValue
        fields = ("id", "key", "label", "value")


class ProductListSerializer(serializers.ModelSerializer):
    """Compact representation for cards and lists (§34)."""

    image = serializers.SerializerMethodField()
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    seller_name = serializers.CharField(source="seller.business_name", read_only=True)
    price_fcfa = serializers.SerializerMethodField()
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "title",
            "price",
            "price_fcfa",
            "currency",
            "condition",
            "status",
            "city",
            "commune",
            "image",
            "brand_name",
            "category_name",
            "category_slug",
            "seller_name",
            "is_deleted",
            "created_at",
        )

    def get_image(self, obj):
        img = obj.primary_image()
        return img.url if img else None

    def get_price_fcfa(self, obj) -> int:
        return to_fcfa(obj.price, obj.currency)


class ProductSerializer(serializers.ModelSerializer):
    """Full product representation including attributes and images (§35)."""

    images = ProductImageSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source="brand", write_only=True, required=False, allow_null=True
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(parent__isnull=False),
        source="category",
        write_only=True,
    )
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    seller_name = serializers.CharField(source="seller.business_name", read_only=True)
    seller_id = serializers.IntegerField(source="seller.id", read_only=True)
    condition_display = serializers.CharField(source="get_condition_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    price_fcfa = serializers.SerializerMethodField()
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "title",
            "model",
            "description",
            "price",
            "price_fcfa",
            "currency",
            "condition",
            "condition_display",
            "status",
            "status_display",
            "city",
            "commune",
            "phone",
            "whatsapp",
            "views_count",
            "brand_id",
            "category_id",
            "brand_name",
            "category_name",
            "category_slug",
            "seller_name",
            "seller_id",
            "image",
            "images",
            "attributes",
            "is_deleted",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "views_count", "created_at", "updated_at")

    def get_image(self, obj):
        img = obj.primary_image()
        return img.url if img else None

    def get_price_fcfa(self, obj) -> int:
        return to_fcfa(obj.price, obj.currency)


class ProductAttributeWriteSerializer(serializers.Serializer):
    """Accepts a list of {attribute_id, value} for a product."""

    attribute = serializers.UUIDField()
    value = serializers.JSONField()


class ProductImageDeleteSerializer(serializers.Serializer):
    """Used only for OpenAPI schema — delete has no body."""

    pass


class ProductImageReorderSerializer(serializers.Serializer):
    """Reorder product images. body: { order: [uuid1, uuid2, ...] }."""

    order = serializers.ListField(child=serializers.UUIDField(), min_length=1)
