"""Admin configuration for shops (spec §38)."""
from django.contrib import admin

from .models import Shop


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "seller", "city", "commune", "is_active", "created_at")
    list_filter = ("is_active", "city")
    search_fields = ("name", "slug", "seller__email", "commune")
    readonly_fields = ("slug", "created_at", "updated_at")
