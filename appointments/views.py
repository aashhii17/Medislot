from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError, transaction
from django.db.models import Q, Count
from django.http import HttpResponseForbidden, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from .forms import AppointmentForm, SignUpForm
from .models import Appointment, Doctor, Profile


def home(request):
    query = request.GET.get("q", "").strip()
    specialty = request.GET.get("specialty", "").strip()
    doctors = Doctor.objects.filter(is_available=True)
    if query:
        doctors = doctors.filter(Q(name__icontains=query) | Q(specialty__icontains=query) | Q(qualification__icontains=query))
    if specialty:
        doctors = doctors.filter(specialty=specialty)
    specialties = Doctor.objects.filter(is_available=True).values_list("specialty", flat=True).distinct().order_by("specialty")
    return render(request, "appointments/home.html", {"doctors": doctors, "specialties": specialties, "query": query, "selected_specialty": specialty})


def doctor_detail(request, pk):
    doctor = get_object_or_404(Doctor, pk=pk, is_available=True)
    return render(request, "appointments/doctor_detail.html", {"doctor": doctor})


def signup(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    form = SignUpForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        with transaction.atomic():
            user = form.save(commit=False)
            user.email = form.cleaned_data["email"]
            user.first_name = form.cleaned_data["first_name"]
            user.last_name = form.cleaned_data["last_name"]
            user.save()
            Profile.objects.create(user=user, role=form.cleaned_data["role"], doctor=form.cleaned_data.get("doctor"))
        login(request, user)
        messages.success(request, "Welcome to MediSlot! Your account is ready.")
        return redirect("dashboard")
    return render(request, "registration/signup.html", {"form": form})


@login_required
def dashboard(request):
    if request.user.is_superuser:
        return redirect("admin_dashboard")
    profile, _ = Profile.objects.get_or_create(user=request.user)
    if profile.role == Profile.Role.DOCTOR:
        return redirect("doctor_dashboard")
    return redirect("patient_dashboard")


@login_required
def admin_dashboard(request):
    if not request.user.is_superuser:
        return HttpResponseForbidden("Administrator access only.")
    appointments = Appointment.objects.select_related("doctor", "patient")
    return render(request, "appointments/admin_dashboard.html", {
        "doctor_count": Doctor.objects.count(),
        "patient_count": Profile.objects.filter(role=Profile.Role.PATIENT).count(),
        "appointment_count": appointments.count(),
        "booked_count": appointments.filter(status=Appointment.Status.BOOKED).count(),
        "recent_appointments": appointments.order_by("-created_at")[:8],
    })


@login_required
def doctor_dashboard(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    if profile.role != Profile.Role.DOCTOR or not profile.doctor:
        return HttpResponseForbidden("Doctor access only.")
    appointments = profile.doctor.appointments.select_related("patient").order_by("appointment_date", "appointment_time")
    return render(request, "appointments/doctor_dashboard.html", {
        "doctor": profile.doctor,
        "appointments": appointments,
        "today": timezone.localdate(),
        "booked_count": appointments.filter(status=Appointment.Status.BOOKED).count(),
    })


@login_required
def patient_dashboard(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    if profile.role != Profile.Role.PATIENT:
        return HttpResponseForbidden("Patient access only.")
    appointments = request.user.appointments.select_related("doctor").order_by("appointment_date", "appointment_time")
    return render(request, "appointments/patient_dashboard.html", {"appointments": appointments, "today": timezone.localdate()})


@login_required
def book_appointment(request, pk):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    if profile.role != Profile.Role.PATIENT:
        messages.error(request, "Only patient accounts can book appointments.")
        return redirect("dashboard")
    doctor = get_object_or_404(Doctor, pk=pk, is_available=True)
    initial = {
        "patient_name": request.user.get_full_name(),
        "patient_email": request.user.email,
    }
    form = AppointmentForm(request.POST or None, initial=initial)
    if request.method == "POST" and form.is_valid():
        appointment = form.save(commit=False)
        appointment.doctor = doctor
        appointment.patient = request.user
        try:
            with transaction.atomic():
                appointment.save()
        except IntegrityError:
            form.add_error("appointment_time", "That slot was just booked. Please choose another time.")
        else:
            request.session["last_appointment_id"] = appointment.pk
            return redirect("booking_success", pk=appointment.pk)
    return render(request, "appointments/book.html", {"doctor": doctor, "form": form})


def booking_success(request, pk):
    appointment = get_object_or_404(Appointment.objects.select_related("doctor"), pk=pk)
    if request.session.get("last_appointment_id") != appointment.pk:
        return redirect("home")
    return render(request, "appointments/success.html", {"appointment": appointment})


@login_required
def my_appointments(request):
    return redirect("patient_dashboard")


@login_required
def cancel_appointment(request, pk):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    appointment = get_object_or_404(Appointment, pk=pk, status=Appointment.Status.BOOKED)
    if appointment.patient_id != request.user.id and not request.user.is_superuser:
        return HttpResponseForbidden("You cannot cancel this appointment.")
    appointment.status = Appointment.Status.CANCELLED
    appointment.save(update_fields=["status"])
    messages.success(request, "Your appointment has been cancelled.")
    return redirect("patient_dashboard")


@login_required
def update_appointment_status(request, pk, status):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    profile, _ = Profile.objects.get_or_create(user=request.user)
    if profile.role != Profile.Role.DOCTOR or not profile.doctor:
        return HttpResponseForbidden("Doctor access only.")
    if status not in {Appointment.Status.COMPLETED, Appointment.Status.CANCELLED}:
        return HttpResponseForbidden("Invalid appointment status.")
    appointment = get_object_or_404(Appointment, pk=pk, doctor=profile.doctor, status=Appointment.Status.BOOKED)
    appointment.status = status
    appointment.save(update_fields=["status"])
    messages.success(request, f"Appointment marked {appointment.get_status_display().lower()}.")
    return redirect("doctor_dashboard")
