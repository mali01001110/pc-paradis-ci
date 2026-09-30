from django.contrib import admin

from .models import DailyProductView, SearchQueryLog


@admin.register(DailyProductView)
class DailyProductViewAdmin(admin.ModelAdmin):
    list_display = ("product", "date", "count")
    list_filter = ("date",)
    search_fields = ("product__title",)
    ordering = ("-date",)


@admin.register(SearchQueryLog)
class SearchQueryLogAdmin(admin.ModelAdmin):
    """Search query log — anonymized, no user data (spec §37)."""

    list_display = ("query", "result_count", "created_at")
    list_filter = ("created_at",)
    search_fields = ("query",)
    ordering = ("-created_at",)
    readonly_fields = ("id", "query", "result_count", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
