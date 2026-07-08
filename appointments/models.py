from django.core.validators import MinValueValidator
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q

from doctors.models import Doctor


class TimeSlot(models.Model):
    time = models.CharField(max_length=5, unique=True)  # e.g., "09:00"

    def __str__(self):
        return self.time


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
    video_link = models.CharField(max_length=255, default="", blank=True)
    is_emergency = models.BooleanField(default=False)
    payment_status = models.CharField(
        max_length=20, 
        choices=[('pending', 'Pending'), ('paid', 'Paid')], 
        default='paid'
    )
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


class Prescription(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name="prescription")
    medicine = models.TextField()
    dosage = models.CharField(max_length=100)  # e.g., "1-0-1"
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription for {self.appointment.patient_name}"


class MedicalReport(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="medical_reports")
    file = models.FileField(upload_to="reports/", blank=True, null=True)
    file_url = models.CharField(max_length=500, blank=True, null=True)  # custom URL fallback
    title = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report {self.title} for {self.patient.username}"


class Review(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="reviews")
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveIntegerField(default=5)  # 1 to 5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review ({self.rating} stars) for Dr. {self.doctor.user.username}"


class DoctorHoliday(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="holidays")
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("doctor", "date")

    def __str__(self):
        return f"Dr. {self.doctor.user.username} on holiday at {self.date}"
