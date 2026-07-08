from django.contrib import admin

from .models import OTP, PatientProfile


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'purpose', 'is_used', 'expires_at')


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'patient_id', 'city', 'blood_group', 'has_insurance')
