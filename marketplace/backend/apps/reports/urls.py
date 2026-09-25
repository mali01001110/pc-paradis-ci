"""URL routing for reports."""
from django.urls import path

from . import views

app_name = "reports"

urlpatterns = [
    path("reports/", views.StaffReportListView.as_view(), name="report-list"),
    path("reports/<uuid:pk>/", views.StaffReportUpdateView.as_view(), name="report-update"),
    path(
        "products/<slug:product_slug>/report/",
        views.ReportProductView.as_view(),
        name="report-product",
    ),
]
