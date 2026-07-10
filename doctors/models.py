from django.conf import settings
from django.db import models
import uuid

from hospitals.models import Hospital


class Doctor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='doctors')
    specialization = models.CharField(max_length=100)
    qualification = models.CharField(max_length=200)
    experience_years = models.PositiveIntegerField(default=0)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bio = models.TextField(blank=True)
    rating = models.FloatField(default=4.5)
    languages = models.CharField(max_length=200, default="Hindi, English")
    online_consultation = models.BooleanField(default=True)
    insurance_accepted = models.BooleanField(default=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], default='male')
    license_number = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def name(self):
        return self.user.get_full_name() or self.user.username

    @property
    def specialty(self):
        return self.specialization

    class Meta:
        ordering = ['specialization', 'qualification']

    def __str__(self):
        return f"Dr. {self.name}"
