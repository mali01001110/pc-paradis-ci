"""API views for products (spec §13, §34-35, §40, §44)."""
import django_filters
from django.conf import settings
from django.db import transaction
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from decimal import Decimal, ROUND_HALF_UP
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.categories.models import AttributeDefinition
from apps.images.processing import UnsupportedImageFormat, process_image

from . import search as search_module
from . import filters as filters_module
from .models import Product, ProductAttributeValue, ProductImage, ProductStatus
from .serializers import (
    ProductAttributeWriteSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductSerializer,
)


class ProductFilterSet(django_filters.FilterSet):
    """Explicit filters for public/seller product listing (spec §34)."""

    category = django_filters.CharFilter(field_name="category__slug")
    shop = django_filters.CharFilter(field_name="seller__shop__slug")
    brand = django_filters.CharFilter(field_name="brand__id")
    brand_slug = django_filters.CharFilter(field_name="brand__slug")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    status = django_filters.CharFilter()

    class Meta:
        model = Product
        fields = ["category", "brand", "brand_slug", "condition", "city", "commune", "shop", "status"]


class ProductFilterMixin:
    """Common filter/search/order configuration for product listing."""

    filterset_class = ProductFilterSet
    ordering_fields = ["price", "created_at", "views_count"]

    def _apply_fts(self, queryset):
        q = self.request.query_params.get("q", "").strip()
        return search_module.search_products(q, queryset)

    def _apply_attribute_filters(self, queryset):
        parsed = filters_module.parse_attribute_params(self.request.query_params)
        return filters_module.filter_products_by_attribute(queryset, parsed)


class PublicProductListView(ProductFilterMixin, generics.ListAPIView):
    """Public product listing — only AVAILABLE, non-deleted products (spec §6)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        base_qs = (
            Product.objects.filter(status=ProductStatus.AVAILABLE, is_deleted=False)
            .select_related("brand", "category", "seller")
            .prefetch_related("images")
        )
        return self._apply_attribute_filters(self._apply_fts(base_qs))

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Anonymized search tracking (spec §37) — no user/session data stored.
        query = (request.query_params.get("q") or "").strip()
        if query:
            from apps.analytics.models import SearchQueryLog

            SearchQueryLog.objects.create(
                query=query[:200],
                result_count=response.data.get("count", 0),
            )
        return response


class PublicProductDetailView(generics.RetrieveAPIView):
    """Public product detail — increments view count (spec §35, §37).

    Accepts both /products/<slug>/ (legacy) and /products/<category>/<slug>/
    (SEO-friendly, spec §46). When category_slug is present it is validated
    against the product's category; a mismatch returns 404 (canonical URL
    enforcement).
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer
    lookup_field = "slug"
    lookup_url_kwarg = "slug"

    def get_queryset(self):
        return (
            Product.objects.filter(status=ProductStatus.AVAILABLE, is_deleted=False)
            .select_related("brand", "category", "seller")
            .prefetch_related("images", "attributes__attribute")
        )

    def get_object(self):
        obj = super().get_object()
        Product.objects.filter(pk=obj.pk).update(views_count=obj.views_count + 1)
        obj.views_count += 1
        from apps.analytics.models import DailyProductView

        DailyProductView.increment_view(obj.pk, timezone.localdate())
        return obj

    def get(self, request, *args, **kwargs):
        category_slug = kwargs.get("category_slug")
        if category_slug:
            obj = self.get_object()
            if obj.category.slug != category_slug:
                return Response(
                    {"detail": "Produit introuvable pour cette catégorie."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(ProductSerializer(obj, context={"request": request}).data)
        return super().get(request, *args, **kwargs)


class SellerProductListView(ProductFilterMixin, generics.ListCreateAPIView):
    """Seller's own products — list and create (§36)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProductSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        base_qs = (
            Product.objects.filter(seller=self.request.user)
            .select_related("brand", "category")
            .prefetch_related("images")
        )
        return self._apply_attribute_filters(self._apply_fts(base_qs))

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Seller's own product — retrieve, update, soft delete (§13, §42)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProductSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user).select_related("brand", "category")

    def perform_destroy(self, instance):
        # Soft delete: keep the row (and its images) so it can be restored/audited.
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


class ProductAttributesView(APIView):
    """Set a product's dynamic attribute values (spec §14, §35)."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk, seller=request.user)
        serializer = ProductAttributeWriteSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        attr_ids = [item["attribute"] for item in serializer.validated_data]
        definitions = {str(a.pk): a for a in AttributeDefinition.objects.filter(pk__in=attr_ids)}

        with transaction.atomic():
            # Remove existing values not present in this submission.
            keep = [item["attribute"] for item in serializer.validated_data]
            product.attributes.exclude(attribute_id__in=keep).delete()
            for item in serializer.validated_data:
                attr = definitions.get(str(item["attribute"]))
                if attr is None:
                    continue
                ProductAttributeValue.objects.update_or_create(
                    product=product,
                    attribute=attr,
                    defaults={"value": item["value"]},
                )
        return Response({"detail": "Caractéristiques enregistrées."})


class ProductImageView(APIView):
    """Upload one or more images to a product (spec §40)."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk, seller=request.user)
        files = request.FILES.getlist("images")
        if not files:
            return Response({"detail": "Aucune image fournie."}, status=status.HTTP_400_BAD_REQUEST)
        for f in files:
            if f.size > 10 * 1024 * 1024:
                return Response(
                    {"detail": f"Image '{f.name}' dépasse 10 Mo."}, status=status.HTTP_400_BAD_REQUEST
                )
        images = []
        is_first = not product.images.exists()
        for idx, f in enumerate(files):
            try:
                f = process_image(f)
            except UnsupportedImageFormat as exc:
                return Response(
                    {"detail": f"Format image non supporté: {exc}"}, status=status.HTTP_400_BAD_REQUEST
                )
            img = ProductImage.objects.create(
                product=product,
                image=f,
                is_primary=is_first and idx == 0,
                sort_order=product.images.count() + idx,
            )
            images.append(img)
        return Response(
            ProductImageSerializer(images, many=True).data, status=status.HTTP_201_CREATED
        )


class ProductImageDeleteView(APIView):
    """Delete a single product image (spec §40)."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, image_id):
        product = get_object_or_404(Product, pk=pk, seller=request.user)
        img = get_object_or_404(ProductImage, pk=image_id, product=product)
        was_primary = img.is_primary
        img.delete()
        if was_primary:
            first_remaining = product.images.order_by("sort_order", "created_at").first()
            if first_remaining:
                first_remaining.is_primary = True
                first_remaining.save(update_fields=["is_primary"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageReorderView(APIView):
    """Reorder product images — body: {"order": [uuid1, uuid2, ...]} (spec §40)."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser]

    def patch(self, request, pk):
        from .serializers import ProductImageReorderSerializer

        product = get_object_or_404(Product, pk=pk, seller=request.user)
        serializer = ProductImageReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image_ids = serializer.validated_data["order"]
        existing = set(
            str(pk) for pk in product.images.values_list("pk", flat=True)
        )
        if set(str(i) for i in image_ids) != existing:
            return Response(
                {"detail": "Les IDs d'images ne correspondent pas au produit."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for idx, img_id in enumerate(image_ids):
            ProductImage.objects.filter(pk=img_id).update(sort_order=idx)
        first = product.images.order_by("sort_order", "created_at").first()
        if first:
            ProductImage.objects.filter(product=product).update(is_primary=False)
            ProductImage.objects.filter(pk=first.pk).update(is_primary=True)
        return Response({"detail": "Ordre enregistré."})


class AdminModerationQueueView(ProductFilterMixin, generics.ListAPIView):
    """Moderation queue: every product, filterable by status (staff, §44)."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "condition", "category", "city"]
    ordering_fields = ["created_at", "views_count", "price"]

    def get_queryset(self):
        base_qs = Product.objects.select_related("seller", "category", "brand").order_by(
            "-created_at"
        )
        return self._apply_attribute_filters(self._apply_fts(base_qs))


class ModerationActionView(APIView):
    """Staff moderation action on a product (approve/reject/hide/restore, §44)."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        mapping = {
            "approve": ProductStatus.AVAILABLE,
            "reject": ProductStatus.REJECTED,
            "hide": ProductStatus.HIDDEN,
            "restore": ProductStatus.AVAILABLE,
        }
        action = request.data.get("action")
        if action not in mapping:
            return Response(
                {"detail": "Action invalide. Choisir: approve, reject, hide, restore."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.status = mapping[action]
        product.save()
        return Response({"detail": "ok", "status": product.status})


class AdminStatsView(APIView):
    """Aggregated product stats for the admin dashboard (staff, §44)."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        by_status = {
            row["status"]: row["count"]
            for row in Product.objects.values("status").annotate(count=Count("id"))
        }
        totals = Product.objects.aggregate(total=Count("id"), views=Sum("views_count"))
        top_categories = (
            Product.objects.filter(is_deleted=False)
            .values("category__slug", "category__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )
        return Response(
            {
                "total_products": Product.objects.count(),
                "available": by_status.get(ProductStatus.AVAILABLE, 0),
                "sold": by_status.get(ProductStatus.SOLD, 0),
                "hidden": by_status.get(ProductStatus.HIDDEN, 0),
                "pending_review": by_status.get(ProductStatus.PENDING_REVIEW, 0),
                "rejected": by_status.get(ProductStatus.REJECTED, 0),
                "deleted": Product.objects.filter(is_deleted=True).count(),
                "total_views": int(totals["views"] or 0),
                "top_categories": [
                    {"slug": c["category__slug"], "name": c["category__name"], "count": c["count"]}
                    for c in top_categories
                ],
            }
        )
