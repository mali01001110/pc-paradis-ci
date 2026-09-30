"""Tests for product image management — delete & reorder (spec §40, Étape 1)."""
import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.urls import reverse
from PIL import Image
from rest_framework import status

from apps.categories.models import Brand, Category
from apps.products.models import Product, ProductImage


@pytest.fixture
def seeded(db):
    call_command("seed_catalogue")


@pytest.fixture
def gpu_category(seeded):
    return Category.objects.get(slug="gpu")


@pytest.fixture
def gpu_brand(seeded):
    return Brand.objects.get(name="MSI")


def make_product(seller, category, brand):
    return Product.objects.create(
        seller=seller,
        category=category,
        brand=brand,
        title="RTX 4070 Super",
        model="4070 Super",
        description="Carte graphique gaming",
        price=450000,
        condition="OCCASION",
        status="AVAILABLE",
        city="Abidjan",
    )


def make_png(name="img.png"):
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color=(109, 40, 217)).save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


@pytest.mark.django_db
def test_upload_images(auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    resp = auth_client.post(
        reverse("products:my-product-images", args=[p.id]),
        {"images": [make_png("a.png"), make_png("b.png")]},
        format="multipart",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    assert p.images.count() == 2


@pytest.mark.django_db
def test_delete_image(auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    img1 = ProductImage.objects.create(product=p, image=make_png("1.png"), is_primary=True, sort_order=0)
    img2 = ProductImage.objects.create(product=p, image=make_png("2.png"), sort_order=1)
    resp = auth_client.delete(reverse("products:my-product-image-delete", args=[p.id, img1.id]))
    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert not ProductImage.objects.filter(pk=img1.pk).exists()
    assert ProductImage.objects.filter(pk=img2.pk).exists()
    # Primary reassigned to the remaining image.
    img2.refresh_from_db()
    assert img2.is_primary is True


@pytest.mark.django_db
def test_delete_image_requires_owner(auth_client, active_seller, seller_factory, gpu_category, gpu_brand):
    other = seller_factory(email="autre@x.ci", email_verified=True, status="ACTIVE")
    p = make_product(other, gpu_category, gpu_brand)
    img = ProductImage.objects.create(product=p, image=make_png("1.png"), is_primary=True)
    resp = auth_client.delete(reverse("products:my-product-image-delete", args=[p.id, img.id]))
    assert resp.status_code == status.HTTP_404_NOT_FOUND
    assert ProductImage.objects.filter(pk=img.pk).exists()


@pytest.mark.django_db
def test_reorder_images(auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    img1 = ProductImage.objects.create(product=p, image=make_png("1.png"), is_primary=True, sort_order=0)
    img2 = ProductImage.objects.create(product=p, image=make_png("2.png"), sort_order=1)
    img3 = ProductImage.objects.create(product=p, image=make_png("3.png"), sort_order=2)
    resp = auth_client.patch(
        reverse("products:my-product-images-reorder", args=[p.id]),
        {"order": [str(img3.id), str(img1.id), str(img2.id)]},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    img3.refresh_from_db()
    img1.refresh_from_db()
    img2.refresh_from_db()
    assert img3.sort_order == 0
    assert img1.sort_order == 1
    assert img2.sort_order == 2
    # New first image becomes primary.
    assert img3.is_primary is True
    assert img1.is_primary is False


@pytest.mark.django_db
def test_reorder_rejects_wrong_ids(auth_client, active_seller, gpu_category, gpu_brand):
    p = make_product(active_seller, gpu_category, gpu_brand)
    ProductImage.objects.create(product=p, image=make_png("1.png"), sort_order=0)
    resp = auth_client.patch(
        reverse("products:my-product-images-reorder", args=[p.id]),
        {"order": ["00000000-0000-0000-0000-000000000000"]},
        format="json",
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
