"""Management command to create (or update) a mock seller account for testing.

Usage:
    python manage.py create_mock_seller

Creates an active, email-verified seller with an associated shop so that the
seller dashboard product registration flow can be tested end-to-end. Idempotent:
re-running updates the existing account in place.
"""
from django.core.management.base import BaseCommand

from apps.accounts.models import Seller, SellerStatus
from apps.shops.models import Shop

MOCK_EMAIL = "mock-seller@pcparadis.ci"
MOCK_PASSWORD = "MockSellerPass123!"


class Command(BaseCommand):
    help = "Create (or update) a mock seller account for end-to-end testing."

    def handle(self, *args, **options):
        seller, created = Seller.objects.update_or_create(
            email=MOCK_EMAIL,
            defaults={
                "first_name": "Mock",
                "last_name": "Seller",
                "business_name": "Mock Boutique PC",
                "phone": "+2250700000000",
                "whatsapp": "+2250700000000",
                "terms_accepted": True,
                "email_verified": True,
                "status": SellerStatus.ACTIVE,
            },
        )
        # Hash the password (update_or_create would store it in plain text).
        seller.set_password(MOCK_PASSWORD)
        seller.save()

        shop, shop_created = Shop.objects.get_or_create(
            seller=seller,
            defaults={
                "name": "Mock Boutique PC",
                "description": "Boutique mock pour tests end-to-end.",
                "city": "Abidjan",
            },
        )

        action = "Créé" if created else "Mis à jour"
        shop_action = "créée" if shop_created else "déjà existante"
        self.stdout.write(self.style.SUCCESS(f"{action}: vendeur mock {MOCK_EMAIL}"))
        self.stdout.write(self.style.SUCCESS(f"Mot de passe : {MOCK_PASSWORD}"))
        self.stdout.write(
            self.style.SUCCESS(f"Boutique {shop_action} : {shop.name} (slug={shop.slug})")
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"can_login()={seller.can_login()} (status={seller.status}, email_verified={seller.email_verified})"
            )
        )
