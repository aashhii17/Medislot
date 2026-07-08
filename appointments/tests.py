from datetime import time, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.models import User

from .models import Appointment, Doctor, Profile


class AppointmentTests(TestCase):
    def setUp(self):
        doctor_user = User.objects.create_user(username="asha_doc", password="StrongPass123", first_name="Asha", last_name="Mehta")
        self.doctor = Doctor.objects.create(user=doctor_user, specialization="Cardiology", qualification="MBBS, MD", experience_years=10, consultation_fee=800)
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

    def test_health_check_endpoint(self):
        response = self.client.get(reverse("health_check"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")


from rest_framework.test import APITestCase
from appointments.models import TimeSlot, Prescription, MedicalReport, Review, DoctorHoliday
from doctors.models import Doctor

class AppointmentsRestTests(APITestCase):
    def setUp(self):
        self.doctor_user = User.objects.create_user(
            username="doctor_api", 
            password="StrongPass123",
            first_name="Asha",
            last_name="Mehta"
        )
        self.doctor = Doctor.objects.create(
            user=self.doctor_user, 
            specialization="Cardiology", 
            qualification="MBBS, MD", 
            experience_years=10, 
            consultation_fee=800,
            rating=4.5
        )
        self.user = User.objects.create_user(
            username="ravi_api", 
            password="StrongPass123", 
            email="ravi@example.com", 
            first_name="Ravi"
        )
        Profile.objects.create(user=self.user, role=Profile.Role.PATIENT)
        Profile.objects.create(user=self.doctor_user, role=Profile.Role.DOCTOR, doctor=self.doctor)

        # Seed some standard slots
        TimeSlot.objects.get_or_create(time="09:00")
        TimeSlot.objects.get_or_create(time="09:30")
        TimeSlot.objects.get_or_create(time="10:00")

    def test_slots_availability_on_date(self):
        self.client.force_authenticate(user=self.user)
        date_str = (timezone.localdate() + timedelta(days=2)).strftime('%Y-%m-%d')
        
        # 1. Active query slots
        url = f"/api/doctors/{self.doctor.pk}/slots/?date={date_str}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        slots = response.json()["slots"]
        self.assertEqual(len(slots), 3)
        self.assertTrue(all(s["is_available"] for s in slots))

        # 2. Block slot with booking
        Appointment.objects.create(
            doctor=self.doctor, 
            patient=self.user, 
            patient_name="Ravi Kumar", 
            patient_email="ravi@example.com", 
            patient_phone="9876543210", 
            appointment_date=date_str, 
            appointment_time="09:30", 
            reason="Consultation"
        )
        response = self.client.get(url)
        slots = response.json()["slots"]
        target_slot = next(s for s in slots if s["time"] == "09:30")
        self.assertFalse(target_slot["is_available"])

        # 3. Block with Doctor Holiday
        DoctorHoliday.objects.create(doctor=self.doctor, date=date_str)
        response = self.client.get(url)
        slots = response.json()["slots"]
        self.assertTrue(all(not s["is_available"] for s in slots))

    def test_reviews_submission_updates_rating(self):
        self.client.force_authenticate(user=self.user)
        appointment = Appointment.objects.create(
            doctor=self.doctor, 
            patient=self.user, 
            patient_name="Ravi Kumar", 
            patient_email="ravi@example.com", 
            patient_phone="9876543210", 
            appointment_date=timezone.localdate(), 
            appointment_time="09:00", 
            reason="Consultation",
            status=Appointment.Status.COMPLETED
        )
        
        # Submit review via API
        review_url = f"/api/appointments/{appointment.pk}/review/"
        res = self.client.post(review_url, {"rating": 5, "comment": "Excellent care!"})
        self.assertEqual(res.status_code, 201)
        
        # Verify doctor rating updated
        self.doctor.refresh_from_db()
        self.assertEqual(self.doctor.rating, 5.0)

    def test_analytics_dashboard_patient_vs_doctor(self):
        # Patient check
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/analytics/dashboard/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "patient")
        self.assertEqual(res.json()["appointments_count"], 0)

        # Doctor check
        self.client.force_authenticate(user=self.doctor_user)
        res = self.client.get("/api/analytics/dashboard/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "doctor")
        self.assertEqual(res.json()["completed_count"], 0)

