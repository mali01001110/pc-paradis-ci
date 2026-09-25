"""API views for shops (spec §10)."""
from rest_framework import generics, permissions

from .models import Shop
from .serializers import ShopSerializer, MyShopSerializer


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
