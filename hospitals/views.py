from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from .models import Hospital
from .serializers import HospitalSerializer


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.filter(is_active=True)
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
