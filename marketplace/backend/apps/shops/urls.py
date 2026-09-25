"""URL routing for the shops app."""
from django.urls import path

from . import views

app_name = "shops"

urlpatterns = [
    path("shops/me/", views.MyShopView.as_view(), name="my-shop"),
    path("shops/<slug:slug>/", views.PublicShopView.as_view(), name="shop-detail"),
]
