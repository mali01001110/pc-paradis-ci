"""Product report models (spec §55, Phase 8)."""
import uuid

from django.conf import settings
from django.db import models

from apps.products.models import Product


class ReportReason(models.TextChoices):
    FRAUD = "FRAUD", "Fraude / arnaque"
    PROHIBITED = "PROHIBITED", "Produit interdit"
    DUPLICATE = "DUPLICATE", "Annonce en double"
    WRONG_CATEGORY = "WRONG_CATEGORY", "Mauvaise categorie"
    OFFENSIVE = "OFFENSIVE", "Contenu inapproprie"
    OTHER = "OTHER", "Autre"


class ReportStatus(models.TextChoices):
    OPEN = "OPEN", "Ouvert"
    RESOLVED = "REVIEWED", "Traite"
    DISMISSED = "DISMISSED", "Rejete"


class ProductReport(models.Model):
    """A user-submitted report about a listing (spec §55)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="reports"
    )
    reporter_email = models.EmailField("Email du signaleur", blank=True)
    reason = models.CharField("Raison", max_length=20, choices=ReportReason.choices)
    description = models.TextField("Details", blank=True, max_length=2000)
    status = models.CharField(
        "Statut", max_length=20, choices=ReportStatus.choices, default=ReportStatus.OPEN
    )
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="handled_reports",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Signalement"
        verbose_name_plural = "Signalements"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reason} - {self.product.title}"
