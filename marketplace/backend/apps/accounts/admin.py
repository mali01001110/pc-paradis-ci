"""Admin configuration for seller accounts."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import EmailVerificationToken, MFACode, Seller, SellerProfile


@admin.register(Seller)
class SellerAdmin(UserAdmin):
    """Django admin for sellers (spec §38 - admin manages sellers)."""

    ordering = ["email"]
    list_display = ("email", "business_name", "status", "email_verified", "mfa_enabled", "created_at")
    list_filter = ("status", "email_verified", "mfa_enabled", "is_staff")
    search_fields = ("email", "first_name", "last_name", "business_name", "phone")
    readonly_fields = ("id", "created_at", "updated_at", "last_login")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identité", {"fields": ("first_name", "last_name", "business_name", "phone", "whatsapp")}),
        ("Statut", {"fields": ("status", "email_verified", "mfa_enabled", "terms_accepted", "is_active")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ("seller", "city", "commune", "location")
    search_fields = ("seller__email", "city", "commune")


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("seller", "created_at", "expires_at", "used")
    list_filter = ("used",)
    readonly_fields = ("id", "token_hash", "created_at")


@admin.register(MFACode)
class MFACodeAdmin(admin.ModelAdmin):
    list_display = ("seller", "created_at", "expires_at", "used", "attempts")
    list_filter = ("used",)
    readonly_fields = ("id", "code_hash", "created_at")
