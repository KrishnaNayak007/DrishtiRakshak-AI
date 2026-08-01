from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from organizations.views import OrganizationViewSet, OrganizationMembershipViewSet
from vehicles.views import VehicleViewSet
from evidence.views import EvidenceViewSet
from incidents.views import IncidentViewSet
from police.views import PoliceDispatchViewSet
from drishtirakshak.views import RegisterView, GoogleAuthView

router = DefaultRouter()
router.register("organizations", OrganizationViewSet)
router.register("memberships", OrganizationMembershipViewSet)
router.register("vehicles", VehicleViewSet)
router.register("evidence", EvidenceViewSet)
router.register("incidents", IncidentViewSet)
router.register("police/dispatches", PoliceDispatchViewSet, basename="police-dispatch")

urlpatterns = [
    path('admin/', admin.site.urls),
    # JWT auth (ADR-0002): obtain an access/refresh pair, then refresh the
    # access token. Refresh rotation + blacklist are configured in settings.
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/register/', RegisterView.as_view(), name='register'),
    path('api/v1/auth/google/', GoogleAuthView.as_view(), name='google_auth'),
    path('api/v1/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
