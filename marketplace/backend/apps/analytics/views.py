"""API views for analytics (spec §27, §37, §44)."""
from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.products.models import Product

from .models import DailyProductView, SearchQueryLog


class ProductAnalyticsView(APIView):
    """Daily + total view analytics for one product (owner or staff, §27)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        if product.seller_id != request.user.id and not request.user.is_staff:
            return Response({"detail": "Accès refusé."}, status=403)

        daily = DailyProductView.objects.filter(product=product).order_by("-date")[:30]
        return Response(
            {
                "product_id": str(product.pk),
                "title": product.title,
                "total_views": product.views_count,
                "daily_views": [
                    {"date": row.date.isoformat(), "count": row.count} for row in daily
                ],
            }
        )


class SellerAnalyticsView(APIView):
    """Aggregated view + contact analytics for the authenticated seller (§27, §37)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = (
            Product.objects.filter(seller=request.user)
            .annotate(
                phone_contacts=Count(
                    "contact_events",
                    filter=Q(contact_events__contact_type="PHONE"),
                ),
                whatsapp_contacts=Count(
                    "contact_events",
                    filter=Q(contact_events__contact_type="WHATSAPP"),
                ),
            )
        )
        per_product = []
        for product in products.order_by("-views_count")[:50]:
            per_product.append(
                {
                    "product_id": str(product.pk),
                    "title": product.title,
                    "total_views": product.views_count,
                    "phone_contacts": product.phone_contacts,
                    "whatsapp_contacts": product.whatsapp_contacts,
                }
            )
        return Response(
            {
                "total_views": sum(p["total_views"] for p in per_product),
                "total_phone_contacts": sum(p["phone_contacts"] for p in per_product),
                "total_whatsapp_contacts": sum(p["whatsapp_contacts"] for p in per_product),
                "product_count": products.count(),
                "products": per_product,
            }
        )


class AdminAnalyticsView(APIView):
    """Marketplace-wide view analytics for staff (§44)."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from apps.accounts.models import Seller
        from apps.categories.models import Category
        from apps.contacts.models import ProductContactEvent
        from apps.shops.models import Shop

        totals = Product.objects.aggregate(total_views=Sum("views_count"))
        by_category = (
            Product.objects.values("category__name", "category__slug")
            .annotate(views=Sum("views_count"), products=Count("id"))
            .order_by("-views")
        )
        top_searches = (
            SearchQueryLog.objects.values("query")
            .annotate(search_count=Count("id"))
            .order_by("-search_count")[:10]
        )
        return Response(
            {
                "total_views": int(totals["total_views"] or 0),
                "total_products": Product.objects.count(),
                "total_sellers": Seller.objects.count(),
                "total_shops": Shop.objects.count(),
                "total_categories": Category.objects.count(),
                "total_contacts": ProductContactEvent.objects.count(),
                "by_category": list(by_category),
                "top_searches": list(top_searches),
            }
        )
