"""API views for seller authentication (spec §5-§8, §44)."""
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from . import services
from .models import Seller, SellerProfile
from .permissions import IsSelf
from .serializers import (
    EnableMFASerializer,
    LoginSerializer,
    MFACodeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    SellerProfileSerializer,
    SellerSerializer,
)

SellerModel = get_user_model()


class RegisterView(APIView):
    """Create a seller account and send the email verification link (spec §6-§7)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        seller = serializer.save()
        token, raw = services.create_email_verification_token(seller)
        services.send_verification_email(seller, raw)
        return Response(
            {
                "detail": "Compte créé. Un email de confirmation a été envoyé.",
                "email": seller.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """Consume a verification token and activate the account (spec §7)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email_verify"

    def post(self, request, token):
        seller = services.verify_email_token(token)
        if seller is None:
            return Response(
                {"detail": "Lien de vérification invalide ou expiré."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Email confirmé. Votre compte est actif."})


class ResendVerificationView(APIView):
    """Resend the verification email (rate-limited) (spec §7)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email_verify"

    def post(self, request):
        email = request.data.get("email")
        try:
            seller = SellerModel.objects.get(email=email)
        except SellerModel.DoesNotExist:
            return Response({"detail": "Email envoyé si le compte existe."})
        if seller.email_verified:
            return Response({"detail": "Email déjà vérifié."})
        token, raw = services.create_email_verification_token(seller)
        services.send_verification_email(seller, raw)
        return Response({"detail": "Email de confirmation renvoyé."})


class LoginView(APIView):
    """Email + password login.

    If MFA is enabled, returns a challenge requiring an MFA code; otherwise
    returns access/refresh tokens directly (spec §8).
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        password = serializer.validated_data["password"]

        try:
            seller = SellerModel.objects.get(email=email)
        except SellerModel.DoesNotExist:
            return Response(
                {"detail": "Identifiants invalides."}, status=status.HTTP_401_UNAUTHORIZED
            )

        if not seller.check_password(password):
            return Response(
                {"detail": "Identifiants invalides."}, status=status.HTTP_401_UNAUTHORIZED
            )

        if not seller.can_login():
            return Response(
                {"detail": "Compte inactif ou non vérifié."}, status=status.HTTP_403_FORBIDDEN
            )

        if seller.mfa_enabled:
            code = services.create_mfa_code(seller)
            services.send_mfa_email(seller, code)
            return Response(
                {"detail": "Code de sécurité envoyé par email.", "mfa_required": True},
                status=status.HTTP_200_OK,
            )

        return self._issue_tokens(seller)

    @staticmethod
    def _issue_tokens(seller):
        refresh = RefreshToken.for_user(seller)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "mfa_required": False,
            }
        )


class MFAVerifyView(APIView):
    """Verify the one-time MFA code and issue tokens (spec §8)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "mfa"

    def post(self, request):
        serializer = MFACodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = request.data.get("email", "").lower()
        code = serializer.validated_data["code"]

        try:
            seller = SellerModel.objects.get(email=email)
        except SellerModel.DoesNotExist:
            return Response({"detail": "Code invalide."}, status=status.HTTP_401_UNAUTHORIZED)

        if not services.verify_mfa_code(seller, code):
            return Response({"detail": "Code invalide ou expiré."}, status=status.HTTP_401_UNAUTHORIZED)

        return LoginView._issue_tokens(seller)


class MFAResendView(APIView):
    """Resend the MFA code (rate-limited)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "mfa"

    def post(self, request):
        email = request.data.get("email", "").lower()
        try:
            seller = SellerModel.objects.get(email=email)
        except SellerModel.DoesNotExist:
            return Response({"detail": "Code renvoyé si le compte existe."})
        code = services.create_mfa_code(seller)
        services.send_mfa_email(seller, code)
        return Response({"detail": "Code de sécurité renvoyé."})


class LogoutView(APIView):
    """Logout — blacklist the refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except Exception:  # noqa: BLE001
                pass
        return Response({"detail": "Déconnecté."})


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated seller's profile (spec §9)."""

    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch"]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        return SellerSerializer

    def perform_update(self, serializer):
        seller = serializer.save()
        profile_data = self.request.data.get("profile", {})
        if profile_data:
            profile, _ = SellerProfile.objects.get_or_create(seller=seller)
            p_ser = SellerProfileSerializer(profile, data=profile_data, partial=True)
            p_ser.is_valid(raise_exception=True)
            p_ser.save()


class EnableMFAView(APIView):
    """Enable email MFA for the authenticated seller (spec §8)."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "mfa"

    def post(self, request):
        serializer = EnableMFASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["password"]):
            return Response(
                {"detail": "Mot de passe incorrect."}, status=status.HTTP_400_BAD_REQUEST
            )
        request.user.mfa_enabled = True
        request.user.save(update_fields=["mfa_enabled", "updated_at"])
        return Response({"detail": "MFA activée.", "mfa_enabled": True})


class DisableMFAView(APIView):
    """Disable email MFA for the authenticated seller."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "mfa"

    def post(self, request):
        serializer = EnableMFASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["password"]):
            return Response(
                {"detail": "Mot de passe incorrect."}, status=status.HTTP_400_BAD_REQUEST
            )
        request.user.mfa_enabled = False
        request.user.save(update_fields=["mfa_enabled", "updated_at"])
        return Response({"detail": "MFA désactivée.", "mfa_enabled": False})


class PasswordResetRequestView(APIView):
    """Request a password reset — emails a one-time code (spec §46)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email_verify"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        try:
            seller = SellerModel.objects.get(email=email)
        except SellerModel.DoesNotExist:
            return Response({"detail": "Code envoyé si le compte existe."})
        code = services.create_password_reset_code(seller)
        services.send_password_reset_email(seller, code)
        return Response({"detail": "Code de réinitialisation envoyé."})


class PasswordResetConfirmView(APIView):
    """Confirm a password reset with the emailed code (spec §46)."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email_verify"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        try:
            seller = SellerModel.objects.get(email=email)
        except SellerModel.DoesNotExist:
            return Response({"detail": "Code invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if not services.verify_password_reset_code(seller, serializer.validated_data["code"]):
            return Response({"detail": "Code invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)

        seller.set_password(serializer.validated_data["password"])
        seller.save(update_fields=["password", "updated_at"])
        return Response({"detail": "Mot de passe réinitialisé."})
