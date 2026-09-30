"""Management command to (re)build the product search index (spec §29).

Usage:
    python manage.py rebuild_search_index

Recomputes the PostgreSQL search_vector for every product. No-op on non-PostgreSQL
databases (SQLite).
"""
from django.core.management.base import BaseCommand

from apps.products.models import Product


class Command(BaseCommand):
    help = "Recompute the full-text search vector for all products."

    def handle(self, *args, **options):
        from apps.products import search as search_module

        if not search_module._is_postgresql():
            self.stdout.write(self.style.WARNING("Not a PostgreSQL database — nothing to do."))
            return

        total = Product.objects.count()
        # 1. Rebuild the denormalized attribute text (source of the B-weight tokens).
        for product in (
            Product.objects.prefetch_related("attributes__attribute").iterator(chunk_size=500)
        ):
            Product.objects.filter(pk=product.pk).update(
                attributes_text=search_module.build_attributes_text(product)
            )
        # 2. Rebuild the FTS vector (includes category name + attributes_text).
        Product.objects.update(search_vector=search_module._build_search_vector())
        self.stdout.write(
            self.style.SUCCESS(f"Reconstruit le vecteur de recherche pour {total} produits.")
        )
