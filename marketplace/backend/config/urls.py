"""Root URL configuration."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.http import HttpResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from . import health
from .sitemaps import (
    CategorySitemap,
    ProductSitemap,
    ShopSitemap,
    StaticViewSitemap,
)

sitemaps = {
    "static": StaticViewSitemap,
    "products": ProductSitemap,
    "shops": ShopSitemap,
    "categories": CategorySitemap,
}


def robots_txt(request):
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /seller",
        "Disallow: /auth",
        "Disallow: /admin/",
        "Disallow: /api/",
        f"Sitemap: {settings.FRONTEND_URL}/sitemap.xml",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")


urlpatterns = [
    path("admin/", admin.site.urls),
    # Health check
    path("api/health/", health.health_check, name="health"),
    # SEO (spec §47)
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="sitemap"),
    path("robots.txt", robots_txt, name="robots"),
    # API v1
    path("api/v1/", include("apps.accounts.urls", namespace="accounts")),
    path("api/v1/", include("apps.shops.urls", namespace="shops")),
    path("api/v1/", include("apps.categories.urls", namespace="categories")),
    path("api/v1/", include("apps.products.urls", namespace="products")),
    path("api/v1/", include("apps.contacts.urls", namespace="contacts")),
    path("api/v1/", include("apps.reports.urls", namespace="reports")),
]

# OpenAPI / Swagger (hidden in production unless SHOW_API_DOCS=True)
if settings.SHOW_API_DOCS:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
