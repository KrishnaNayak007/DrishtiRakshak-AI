from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from organizations.views import OrganizationViewSet
from vehicles.views import VehicleViewSet
from evidence.views import EvidenceViewSet
from incidents.views import IncidentViewSet

router = DefaultRouter()
router.register("organizations", OrganizationViewSet)
router.register("vehicles", VehicleViewSet)
router.register("evidence", EvidenceViewSet)
router.register("incidents", IncidentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
