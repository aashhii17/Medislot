from datetime import time

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone

from .models import Appointment, Doctor, Profile
from hospitals.models import Hospital


TIME_CHOICES = [(time(hour, minute), f"{time(hour, minute):%I:%M %p}") for hour in range(9, 18) for minute in (0, 30)]


class AppointmentForm(forms.ModelForm):
    appointment_time = forms.ChoiceField(choices=[(value.strftime("%H:%M"), label) for value, label in TIME_CHOICES])

    class Meta:
        model = Appointment
        fields = ["patient_name", "patient_email", "patient_phone", "appointment_date", "appointment_time", "reason"]
        widgets = {
            "appointment_date": forms.DateInput(attrs={"type": "date"}),
            "reason": forms.Textarea(attrs={"rows": 4, "placeholder": "Briefly describe your symptoms or reason for visiting"}),
        }
        labels = {
            "patient_name": "Full name",
            "patient_email": "Email address",
            "patient_phone": "Phone number",
            "appointment_date": "Preferred date",
            "appointment_time": "Available time",
            "reason": "Reason for appointment",
        }

    def clean_appointment_date(self):
        value = self.cleaned_data["appointment_date"]
        if value < timezone.localdate():
            raise forms.ValidationError("Please select today or a future date.")
        return value

    def clean_patient_phone(self):
        value = self.cleaned_data["patient_phone"].strip()
        digits = "".join(character for character in value if character.isdigit())
        if len(digits) < 10:
            raise forms.ValidationError("Enter a valid phone number with at least 10 digits.")
        return value


class LookupForm(forms.Form):
    email = forms.EmailField(label="Patient email", widget=forms.EmailInput(attrs={"placeholder": "you@example.com"}))


class PatientSignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=60, label="First name")
    last_name = forms.CharField(max_length=60, label="Last name")

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ["username", "first_name", "last_name", "email"]

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email


class DoctorSignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=60, label="First name")
    last_name = forms.CharField(max_length=60, label="Last name")
    
    # Doctor professional fields
    license_number = forms.CharField(max_length=100, label="Medical License / Registration Number", required=True)
    specialization = forms.CharField(max_length=100, label="Specialization (e.g. Cardiology)", required=True)
    qualification = forms.CharField(max_length=200, label="Qualification (e.g. MBBS, MD)", required=True)
    experience_years = forms.IntegerField(min_value=0, label="Years of Experience", required=True)
    consultation_fee = forms.DecimalField(min_value=0, max_digits=10, decimal_places=2, label="Consultation Fee (₹)", required=True)
    hospital = forms.ModelChoiceField(queryset=Hospital.objects.all(), label="Affiliated Hospital", required=False, empty_label="Select Hospital")
    bio = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), required=False, label="Brief Bio (Patient facing info)")
    languages = forms.CharField(max_length=200, initial="Hindi, English", label="Languages Spoken", required=False)
    online_consultation = forms.BooleanField(initial=True, required=False, label="Available for Online Consultation")
    insurance_accepted = forms.BooleanField(initial=True, required=False, label="Insurance Accepted")
    gender = forms.ChoiceField(choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], initial='male', label="Gender")

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ["username", "first_name", "last_name", "email"]

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email
