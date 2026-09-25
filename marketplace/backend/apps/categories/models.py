"""Catalogue models (spec §11-12, §14-25, §56).

Hierarchical categories + dynamic per-category technical attribute definitions.
"""
import uuid

from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """Product category. Two levels max (§11): Composants Internes > CPU."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField("Nom", max_length=120)
    slug = models.SlugField(max_length=140, unique=True, db_index=True)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name

    @property
    def is_leaf(self) -> bool:
        return not self.children.exists()


class Brand(models.Model):
    """Product brands (spec §56)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField("Marque", max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Marque"
        verbose_name_plural = "Marques"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class AttributeDefinition(models.Model):
    """Dynamic technical attribute per category (spec §14-25).

    Example: category=GPU → key='vram', label='VRAM', value_type=number, unit='GB'.
    Products store values against these definitions — extensible without schema change.
    """

    class ValueType(models.TextChoices):
        TEXT = "text", "Texte"
        NUMBER = "number", "Nombre"
        BOOLEAN = "boolean", "Oui / Non"
        SELECT = "select", "Choix multiple"
        MULTISELECT = "multiselect", "Choix multiples"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="attributes")
    key = models.CharField(max_length=60, db_index=True)
    label = models.CharField("Libellé", max_length=150)
    value_type = models.CharField(
        max_length=15, choices=ValueType.choices, default=ValueType.TEXT
    )
    unit = models.CharField(max_length=20, blank=True, help_text="Ex: GB, MT/s, W")
    options = models.JSONField(blank=True, null=True, help_text="Options pour type select")
    required = models.BooleanField(default=False)
    filterable = models.BooleanField(default=True, help_text="Utilisable comme filtre")
    sort_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Caractéristique"
        verbose_name_plural = "Caractéristiques"
        ordering = ["sort_order", "label"]
        constraints = [
            models.UniqueConstraint(fields=["category", "key"], name="uniq_attr_per_category"),
        ]

    def __str__(self):
        return f"{self.category.name}: {self.label} ({self.value_type})"
