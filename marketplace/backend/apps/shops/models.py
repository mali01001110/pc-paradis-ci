"""Shop models (spec §10).

Each seller has a free public shop page at /shop/<slug>.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify


def _unique_slug(base: str, exclude_pk=None) -> str:
    """Generate a unique slug from a base string."""
    slug = slugify(base) or "boutique"
    candidate = slug
    i = 2
    while Shop.objects.filter(slug=candidate).exclude(pk=exclude_pk).exists():
        candidate = f"{slug}-{i}"
        i += 1
    return candidate


class Shop(models.Model):
    """A seller's public shop page (free, spec §10)."""

    seller = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shop")
    slug = models.SlugField(max_length=160, unique=True, db_index=True)
    name = models.CharField("Nom de la boutique", max_length=150)
    description = models.TextField("Description", blank=True)
    logo = models.ImageField("Logo", upload_to="shops/logos/", blank=True, null=True)

    # Contact (defaults to seller's, overridable)
    phone = models.CharField("Téléphone", max_length=20, blank=True)
    whatsapp = models.CharField("WhatsApp", max_length=20, blank=True)

    # Localisation (§49)
    city = models.CharField("Ville", max_length=100, default="Abidjan")
    commune = models.CharField("Commune", max_length=100, blank=True)
    location = models.CharField("Localisation générale", max_length=200, blank=True)

    is_active = models.BooleanField("Boutique active", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Boutique"
        verbose_name_plural = "Boutiques"

    def __str__(self):
        return f"{self.name} ({self.slug})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = _unique_slug(self.name or self.seller.business_name or self.seller.email, self.pk)
        super().save(*args, **kwargs)
