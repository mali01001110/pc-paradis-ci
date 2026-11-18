"""Django signals for the categories app — invalidates catalogue cache on write."""
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Brand, Category


@receiver(post_save, sender=Category)
@receiver(post_delete, sender=Category)
def invalidate_category_cache(sender, instance, **kwargs):
    """Invalidate the category tree and per-category filter-options cache."""
    cache.delete("category-tree")
    cache.delete(f"filter-options:{instance.slug}")


@receiver(post_save, sender=Brand)
@receiver(post_delete, sender=Brand)
def invalidate_brand_cache(sender, **kwargs):
    """Invalidate the brand list cache."""
    cache.delete("brand-list")
