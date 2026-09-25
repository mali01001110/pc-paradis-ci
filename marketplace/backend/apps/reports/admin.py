"""Admin for reports app."""
from django.contrib import admin

from .models import ProductReport


@admin.register(ProductReport)
class ProductReportAdmin(admin.ModelAdmin):
    list_display = ("product", "reason", "reporter_email", "status", "created_at")
    list_filter = ("reason", "status")
    search_fields = ("product__title", "description")
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("product",)
    date_hierarchy = "created_at"
