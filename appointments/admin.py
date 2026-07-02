from django.contrib import admin

from .models import Appointment, Doctor, Profile


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ["name", "specialty", "experience_years", "consultation_fee", "is_available"]
    list_filter = ["specialty", "is_available"]
    search_fields = ["name", "specialty", "qualification"]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["patient_name", "doctor", "appointment_date", "appointment_time", "status"]
    list_filter = ["status", "appointment_date", "doctor__specialty"]
    search_fields = ["patient_name", "patient_email", "patient_phone", "doctor__name"]


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "doctor"]
    list_filter = ["role"]
