"""Analytics models — product view tracking and daily aggregates (spec §27, §44)."""
import uuid

from django.db import models


class DailyProductView(models.Model):
    """Daily view count aggregate per product (spec §27, §44).

    `PublicProductDetailView.get_object()` calls `increment_view()` alongside
    the existing `views_count` increment, so both stay consistent. Raw
    per-session records are intentionally not stored (keeps the table lean).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="daily_views",
        editable=False,
    )
    date = models.DateField("Date", db_index=True)
    count = models.PositiveIntegerField("Vues", default=0)

    class Meta:
        verbose_name = "Vues quotidiennes"
        verbose_name_plural = "Vues quotidiennes"
        constraints = [
            models.UniqueConstraint(fields=["product", "date"], name="uniq_daily_view"),
        ]
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["product", "-date"]),
        ]

    def __str__(self):
        return f"{self.product.title} — {self.date}: {self.count}"

    @classmethod
    def increment_view(cls, product_pk, date) -> None:
        """Atomically increment (or create) the daily view counter."""
        created = not cls.objects.filter(product_id=product_pk, date=date).exists()
        if created:
            cls.objects.create(product_id=product_pk, date=date, count=1)
        else:
            cls.objects.filter(product_id=product_pk, date=date).update(
                count=models.F("count") + 1
            )


class SearchQueryLog(models.Model):
    """Anonymized search log (spec §37: suivre les recherches, minimiser les données).

    Stores the raw query string and how many listings matched. No user/session data.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query = models.CharField("Requête", max_length=200, db_index=True)
    result_count = models.PositiveIntegerField("Résultats", default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Recherche"
        verbose_name_plural = "Recherches"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.query!r} ({self.result_count} résultats)"
