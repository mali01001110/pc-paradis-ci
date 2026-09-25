"""Seller account models.

Custom user model for sellers only (no buyer accounts, see spec §4-§9).
"""
import secrets
import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone


class SellerStatus(models.TextChoices):
    PENDING = "PENDING", "En attente"
    ACTIVE = "ACTIVE", "Actif"
    SUSPENDED = "SUSPENDED", "Suspendu"
    BANNED = "BANNED", "Banni"


class SellerManager(BaseUserManager):
    """Manager using email as the unique identifier (django-security)."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email)
        extra_fields.setdefault("status", SellerStatus.PENDING)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("status", SellerStatus.ACTIVE)
        extra_fields.setdefault("email_verified", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser doit avoir is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


phone_regex = RegexValidator(
    regex=r"^\+?[0-9]{8,15}$",
    message="Numéro de téléphone invalide (indicatif + chiffres, ex: +2250708091011).",
)


class Seller(AbstractBaseUser, PermissionsMixin):
    """A marketplace seller. Only sellers have accounts (spec §5)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField("Prénom", max_length=150, blank=True)
    last_name = models.CharField("Nom", max_length=150, blank=True)
    business_name = models.CharField("Nom commercial", max_length=150, blank=True)
    phone = models.CharField("Téléphone", max_length=20, validators=[phone_regex], blank=True)
    whatsapp = models.CharField("WhatsApp", max_length=20, validators=[phone_regex], blank=True)

    status = models.CharField(
        "Statut", max_length=20, choices=SellerStatus.choices, default=SellerStatus.PENDING, db_index=True
    )
    email_verified = models.BooleanField("Email vérifié", default=False)
    mfa_enabled = models.BooleanField("MFA activée", default=False)
    terms_accepted = models.BooleanField("CGU acceptées", default=False)
    last_login = models.DateTimeField("Dernière connexion", null=True, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SellerManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "Vendeur"
        verbose_name_plural = "Vendeurs"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    @property
    def is_verified(self):
        return self.email_verified and self.status == SellerStatus.ACTIVE

    def can_login(self):
        return self.status in (SellerStatus.ACTIVE,) and self.email_verified


class SellerProfile(models.Model):
    """Extended public seller information (spec §9)."""

    seller = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    logo = models.ImageField("Logo", upload_to="sellers/logos/", blank=True, null=True)
    photo = models.ImageField("Photo", upload_to="sellers/photos/", blank=True, null=True)
    description = models.TextField("Description", blank=True)
    city = models.CharField("Ville", max_length=100, blank=True)
    commune = models.CharField("Commune", max_length=100, blank=True)
    location = models.CharField("Localisation générale", max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil vendeur"
        verbose_name_plural = "Profils vendeurs"

    def __str__(self):
        return f"Profil de {self.seller.email}"


class EmailVerificationToken(models.Model):
    """Secure, one-time, expiring email verification token (spec §7).

    The token value is cryptographically secure and never logged.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_tokens"
    )
    token_hash = models.CharField(max_length=128, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Token de vérification email"
        verbose_name_plural = "Tokens de vérification email"

    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()

    def __str__(self):
        return f"Token {self.id} pour {self.seller.email}"

    @staticmethod
    def generate_raw_token():
        """Return a raw token value. Only the hash is persisted."""
        return secrets.token_urlsafe(48)


class MFACode(models.Model):
    """One-time email MFA code with expiry and attempt limit (spec §8).

    The raw code is never stored; only its hash is persisted.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mfa_codes"
    )
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Code MFA"
        verbose_name_plural = "Codes MFA"

    def is_valid(self):
        return not self.used and self.expires_at > timezone.now() and self.attempts < settings.MFA_MAX_ATTEMPTS

    def __str__(self):
        return f"MFA {self.id} pour {self.seller.email}"

    @staticmethod
    def generate_code():
        """Generate a 6-digit numeric one-time code."""
        import secrets as _secrets

        return f"{_secrets.randbelow(1000000):06d}"


class PasswordResetCode(models.Model):
    """One-time code to reset a seller password (spec §46)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="password_reset_codes"
    )
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Code de réinitialisation"
        verbose_name_plural = "Codes de réinitialisation"

    def is_valid(self):
        return not self.used and self.expires_at > timezone.now() and self.attempts < 5

    @staticmethod
    def generate_code():
        """Generate a 6-digit numeric one-time code."""
        import secrets as _secrets

        return f"{_secrets.randbelow(1000000):06d}"

    def __str__(self):
        return f"Reset {self.id} pour {self.seller.email}"
