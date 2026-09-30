"""URL routing for the accounts app (auth endpoints)."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = "accounts"

urlpatterns = [
    path("auth/captcha/", views.CaptchaChallengeView.as_view(), name="captcha"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/verify-email/<str:token>/", views.VerifyEmailView.as_view(), name="verify-email"),
    path("auth/resend-verification/", views.ResendVerificationView.as_view(), name="resend-verification"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/mfa/verify/", views.MFAVerifyView.as_view(), name="mfa-verify"),
    path("auth/mfa/resend/", views.MFAResendView.as_view(), name="mfa-resend"),
    path("auth/mfa/enable/", views.EnableMFAView.as_view(), name="mfa-enable"),
    path("auth/mfa/disable/", views.DisableMFAView.as_view(), name="mfa-disable"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/password/reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path(
        "auth/password/reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("auth/me/profile-image/", views.SellerProfileImageView.as_view(), name="me-profile-image"),
    path("auth/password/change/", views.PasswordChangeView.as_view(), name="password-change"),
    # Moderation (staff, spec §44)
    path("auth/admin/sellers/", views.StaffSellerListView.as_view(), name="seller-admin-list"),
    path("auth/admin/sellers/<uuid:pk>/moderate/", views.SellerModerationActionView.as_view(), name="seller-moderate"),
    # Public
    path("sellers/", views.SellerListView.as_view(), name="seller-list"),
]
