"""Serializers for reports app (spec §55)."""
from rest_framework import serializers

from .models import ProductReport, ReportReason


class ProductReportCreateSerializer(serializers.Serializer):
    """Public payload to report a listing."""

    reason = serializers.ChoiceField(choices=ReportReason.choices)
    description = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    reporter_email = serializers.EmailField(required=False, allow_blank=True)


class ProductReportSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_category_slug = serializers.CharField(source="product.category.slug", read_only=True)

    class Meta:
        model = ProductReport
        fields = (
            "id",
            "product",
            "product_title",
            "product_slug",
            "product_category_slug",
            "reporter_email",
            "reason",
            "description",
            "status",
            "created_at",
        )


class ReportStatusSerializer(serializers.Serializer):
    """Action payload for handling a report."""

    status = serializers.ChoiceField(choices=["REVIEWED", "DISMISSED", "OPEN"])

    def update(self, instance, validated_data):
        instance.status = validated_data["status"]
        instance.handled_by = validated_data.get("handled_by")
        instance.save()
        return instance
