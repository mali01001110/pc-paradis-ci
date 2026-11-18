"""API views for the catalogue (spec §11, §30, §44)."""
import logging

from django.core.cache import cache
from rest_framework import generics, permissions
from rest_framework.response import Response

from .models import AttributeDefinition, Brand, Category
from .serializers import AttributeDefinitionSerializer, BrandSerializer, CategoryNodeSerializer, CategorySerializer

logger = logging.getLogger(__name__)

TREE_TTL = 60 * 60           # 1 h
FILTER_OPTIONS_TTL = 30 * 60  # 30 min
BRANDS_TTL = 60 * 60         # 1 h


class FilterOptionsView(generics.RetrieveAPIView):
    """Filterable attribute definitions + observed distinct values for a category.

    Returns ``{category, filters: [{key, label, value_type, unit, options, values}]}``.
    ``values`` for select/multiselect attributes are the static ``options`` field.
    ``values`` for number attributes are observed distinct values from products.
    """

    serializer_class = None
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    queryset = Category.objects.all()

    def retrieve(self, request, *args, **kwargs):
        category = self.get_object()
        cache_key = f"filter-options:{category.slug}"
        data = None
        try:
            data = cache.get(cache_key)
        except Exception:
            logger.warning("Cache get failed for key=%s", cache_key, exc_info=True)
        if data is None:
            definitions = AttributeDefinition.objects.filter(
                category=category, filterable=True
            ).order_by("sort_order", "label")

            filters = []
            for d in definitions:
                entry = {
                    "key": d.key,
                    "label": d.label,
                    "value_type": d.value_type,
                    "unit": d.unit or "",
                    "options": d.options if d.options else [],
                    "values": self._distinct_values(d),
                }
                filters.append(entry)

            data = {"category": category.slug, "filters": filters}
            try:
                cache.set(cache_key, data, timeout=FILTER_OPTIONS_TTL)
            except Exception:
                logger.warning("Cache set failed for key=%s", cache_key, exc_info=True)
        return Response(data)

    def _distinct_values(self, definition: AttributeDefinition):
        if definition.value_type == "select":
            return definition.options if definition.options else []
        if definition.value_type in ("multiselect", "text"):
            return []
        # number: collect distinct observed values from published products
        if definition.value_type == "number":
            from django.db.models import Avg, Count

            vals = (
                definition.productattributevalue_set.filter(
                    product__status="AVAILABLE",
                    product__is_deleted=False,
                )
                .exclude(value__isnull=True)
                .values_list("value", flat=True)
                .distinct()
            )
            numbers = sorted({v for v in vals if isinstance(v, (int, float))})
            return numbers
        return []


class CategoryTreeView(generics.ListAPIView):
    """Top-level categories with nested children + attribute definitions."""

    serializer_class = CategoryNodeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(parent__isnull=True).order_by("sort_order", "name")

    def list(self, request, *args, **kwargs):
        cache_key = "category-tree"
        data = None
        try:
            data = cache.get(cache_key)
        except Exception:
            logger.warning("Cache get failed for key=%s", cache_key, exc_info=True)
        if not data:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data
            try:
                cache.set(cache_key, data, timeout=TREE_TTL)
            except Exception:
                logger.warning("Cache set failed for key=%s", cache_key, exc_info=True)
        return Response(data)


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


class BrandListView(generics.ListCreateAPIView):
    """List and create brands (spec §56)."""

    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    queryset = Brand.objects.all().order_by("name")

    def list(self, request, *args, **kwargs):
        cache_key = "brand-list"
        data = None
        try:
            data = cache.get(cache_key)
        except Exception:
            logger.warning("Cache get failed for key=%s", cache_key, exc_info=True)
        if data is None:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data
            try:
                cache.set(cache_key, data, timeout=BRANDS_TTL)
            except Exception:
                logger.warning("Cache set failed for key=%s", cache_key, exc_info=True)
        return Response(data)
