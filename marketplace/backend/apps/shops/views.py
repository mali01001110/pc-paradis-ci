"""API views for shops (spec §10)."""
import logging

from django.core.cache import cache
from rest_framework import generics, permissions
from rest_framework.response import Response

from .models import Shop
from .serializers import ShopSerializer, MyShopSerializer

logger = logging.getLogger(__name__)

SHOP_TTL = 10 * 60  # 10 min


class MyShopView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated seller's shop (auto-creates on GET)."""

    serializer_class = MyShopSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        shop, created = Shop.objects.get_or_create(
            seller=self.request.user,
            defaults={"name": self.request.user.business_name or f"Boutique de {self.request.user.first_name or self.request.user.email}"},
        )
        return shop


class PublicShopView(generics.RetrieveAPIView):
    """Public shop page data at /shop/<slug>/ (no auth, spec §10)."""

    serializer_class = ShopSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    queryset = Shop.objects.filter(is_active=True)

    def retrieve(self, request, *args, **kwargs):
        shop = self.get_object()
        cache_key = f"shop:{shop.slug}"
        data = None
        try:
            data = cache.get(cache_key)
        except Exception:
            logger.warning("Cache get failed for key=%s", cache_key, exc_info=True)
        if data is None:
            serializer = self.get_serializer(shop)
            data = serializer.data
            try:
                cache.set(cache_key, data, timeout=SHOP_TTL)
            except Exception:
                logger.warning("Cache set failed for key=%s", cache_key, exc_info=True)
        return Response(data)
