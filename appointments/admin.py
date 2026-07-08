from django.contrib import admin

from .models import Appointment, Profile


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["patient_name", "doctor", "appointment_date", "appointment_time", "status"]
    list_filter = ["status", "appointment_date", "doctor__specialization"]
    search_fields = ["patient_name", "patient_email", "patient_phone", "doctor__user__first_name", "doctor__user__last_name"]


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "doctor"]
    list_filter = ["role"]
