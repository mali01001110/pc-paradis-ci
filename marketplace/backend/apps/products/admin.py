"""Admin configuration for products (spec §38)."""
from django.contrib import admin

from .models import Product, ProductAttributeValue, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductAttributeInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "seller", "category", "brand", "price", "condition", "status", "created_at")
    list_filter = ("status", "condition", "category", "city")
    search_fields = ("title", "description", "seller__email", "slug")
    readonly_fields = ("id", "slug", "views_count", "created_at", "updated_at")
    inlines = [ProductImageInline, ProductAttributeInline]
    raw_id_fields = ("seller", "category", "brand")
    actions = ("approve_selected", "reject_selected", "hide_selected")

    @admin.action(description="Approuver (publier)")
    def approve_selected(self, request, queryset):
        updated = queryset.update(status="AVAILABLE")
        self.message_user(request, f"{updated} produit(s) approuve(s).")

    @admin.action(description="Rejeter")
    def reject_selected(self, request, queryset):
        updated = queryset.update(status="REJECTED")
        self.message_user(request, f"{updated} produit(s) rejete(s).")

    @admin.action(description="Masquer")
    def hide_selected(self, request, queryset):
        updated = queryset.update(status="HIDDEN")
        self.message_user(request, f"{updated} produit(s) masque(s).")


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "is_primary", "sort_order", "created_at")
    list_filter = ("is_primary",)


@admin.register(ProductAttributeValue)
class ProductAttributeValueAdmin(admin.ModelAdmin):
    list_display = ("product", "attribute", "value")
