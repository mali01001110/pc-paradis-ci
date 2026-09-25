"""URL routing for products."""
from django.urls import path

from . import views

app_name = "products"

urlpatterns = [
    # Seller (must be registered before <slug:slug> so "me" is not captured)
    path("products/me/", views.SellerProductListView.as_view(), name="my-products"),
    path("products/me/<uuid:pk>/", views.SellerProductDetailView.as_view(), name="my-product-detail"),
    path("products/me/<uuid:pk>/attributes/", views.ProductAttributesView.as_view(), name="my-product-attributes"),
    path("products/me/<uuid:pk>/images/", views.ProductImageView.as_view(), name="my-product-images"),
    # Public
    path("products/", views.PublicProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", views.PublicProductDetailView.as_view(), name="product-detail"),
    # Moderation (staff)
    path("admin/products/", views.AdminModerationQueueView.as_view(), name="admin-products"),
    path("admin/products/<uuid:pk>/moderate/", views.ModerationActionView.as_view(), name="moderate-product"),
]
