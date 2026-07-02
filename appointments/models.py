from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q


class Doctor(models.Model):
    name = models.CharField(max_length=120)
    specialty = models.CharField(max_length=100)
    qualification = models.CharField(max_length=150)
    experience_years = models.PositiveIntegerField(default=1)
    consultation_fee = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    bio = models.TextField(blank=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ["specialty", "name"]

    def __str__(self):
        return f"Dr. {self.name} — {self.specialty}"


class Appointment(models.Model):
    class Status(models.TextChoices):
        BOOKED = "booked", "Booked"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    doctor = models.ForeignKey(Doctor, related_name="appointments", on_delete=models.PROTECT)
    patient = models.ForeignKey(User, related_name="appointments", on_delete=models.SET_NULL, blank=True, null=True)
    patient_name = models.CharField(max_length=120)
    patient_email = models.EmailField()
    patient_phone = models.CharField(max_length=20)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    reason = models.TextField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.BOOKED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["appointment_date", "appointment_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["doctor", "appointment_date", "appointment_time"],
                condition=Q(status="booked"),
                name="unique_active_doctor_slot",
            )
        ]

    def __str__(self):
        return f"{self.patient_name} with {self.doctor} on {self.appointment_date}"


class Profile(models.Model):
    class Role(models.TextChoices):
        PATIENT = "patient", "Patient"
        DOCTOR = "doctor", "Doctor"

    user = models.OneToOneField(User, related_name="profile", on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.PATIENT)
    doctor = models.OneToOneField(Doctor, related_name="user_profile", on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"
