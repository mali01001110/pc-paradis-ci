"""Contact event models (spec §27)."""
import uuid

from django.conf import settings
from django.db import models

from apps.products.models import Product


class ContactType(models.TextChoices):
    PHONE = "PHONE", "Appel t\u00e9l\u00e9phonique"
    WHATSAPP = "WHATSAPP", "WhatsApp"


class ProductContactEvent(models.Model):
    """Log a contact attempt on a product listing (spec §27)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="contact_events"
    )
    contact_type = models.CharField(max_length=10, choices=ContactType.choices)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "\u00c9v\u00e9nement de contact"
        verbose_name_plural = "\u00c9v\u00e9nements de contact"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.contact_type} sur {self.product.title} \u00e0 {self.created_at:%Y-%m-%d %H:%M}"