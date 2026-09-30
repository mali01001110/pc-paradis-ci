"""API views for contact tracking (spec §27)."""
from django.db import models
from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product, ProductStatus

from .models import ProductContactEvent
from .serializers import LogContactSerializer, ProductContactEventSerializer


def get_client_ip(request) -> str | None:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class LogContactView(APIView):
    """Log a phone/WhatsApp contact on a public product (anyone can call)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, product_slug):
        serializer = LogContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = Product.objects.filter(
            slug=product_slug, status=ProductStatus.AVAILABLE, is_deleted=False
        ).first()
        if not product:
            return Response(
                {"detail": "Produit introuvable."}, status=status.HTTP_404_NOT_FOUND
            )
        ProductContactEvent.objects.create(
            product=product,
            contact_type=serializer.validated_data["contact_type"],
            ip_address=get_client_ip(request),
        )
        return Response({"detail": "Contact enregistré."}, status=status.HTTP_201_CREATED)


class SellerContactListView(generics.ListAPIView):
    """List contact events on the authenticated seller's products (spec §27)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProductContactEventSerializer

    def get_queryset(self):
        return (
            ProductContactEvent.objects.filter(
                product__seller=self.request.user
            )
            .select_related("product")
            .order_by("-created_at")
        )


class SellerContactStatsView(APIView):
    """Contact stats per product for the seller dashboard (spec §27)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        stats = (
            Product.objects.filter(seller=request.user)
            .annotate(
                total_contacts=Count("contact_events"),
                phone_contacts=Count(
                    "contact_events",
                    filter=models.Q(contact_events__contact_type="PHONE"),
                ),
                whatsapp_contacts=Count(
                    "contact_events",
                    filter=models.Q(contact_events__contact_type="WHATSAPP"),
                ),
            )
            .values(
                "id",
                "title",
                "slug",
                "views_count",
                "status",
                "total_contacts",
                "phone_contacts",
                "whatsapp_contacts",
            )
            .order_by("-total_contacts")
        )
        return Response(list(stats))