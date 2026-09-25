"""Sitemaps for SEO (spec §47 — Phase 9)."""
from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from apps.categories.models import Category
from apps.products.models import Product, ProductStatus
from apps.shops.models import Shop


class StaticViewSitemap(Sitemap):
    priority = 1.0
    changefreq = "daily"

    def items(self):
        return ["/", "/auth/register"]

    def location(self, item):
        return item


class ProductSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.9

    def items(self):
        return Product.objects.filter(status=ProductStatus.AVAILABLE).only("slug", "updated_at")

    def location(self, obj):
        return f"/products/{obj.slug}"

    def lastmod(self, obj):
        return obj.updated_at


class ShopSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return Shop.objects.filter(is_active=True).order_by("slug")

    def location(self, obj):
        return f"/shop/{obj.slug}"

    def lastmod(self, obj):
        return obj.updated_at


class CategorySitemap(Sitemap):
    changefreq = "daily"
    priority = 0.7

    def items(self):
        from apps.categories.models import Category

        return Category.objects.all()

    def location(self, obj):
        return f"/?cat={obj.slug}"
