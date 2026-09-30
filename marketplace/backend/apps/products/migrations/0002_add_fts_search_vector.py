"""Migration: add PostgreSQL Full Text Search vector to Product (spec §29)."""
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="search_vector",
            field=SearchVectorField(null=True, blank=True),
        ),
        migrations.AddIndex(
            model_name="product",
            index=GinIndex(fields=["search_vector"], name="product_search_gin"),
        ),
    ]