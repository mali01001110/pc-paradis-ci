"""API views for reports (spec §55 — Phase 8)."""
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product

from .models import ProductReport, ReportStatus
from .serializers import (
    ProductReportCreateSerializer,
    ProductReportSerializer,
    ReportStatusSerializer,
)


class ReportProductView(generics.CreateAPIView):
    """Public: report a listing by product slug (spec §55)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, product_slug):
        from apps.products.models import Product

        product = Product.objects.filter(slug=product_slug, is_deleted=False).first()
        if not product:
            return Response(
                {"detail": "Produit introuvable."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProductReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = ProductReport.objects.create(
            product=product,
            reason=serializer.validated_data["reason"],
            description=serializer.validated_data.get("description", ""),
            reporter_email=serializer.validated_data.get("reporter_email", ""),
        )
        return Response(
            {"id": str(report.id), "detail": "Signalement recu. Notre equipe va l'examiner."},
            status=status.HTTP_201_CREATED,
        )


class StaffReportListView(generics.ListAPIView):
    """Staff list of reports (spec §55)."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = ProductReportSerializer
    filterset_fields = ["status", "reason"]

    def get_queryset(self):
        return ProductReport.objects.select_related("product").order_by("-created_at")


class StaffReportUpdateView(generics.UpdateAPIView):
    """Staff: resolve/dismiss a report."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = ReportStatusSerializer
    http_method_names = ["patch", "options"]
    queryset = ProductReport.objects.all()

    def perform_update(self, serializer):
        serializer.save(handled_by=self.request.user)
