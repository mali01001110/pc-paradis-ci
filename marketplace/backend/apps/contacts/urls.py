"""URL routing for contacts."""
from django.urls import path

from . import views

app_name = "contacts"

urlpatterns = [
    path(
        "products/<slug:product_slug>/contact/",
        views.LogContactView.as_view(),
        name="log-contact",
    ),
    path(
        "contacts/",
        views.SellerContactListView.as_view(),
        name="contact-list",
    ),
    path(
        "contacts/stats/",
        views.SellerContactStatsView.as_view(),
        name="contact-stats",
    ),
]