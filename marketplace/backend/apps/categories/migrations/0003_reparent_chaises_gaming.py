from django.db import migrations


def reparent_chaises_gaming_to_accessoires(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    chaises = Category.objects.filter(slug="chaises-gaming").first()
    accessoires = Category.objects.filter(slug="accessoires").first()
    if not chaises or not accessoires:
        return
    chaises.parent = accessoires
    chaises.save()


def reparent_chaises_gaming_to_composants_externes(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    chaises = Category.objects.filter(slug="chaises-gaming").first()
    composants_externes = Category.objects.filter(slug="composants-externes").first()
    if not chaises or not composants_externes:
        return
    chaises.parent = composants_externes
    chaises.save()


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0002_reparent_tapis_de_souris"),
    ]

    operations = [
        migrations.RunPython(
            reparent_chaises_gaming_to_accessoires,
            reparent_chaises_gaming_to_composants_externes,
        ),
    ]
