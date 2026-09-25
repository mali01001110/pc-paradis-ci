"""API views for the catalogue (spec §11, §30, §44)."""
from rest_framework import generics, permissions

from .models import AttributeDefinition, Brand, Category
from .serializers import AttributeDefinitionSerializer, BrandSerializer, CategoryNodeSerializer, CategorySerializer


class CategoryTreeView(generics.ListAPIView):
    """Top-level categories with nested children + attribute definitions."""

    serializer_class = CategoryNodeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(parent__isnull=True).order_by("sort_order", "name")


class CategoryDetailView(generics.RetrieveAPIView):
    """Single category (by slug) with children + attributes."""

    serializer_class = CategoryNodeSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    queryset = Category.objects.all()


class CategoryAttributesView(generics.ListAPIView):
    """Dynamic attribute definitions for a leaf category (spec §14)."""

    serializer_class = AttributeDefinitionSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return AttributeDefinition.objects.filter(category__slug=self.kwargs["slug"]).order_by(
            "sort_order", "label"
        )


class BrandListView(generics.ListAPIView):
    """List of brands (spec §56)."""

    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    queryset = Brand.objects.all().order_by("name")
