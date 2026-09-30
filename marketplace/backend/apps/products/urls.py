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
    path("products/me/<uuid:pk>/images/<uuid:image_id>/", views.ProductImageDeleteView.as_view(), name="my-product-image-delete"),
    path("products/me/<uuid:pk>/images/reorder/", views.ProductImageReorderView.as_view(), name="my-product-images-reorder"),
    # Public
    path("products/", views.PublicProductListView.as_view(), name="product-list"),
    # Public — SEO-friendly category-prefixed (must come before <slug:slug>)
    path("products/<slug:category_slug>/<slug:slug>/", views.PublicProductDetailView.as_view(), name="product-detail-seo"),
    path("products/<slug:slug>/", views.PublicProductDetailView.as_view(), name="product-detail"),
    # Moderation (staff)
    path("admin/stats/", views.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/products/", views.AdminModerationQueueView.as_view(), name="admin-products"),
    path("admin/products/<uuid:pk>/moderate/", views.ModerationActionView.as_view(), name="moderate-product"),
]
