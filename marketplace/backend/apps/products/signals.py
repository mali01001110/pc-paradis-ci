"""Django signals for the products app — keeps search_vector and attributes_text in sync (spec §29)."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Product, ProductAttributeValue


@receiver(post_save, sender=Product)
def update_search_vector_on_save(sender, instance, **kwargs):
    """Update the PostgreSQL search_vector after a Product is created or updated."""
    from . import search as search_module

    if instance.pk is None:
        return
    search_module.update_product_search_vector(instance)


@receiver(post_save, sender=ProductAttributeValue)
def sync_attributes_text_on_attr_save(sender, instance, **kwargs):
    """Recompute attributes_text and FTS vector when an attribute value changes."""
    from . import search as search_module

    search_module.refresh_attributes_text(instance.product)


@receiver(post_delete, sender=ProductAttributeValue)
def sync_attributes_text_on_attr_delete(sender, instance, **kwargs):
    """Same after attribute removal."""
    from . import search as search_module

    search_module.refresh_attributes_text(instance.product)