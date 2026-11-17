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
        # 1 + 2. Rebuild attribute text + FTS vector per product (no joins in UPDATE).
        for product in (
            Product.objects.prefetch_related("attributes__attribute").iterator(chunk_size=500)
        ):
            product.attributes_text = search_module.build_attributes_text(product)
            search_module.update_product_search_vector(product)
        self.stdout.write(
            self.style.SUCCESS(f"Reconstruit le vecteur de recherche pour {total} produits.")
        )
