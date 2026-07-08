from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from appointments.api_views import (
    AppointmentViewSet, 
    PrescriptionViewSet, 
    MedicalReportViewSet, 
    DoctorHolidayViewSet,
    AnalyticsDashboardView
)

router = DefaultRouter()
router.register(r"appointments", AppointmentViewSet, basename="appointment")
router.register(r"prescriptions", PrescriptionViewSet, basename="prescription")
router.register(r"reports", MedicalReportViewSet, basename="report")
router.register(r"holidays", DoctorHolidayViewSet, basename="holiday")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/hospitals/", include("hospitals.urls")),
    path("api/doctors/", include("doctors.urls")),
    
    # Analytics Endpoint
    path("api/analytics/dashboard/", AnalyticsDashboardView.as_view(), name="analytics_dashboard"),
    
    path("api/", include(router.urls)),
    path("", include("appointments.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
