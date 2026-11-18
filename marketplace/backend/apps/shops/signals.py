"""Django signals for the shops app — invalidates public shop cache on write."""
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Shop


@receiver(post_save, sender=Shop)
@receiver(post_delete, sender=Shop)
def invalidate_shop_cache(sender, instance, **kwargs):
    """Invalidate the public shop cache when a shop changes."""
    cache.delete(f"shop:{instance.slug}")
