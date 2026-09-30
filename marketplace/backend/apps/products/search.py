"""PostgreSQL Full Text Search utilities (spec §29).

The search vector is maintained by Django signals and stored as a SearchVectorField on
Product. This module provides the query function used by the views.

When PostgreSQL is not available (e.g. tests with SQLite), search_products() falls back
to simple icontains filtering so the API remains functional.
"""
from django.db import connection

from .models import Product


def _is_postgresql() -> bool:
    return connection.vendor == "postgresql"


def _build_search_vector():
    """SearchVector over title/brand/category (A), model/attributes (B), description (C)."""
    from django.contrib.postgres.search import SearchVector

    return (
        SearchVector("title", weight="A", config="french")
        + SearchVector("brand__name", weight="A", config="french")
        + SearchVector("category__name", weight="A", config="french")
        + SearchVector("model", weight="B", config="french")
        + SearchVector("attributes_text", weight="B", config="french")
        + SearchVector("description", weight="C", config="french")
    )


def render_attribute_value(value) -> str:
    """Render a JSON attribute value as searchable text."""
    if isinstance(value, bool):
        return "oui" if value else "non"
    if isinstance(value, (list, tuple)):
        return " ".join(str(x) for x in value)
    return str(value)


def build_attributes_text(product: Product) -> str:
    """Flatten a product's dynamic attributes into one searchable string (§29)."""
    parts = []
    for pav in product.attributes.select_related("attribute"):
        parts.append(
            f"{pav.attribute.key} {pav.attribute.label} {render_attribute_value(pav.value)}"
        )
    return " ".join(parts)


def refresh_attributes_text(product: Product) -> None:
    """Recompute the denormalized attributes_text then refresh the FTS vector."""
    Product.objects.filter(pk=product.pk).update(
        attributes_text=build_attributes_text(product)
    )
    update_product_search_vector(product)


def update_product_search_vector(product: Product) -> None:
    """Update the search_vector for a single Product instance (used by signals)."""
    if not _is_postgresql():
        return
    Product.objects.filter(pk=product.pk).update(search_vector=_build_search_vector())


def search_products(query: str, queryset):
    """Apply FTS ranking to a Product queryset.

    Falls back to basic icontains when PostgreSQL is unavailable. Products are ordered by
    relevance, then by date.
    """
    if not query or not query.strip():
        return queryset.order_by("-created_at")

    q = query.strip()

    if not _is_postgresql():
        return (
            queryset.filter(title__icontains=q)
            | queryset.filter(model__icontains=q)
            | queryset.filter(description__icontains=q)
            | queryset.filter(brand__name__icontains=q)
            | queryset.filter(category__name__icontains=q)
            | queryset.filter(attributes_text__icontains=q)
        ).distinct().order_by("-created_at")

    from django.contrib.postgres.search import SearchQuery, SearchRank

    sq = SearchQuery(q, config="french")
    vector = _build_search_vector()
    return (
        queryset.annotate(search=vector, rank=SearchRank(vector, sq))
        .filter(search=sq)
        .order_by("-rank", "-created_at")
    )
