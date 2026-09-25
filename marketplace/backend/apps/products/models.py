"""Product models (spec §13, §34-35, §40, §41).

Products belong to sellers, reference a leaf category + brand, and store dynamic
technical attributes against AttributeDefinition rows (extensible, spec §14).
Images are stored externally (S3/R2 in prod, local volume in dev) — never in DB.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from apps.categories.models import AttributeDefinition, Brand, Category


class Condition(models.TextChoices):
    NEW = "NEUF", "Neuf"
    USED = "OCCASION", "Occasion"
    REFURBISHED = "RECONDITIONNE", "Reconditionné"
    WELL_USED = "UTILISE", "Utilisé"


class ProductStatus(models.TextChoices):
    AVAILABLE = "AVAILABLE", "Disponible"
    SOLD = "SOLD", "Vendu"
    HIDDEN = "HIDDEN", "Masqué"
    PENDING_REVIEW = "PENDING_REVIEW", "En modération"
    REJECTED = "REJECTED", "Rejeté"


class Currency(models.TextChoices):
    FCFA = "FCFA", "FCFA"


class Product(models.Model):
    """A marketplace listing (spec §13)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products", limit_choices_to={"parent__isnull": False})
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")

    title = models.CharField("Titre", max_length=200)
    slug = models.SlugField(max_length=220, db_index=True)
    model = models.CharField("Modèle", max_length=200, blank=True)
    description = models.TextField("Description", blank=True)

    price = models.DecimalField("Prix", max_digits=12, decimal_places=0)
    currency = models.CharField(max_length=10, choices=Currency.choices, default=Currency.FCFA)
    condition = models.CharField(max_length=20, choices=Condition.choices, default=Condition.NEW, db_index=True)
    status = models.CharField(max_length=20, choices=ProductStatus.choices, default=ProductStatus.AVAILABLE, db_index=True)

    # Localisation (§13, §49)
    city = models.CharField("Ville", max_length=100, default="Abidjan")
    commune = models.CharField("Commune", max_length=100, blank=True)

    # Contact (§13, §26)
    phone = models.CharField("Téléphone", max_length=20, blank=True)
    whatsapp = models.CharField("WhatsApp", max_length=20, blank=True)

    views_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "category"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title or self.model) or "annonce"
            self.slug = self._unique_slug(base)
        super().save(*args, **kwargs)

    def _unique_slug(self, base):
        candidate, i = base, 2
        while Product.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base}-{i}"
            i += 1
        return candidate

    def primary_image(self):
        img = self.images.filter(is_primary=True).first() or self.images.first()
        return img.image if img else None


class ProductImage(models.Model):
    """Multiple images per product; the file lives in object storage (spec §40)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField("Image", upload_to="products/%Y/%m/")
    is_primary = models.BooleanField("Image principale", default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Image produit"
        verbose_name_plural = "Images produits"
        ordering = ["sort_order", "created_at"]

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class ProductAttributeValue(models.Model):
    """Dynamic technical attribute value for a product (spec §14)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="attributes")
    attribute = models.ForeignKey(AttributeDefinition, on_delete=models.CASCADE)
    value = models.JSONField()

    class Meta:
        verbose_name = "Valeur de caractéristique"
        verbose_name_plural = "Valeurs de caractéristiques"
        constraints = [
            models.UniqueConstraint(fields=["product", "attribute"], name="uniq_product_attribute"),
        ]

    def __str__(self):
        return f"{self.product.title}: {self.attribute.key}={self.value}"
