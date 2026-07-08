from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import HospitalViewSet

router = DefaultRouter()
router.register(r'', HospitalViewSet, basename='hospital')

urlpatterns = router.urls
