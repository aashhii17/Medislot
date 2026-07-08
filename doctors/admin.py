from django.contrib import admin

from .models import Doctor


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialization', 'experience_years', 'consultation_fee', 'is_active')
    search_fields = ('user__username', 'specialization', 'qualification')
