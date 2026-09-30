"""Serializers for analytics API (spec §27, §37)."""
from rest_framework import serializers

from .models import DailyProductView, SearchQueryLog


class DailyViewSerializer(serializers.ModelSerializer):
    """Daily view aggregation."""

    class Meta:
        model = DailyProductView
        fields = ("date", "count")


class ProductAnalyticsSerializer(serializers.Serializer):
    """Full analytics payload for one product."""

    product_id = serializers.UUIDField()
    title = serializers.CharField()
    total_views = serializers.IntegerField()
    daily_views = DailyViewSerializer(many=True)


class SellerAnalyticsProductSerializer(serializers.Serializer):
    """Per-product analytics in a seller's dashboard (§37)."""

    product_id = serializers.UUIDField()
    title = serializers.CharField()
    total_views = serializers.IntegerField()
    phone_contacts = serializers.IntegerField()
    whatsapp_contacts = serializers.IntegerField()


class SellerAnalyticsSerializer(serializers.Serializer):
    """Aggregated analytics response for a seller (§27, §37)."""

    total_views = serializers.IntegerField()
    total_phone_contacts = serializers.IntegerField()
    total_whatsapp_contacts = serializers.IntegerField()
    product_count = serializers.IntegerField()
    products = SellerAnalyticsProductSerializer(many=True)


class AdminAnalyticsCategorySerializer(serializers.Serializer):
    """Per-category aggregate in the admin dashboard."""

    category__name = serializers.CharField()
    category__slug = serializers.CharField()
    views = serializers.IntegerField()
    products = serializers.IntegerField()


class TopSearchSerializer(serializers.Serializer):
    """A popular search query with its count."""

    query = serializers.CharField()
    search_count = serializers.IntegerField()


class AdminAnalyticsSerializer(serializers.Serializer):
    """Marketplace-wide analytics for staff (§44)."""

    total_views = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_sellers = serializers.IntegerField()
    total_shops = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    total_contacts = serializers.IntegerField()
    by_category = AdminAnalyticsCategorySerializer(many=True)
    top_searches = TopSearchSerializer(many=True)