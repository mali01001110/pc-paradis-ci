"""URL routing for the categories app."""
from django.urls import path

from . import views

app_name = "categories"

urlpatterns = [
    path("categories/", views.CategoryTreeView.as_view(), name="category-tree"),
    path("categories/<slug:slug>/", views.CategoryDetailView.as_view(), name="category-detail"),
    path("categories/<slug:slug>/attributes/", views.CategoryAttributesView.as_view(), name="category-attributes"),
    path("brands/", views.BrandListView.as_view(), name="brand-list"),
]
