from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0004_product_attributes_text"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="product",
            index=models.Index(
                fields=["status", "-views_count"],
                name="product_status_views_count_idx",
            ),
        ),
    ]
