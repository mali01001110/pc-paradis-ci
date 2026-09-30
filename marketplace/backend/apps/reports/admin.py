"""Admin for reports app (spec §39, §44)."""
from django.contrib import admin

from .models import ProductReport, ReportStatus


@admin.register(ProductReport)
class ProductReportAdmin(admin.ModelAdmin):
    list_display = ("product", "reason", "reporter_email", "status", "created_at")
    list_filter = ("reason", "status")
    search_fields = ("product__title", "description")
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("product",)
    date_hierarchy = "created_at"
    actions = ("mark_resolved", "mark_dismissed")

    @admin.action(description="Marquer comme traité")
    def mark_resolved(self, request, queryset):
        updated = queryset.exclude(status=ReportStatus.RESOLVED).update(
            status=ReportStatus.RESOLVED
        )
        self.message_user(request, f"{updated} signalement(s) marqué(s) comme traité(s).")

    @admin.action(description="Rejeter / ignorer")
    def mark_dismissed(self, request, queryset):
        updated = queryset.exclude(status=ReportStatus.DISMISSED).update(
            status=ReportStatus.DISMISSED
        )
        self.message_user(request, f"{updated} signalement(s) ignoré(s).")
