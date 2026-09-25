"""URL routing for the accounts app (auth endpoints)."""
from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/verify-email/<str:token>/", views.VerifyEmailView.as_view(), name="verify-email"),
    path("auth/resend-verification/", views.ResendVerificationView.as_view(), name="resend-verification"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
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
]
