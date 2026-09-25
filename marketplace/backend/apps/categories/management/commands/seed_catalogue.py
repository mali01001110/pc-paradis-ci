"""Django management command to load the catalogue seed data.

Usage: python manage.py seed_catalogue [--brands] [--categories] [--demo]
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.categories.models import AttributeDefinition, Brand, Category

from .seed_data import ATTRIBUTES, BRANDS, SUBCATEGORIES, TOP_LEVEL


class Command(BaseCommand):
    help = "Charge les categories, caracteristiques et marques par defaut."

    def add_arguments(self, parser):
        parser.add_argument("--brands", action="store_true", help="Seulement les marques")
        parser.add_argument("--categories", action="store_true", help="Seulement les categories")
        parser.add_argument("--demo", action="store_true", help="Categories + marques + caracteristiques")

    def handle(self, *args, **options):
        do_all = not (options["brands"] or options["categories"] or options["demo"])

        if options["brands"] or do_all:
            self._load_brands()
        if options["categories"] or do_all or options["demo"]:
            self._load_categories()

    def _load_brands(self):
        for name in BRANDS:
            Brand.objects.get_or_create(name=name, defaults={"slug": slugify(name)})
        self.stdout.write(self.style.SUCCESS(f"Marques : {Brand.objects.count()}"))

    def _load_categories(self):
        for top_slug, (top_label, icon) in TOP_LEVEL.items():
            top, _ = Category.objects.get_or_create(
                slug=top_slug,
                defaults={"name": top_label, "icon": icon, "sort_order": 0},
            )
            for order, (sub_slug, sub_label) in enumerate(SUBCATEGORIES[top_slug]):
                sub, created = Category.objects.get_or_create(
                    slug=sub_slug,
                    defaults={
                        "name": sub_label,
                        "parent": top,
                        "icon": top.icon,
                        "sort_order": order,
                    },
                )
                if created and sub_slug in ATTRIBUTES:
                    self._load_attributes(sub)

        # Idempotent: refresh attributes on existing leaf categories.
        for sub_slug, defs in ATTRIBUTES.items():
            try:
                cat = Category.objects.get(slug=sub_slug)
            except Category.DoesNotExist:
                continue
            self._load_attributes(cat)

        self.stdout.write(self.style.SUCCESS(f"Categories : {Category.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"Caracteristiques : {AttributeDefinition.objects.count()}"))

    def _load_attributes(self, category):
        for order, (key, label, vtype, unit, options, required, filterable) in enumerate(ATTRIBUTES.get(category.slug, [])):
            AttributeDefinition.objects.update_or_create(
                category=category,
                key=key,
                defaults={
                    "label": label,
                    "value_type": vtype,
                    "unit": unit,
                    "options": options,
                    "required": required,
                    "filterable": filterable,
                    "sort_order": order,
                },
            )
