"""Admin for contacts app."""
from django.contrib import admin

from .models import ProductContactEvent


@admin.register(ProductContactEvent)
class ProductContactEventAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "contact_type", "created_at")
    list_filter = ("contact_type", "created_at")
    search_fields = ("product__title",)
    date_hierarchy = "created_at"
    readonly_fields = ("id", "created_at")