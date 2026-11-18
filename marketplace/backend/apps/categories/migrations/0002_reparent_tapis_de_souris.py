# Move tapis-de-souris category from composants-externes to accessoires

from django.db import migrations


def reparent_tapis_de_souris_to_accessoires(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    tapis = Category.objects.filter(slug="tapis-de-souris").first()
    accessoires = Category.objects.filter(slug="accessoires").first()
    if not tapis or not accessoires:
        return
    tapis.parent = accessoires
    tapis.save()


def reparent_tapis_de_souris_to_composants_externes(apps, schema_editor):
    Category = apps.get_model("categories", "Category")
    tapis = Category.objects.filter(slug="tapis-de-souris").first()
    composants_externes = Category.objects.filter(slug="composants-externes").first()
    if not tapis or not composants_externes:
        return
    tapis.parent = composants_externes
    tapis.save()


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            reparent_tapis_de_souris_to_accessoires,
            reparent_tapis_de_souris_to_composants_externes,
        ),
    ]
