"""Dynamic attribute filtering on product listings (spec §34).

Query convention: ``attr_<key>=value`` with comma-separated values meaning OR:

    GET /api/v1/products/?attr_vram=8,12
    GET /api/v1/products/?attr_vram_type=GDDR6X&attr_rgb=true

Semantics per attribute value_type:

- ``number`` / ``boolean`` / ``select``: exact JSON equality, evaluated at the
  database level (``Q(attributes__value=v)``), OR within a key, AND across keys.
- ``multiselect`` (stored value is a JSON list) and ``text`` (case-insensitive
  contains): evaluated Python-side, then reduced to ``pk__in`` — JSONField
  ``contains`` lookups are not portable on SQLite.

Unknown or non-filterable keys are silently ignored (never 400) so the
frontend can send every facet without knowing which exist per category.
"""
from django.db.models import Q

from apps.categories.models import AttributeDefinition

ATTR_PREFIX = "attr_"

_TRUE_VALUES = {"true", "1", "oui", "yes", "vrai"}
_FALSE_VALUES = {"false", "0", "non", "no", "faux"}


def parse_query_value(raw: str):
    """Coerce a query-string token to bool > number > string."""
    s = raw.strip()
    low = s.lower()
    if low in _TRUE_VALUES:
        return True
    if low in _FALSE_VALUES:
        return False
    try:
        return int(s)
    except ValueError:
        pass
    try:
        return float(s)
    except ValueError:
        pass
    return s


def parse_attribute_params(query_params) -> dict:
    """Extract ``attr_<key>`` query params into {key: [or_values]}."""
    filters: dict = {}
    for name in query_params.keys():
        if not name.startswith(ATTR_PREFIX):
            continue
        attr_key = name[len(ATTR_PREFIX):]
        if not attr_key:
            continue
        values = []
        for raw in query_params.getlist(name):
            for part in str(raw).split(","):
                part = part.strip()
                if part:
                    values.append(parse_query_value(part))
        if values:
            filters[attr_key] = values
    return filters


def filter_products_by_attribute(queryset, filters: dict):
    """Apply parsed attribute filters to a Product queryset."""
    if not filters:
        return queryset

    definitions = {
        d.key: d
        for d in AttributeDefinition.objects.filter(key__in=filters.keys(), filterable=True)
    }

    db_q = Q()
    has_db_filters = False
    python_keys = []
    for key, values in filters.items():
        definition = definitions.get(key)
        if definition is None:
            continue
        if definition.value_type in ("select", "number", "boolean"):
            key_q = Q()
            for value in values:
                key_q |= Q(attributes__attribute__key=key, attributes__value=value)
            db_q &= key_q
            has_db_filters = True
        else:  # text / multiselect — Python-side fallback
            python_keys.append((key, definition.value_type, values))

    if has_db_filters:
        queryset = queryset.filter(db_q).distinct()

    for key, value_type, values in python_keys:
        matching_pks = _matching_product_pks(key, value_type, values)
        queryset = queryset.filter(pk__in=matching_pks)

    return queryset


def _matching_product_pks(key: str, value_type: str, values: list) -> set:
    """Product pks whose attribute ``key`` matches any of the query values."""
    from .models import ProductAttributeValue

    wanted = {str(v).lower() for v in values}
    matches = set()
    rows = ProductAttributeValue.objects.filter(attribute__key=key).values_list(
        "product_id", "value"
    )
    for product_id, stored in rows:
        if value_type == "multiselect":
            if isinstance(stored, list) and any(
                str(item).lower() in wanted for item in stored
            ):
                matches.add(product_id)
        else:  # text — case-insensitive contains
            stored_str = str(stored).lower()
            if any(w in stored_str for w in wanted):
                matches.add(product_id)
    return matches
