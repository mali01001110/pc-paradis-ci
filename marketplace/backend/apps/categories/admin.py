"""Admin configuration for the catalogue (spec §38)."""
from django.contrib import admin

from .models import AttributeDefinition, Brand, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "sort_order")
    list_filter = ("parent",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(AttributeDefinition)
class AttributeDefinitionAdmin(admin.ModelAdmin):
    list_display = ("label", "key", "category", "value_type", "required", "filterable")
    list_filter = ("category", "value_type")
    search_fields = ("label", "key")
