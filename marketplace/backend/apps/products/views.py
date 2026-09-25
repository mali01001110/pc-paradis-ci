"""API views for products (spec §13, §34-35, §40, §44)."""
import django_filters
from django.db import transaction
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.categories.models import AttributeDefinition

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
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    status = django_filters.CharFilter()

    class Meta:
        model = Product
        fields = ["category", "brand", "condition", "city", "commune", "shop", "status"]


class ProductFilterMixin:
    """Common filter/search/order configuration for product listing."""

    filterset_class = ProductFilterSet
    search_fields = ["title", "description", "model", "brand__name"]
    ordering_fields = ["price", "created_at", "views_count"]


class PublicProductListView(ProductFilterMixin, generics.ListAPIView):
    """Public product listing — only AVAILABLE products (spec §6)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return (
            Product.objects.filter(status=ProductStatus.AVAILABLE)
            .select_related("brand", "category", "seller")
            .prefetch_related("images")
        )


class PublicProductDetailView(generics.RetrieveAPIView):
    """Public product detail — increments view count (spec §35, §37)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer
    lookup_field = "slug"
    lookup_url_kwarg = "slug"

    def get_queryset(self):
        return Product.objects.filter(status=ProductStatus.AVAILABLE).select_related("brand", "category", "seller").prefetch_related("images", "attributes__attribute")

    def get_object(self):
        obj = super().get_object()
        Product.objects.filter(pk=obj.pk).update(views_count=obj.views_count + 1)
        obj.views_count += 1
        return obj


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
        return Product.objects.filter(seller=self.request.user).select_related("brand", "category")

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Seller's own product — retrieve, update, delete (§13)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProductSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user).select_related("brand", "category")

    def perform_destroy(self, instance):
        instance.images.all().delete()
        instance.delete()


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
        images = []
        is_first = not product.images.exists()
        for idx, f in enumerate(files):
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

    def delete(self, request, pk, image_id=None):
        product = get_object_or_404(Product, pk=pk, seller=request.user)
        img = get_object_or_404(ProductImage, pk=image_id, product=product)
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminModerationQueueView(ProductFilterMixin, generics.ListAPIView):
    """Moderation queue: every product, filterable by status (staff, §44)."""

    permission_classes = [permissions.IsAdminUser]
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "condition", "category", "city"]
    search_fields = ["title", "slug", "seller__email", "seller__business_name"]
    ordering_fields = ["created_at", "views_count", "price"]

    def get_queryset(self):
        return Product.objects.select_related("seller", "category", "brand").order_by(
            "-created_at"
        )


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
