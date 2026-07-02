from datetime import time, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.models import User

from .models import Appointment, Doctor, Profile


class AppointmentTests(TestCase):
    def setUp(self):
        self.doctor = Doctor.objects.create(name="Asha Mehta", specialty="Cardiology", qualification="MBBS, MD", experience_years=10, consultation_fee=800)
        self.user = User.objects.create_user(username="ravi", password="StrongPass123", email="ravi@example.com", first_name="Ravi")
        Profile.objects.create(user=self.user, role=Profile.Role.PATIENT)
        self.client.login(username="ravi", password="StrongPass123")
        self.date = timezone.localdate() + timedelta(days=1)
        self.data = {"patient_name": "Ravi Kumar", "patient_email": "ravi@example.com", "patient_phone": "9876543210", "appointment_date": self.date, "appointment_time": "10:00", "reason": "Routine checkup"}

    def test_home_lists_doctor(self):
        self.assertContains(self.client.get(reverse("home")), "Dr. Asha Mehta")

    def test_booking_creates_appointment(self):
        response = self.client.post(reverse("book_appointment", args=[self.doctor.pk]), self.data)
        appointment = Appointment.objects.get()
        self.assertRedirects(response, reverse("booking_success", args=[appointment.pk]))

    def test_past_date_is_rejected(self):
        data = {**self.data, "appointment_date": timezone.localdate() - timedelta(days=1)}
        self.client.post(reverse("book_appointment", args=[self.doctor.pk]), data)
        self.assertFalse(Appointment.objects.exists())

    def test_duplicate_slot_is_rejected(self):
        Appointment.objects.create(doctor=self.doctor, patient=self.user, patient_name="First", patient_email="first@example.com", patient_phone="9876543210", appointment_date=self.date, appointment_time=time(10), reason="Visit")
        response = self.client.post(reverse("book_appointment", args=[self.doctor.pk]), self.data)
        self.assertContains(response, "That slot was just booked")
        self.assertEqual(Appointment.objects.count(), 1)

    def test_lookup_and_cancel(self):
        appointment = Appointment.objects.create(doctor=self.doctor, patient=self.user, patient_name="Ravi", patient_email="ravi@example.com", patient_phone="9876543210", appointment_date=self.date, appointment_time=time(11), reason="Visit")
        self.assertContains(self.client.get(reverse("patient_dashboard")), "Dr. Asha Mehta")
        self.client.post(reverse("cancel_appointment", args=[appointment.pk]))
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, Appointment.Status.CANCELLED)

    def test_patient_dashboard_requires_login(self):
        self.client.logout()
        response = self.client.get(reverse("patient_dashboard"))
        self.assertRedirects(response, f'{reverse("login")}?next={reverse("patient_dashboard")}')

    def test_doctor_is_routed_to_doctor_dashboard(self):
        doctor_user = User.objects.create_user(username="doctor", password="StrongPass123")
        Profile.objects.create(user=doctor_user, role=Profile.Role.DOCTOR, doctor=self.doctor)
        self.client.login(username="doctor", password="StrongPass123")
        self.assertRedirects(self.client.get(reverse("dashboard")), reverse("doctor_dashboard"))

    def test_superuser_is_routed_to_admin_dashboard(self):
        admin = User.objects.create_superuser(username="admin", password="StrongPass123", email="admin@example.com")
        self.client.login(username="admin", password="StrongPass123")
        self.assertRedirects(self.client.get(reverse("dashboard")), reverse("admin_dashboard"))
