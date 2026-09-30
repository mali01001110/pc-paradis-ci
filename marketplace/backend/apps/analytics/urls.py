"""URL routing for the analytics app."""
from django.urls import path

from . import views

app_name = "analytics"

urlpatterns = [
    path("analytics/admin/", views.AdminAnalyticsView.as_view(), name="admin-analytics"),
    path("analytics/sellers/me/", views.SellerAnalyticsView.as_view(), name="seller-analytics"),
    path("analytics/products/<uuid:pk>/", views.ProductAnalyticsView.as_view(), name="product-analytics"),
]