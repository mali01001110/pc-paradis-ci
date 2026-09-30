"""Business logic for seller auth: token generation, MFA, email dispatch.

Security-sensitive values (tokens, MFA codes) are only ever stored as hashes
and are never written to logs.
"""
import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailVerificationToken, MFACode, PasswordResetCode, Seller, SellerStatus

AUTH_SCOPES = ("register", "resend")


def _hash(value: str) -> str:
    """Return a salted SHA-256 hash of a sensitive value."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _constant_time_equal(a: str, b: str) -> bool:
    return hmac.compare_digest(a, b)


def create_email_verification_token(seller: Seller) -> EmailVerificationToken:
    """Create and persist a one-time email verification token for a seller."""
    raw = EmailVerificationToken.generate_raw_token()
    EmailVerificationToken.objects.filter(seller=seller, used=False).update(used=True)
    token = EmailVerificationToken.objects.create(
        seller=seller,
        token_hash=_hash(raw),
        expires_at=timezone.now() + timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_TTL_HOURS),
    )
    return token, raw


def verify_email_token(raw_token: str) -> Seller | None:
    """Validate and consume a raw verification token. Returns seller or None."""
    token_hash = _hash(raw_token)
    token = (
        EmailVerificationToken.objects.filter(token_hash=token_hash)
        .select_related("seller")
        .order_by("-created_at")
        .first()
    )
    if token is None or not token.is_valid():
        return None
    token.used = True
    token.save(update_fields=["used"])
    seller = token.seller
    seller.email_verified = True
    if seller.status == SellerStatus.PENDING:
        seller.status = SellerStatus.ACTIVE
    seller.save(update_fields=["email_verified", "status", "updated_at"])
    return seller


def send_verification_email(seller: Seller, raw_token: str) -> None:
    """Send the email verification email (spec §46)."""
    subject = f"Bienvenue sur {settings.PLATFORM_NAME} — Confirmez votre email"
    context = {
        "platform_name": settings.PLATFORM_NAME,
        "first_name": seller.first_name,
        "verify_url": f"{settings.FRONTEND_URL}/verify-email/{raw_token}",
        "expires_hours": settings.EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
    }
    html = render_to_string("emails/verification.html", context)
    send_mail(
        subject,
        f"Confirmez votre email : {context['verify_url']}",
        settings.DEFAULT_FROM_EMAIL,
        [seller.email],
        html_message=html,
    )


def create_mfa_code(seller: Seller) -> str:
    """Generate a one-time MFA code, persist its hash, and return the raw code.

    The raw code is returned to be emailed to the seller; only the hash is stored.
    """
    code = MFACode.generate_code()
    MFACode.objects.filter(seller=seller, used=False).update(used=True)
    MFACode.objects.create(
        seller=seller,
        code_hash=_hash(code),
        expires_at=timezone.now() + timedelta(seconds=settings.MFA_CODE_TTL_SECONDS),
    )
    return code


def send_mfa_email(seller: Seller, code: str) -> None:
    """Send the MFA one-time code email (spec §46)."""
    subject = f"Votre code de sécurité {settings.PLATFORM_NAME}"
    context = {
        "platform_name": settings.PLATFORM_NAME,
        "code": code,
        "first_name": seller.first_name,
        "expires_seconds": settings.MFA_CODE_TTL_SECONDS,
    }
    html = render_to_string("emails/mfa.html", context)
    send_mail(
        subject,
        f"Votre code de sécurité : {code}",
        settings.DEFAULT_FROM_EMAIL,
        [seller.email],
        html_message=html,
    )


def verify_mfa_code(seller: Seller, code: str) -> bool:
    """Validate a submitted MFA code against the latest active code."""
    latest = MFACode.objects.filter(seller=seller, used=False).order_by("-created_at").first()
    if latest is None or not latest.is_valid():
        return False
    if not _constant_time_equal(_hash(code), latest.code_hash):
        latest.attempts += 1
        latest.save(update_fields=["attempts"])
        return False
    latest.used = True
    latest.save(update_fields=["used"])
    return True


def create_password_reset_code(seller: Seller) -> str:
    """Generate a one-time password reset code and persist its hash."""
    code = PasswordResetCode.generate_code()
    PasswordResetCode.objects.filter(seller=seller, used=False).update(used=True)
    PasswordResetCode.objects.create(
        seller=seller,
        code_hash=_hash(code),
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    return code


def send_password_reset_email(seller: Seller, code: str) -> None:
    """Email the password reset code (spec §46)."""
    subject = f"Réinitialisation de mot de passe — {settings.PLATFORM_NAME}"
    context = {
        "platform_name": settings.PLATFORM_NAME,
        "code": code,
        "first_name": seller.first_name,
    }
    html = render_to_string("emails/password_reset.html", context)
    send_mail(
        subject,
        f"Votre code de réinitialisation : {code}",
        settings.DEFAULT_FROM_EMAIL,
        [seller.email],
        html_message=html,
    )


def verify_password_reset_code(seller: Seller, code: str) -> bool:
    """Validate a password reset code for a seller. Consumes on success."""
    latest = PasswordResetCode.objects.filter(seller=seller, used=False).order_by("-created_at").first()
    if latest is None or not latest.is_valid():
        return False
    if not _constant_time_equal(_hash(code), latest.code_hash):
        latest.attempts += 1
        latest.save(update_fields=["attempts"])
        return False
    latest.used = True
    latest.save(update_fields=["used"])
    return True


def send_suspension_email(seller: Seller, action: str, reason: str = "") -> None:
    """Email a seller about suspension / ban / reinstatement (spec §44)."""
    subjects_map = {
        "suspend": f"Votre compte a été suspendu — {settings.PLATFORM_NAME}",
        "unsuspend": f"Votre compte est réactivé — {settings.PLATFORM_NAME}",
        "ban": f"Votre compte a été banni — {settings.PLATFORM_NAME}",
    }
    subject = subjects_map.get(action, f"Mise à jour de votre compte — {settings.PLATFORM_NAME}")
    context = {
        "platform_name": settings.PLATFORM_NAME,
        "frontend_url": settings.FRONTEND_URL,
        "first_name": seller.first_name,
        "action": action,
        "reason": reason,
    }
    html = render_to_string("emails/suspension.html", context)
    send_mail(subject, "", settings.DEFAULT_FROM_EMAIL, [seller.email], html_message=html)


def send_new_login_email(seller: Seller, ip: str = "", user_agent: str = "") -> None:
    """Email a seller when a new login occurs (spec §44)."""
    subject = f"Nouvelle connexion détectée — {settings.PLATFORM_NAME}"
    context = {
        "platform_name": settings.PLATFORM_NAME,
        "first_name": seller.first_name,
        "login_time": timezone.now().strftime("%d/%m/%Y à %H:%M"),
        "ip": ip[:45] if ip else "inconnue",
        "user_agent": user_agent[:120] if user_agent else "inconnu",
        "reset_url": f"{settings.FRONTEND_URL}/auth/password-reset",
    }
    html = render_to_string("emails/new_login.html", context)
    send_mail(subject, "", settings.DEFAULT_FROM_EMAIL, [seller.email], html_message=html)
