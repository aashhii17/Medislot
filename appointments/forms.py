from datetime import time

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone

from .models import Appointment, Doctor, Profile


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


class SignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=60, label="First name")
    last_name = forms.CharField(max_length=60, label="Last name")
    role = forms.ChoiceField(choices=Profile.Role.choices, widget=forms.RadioSelect)
    doctor = forms.ModelChoiceField(
        queryset=Doctor.objects.none(), required=False, label="Your doctor profile",
        help_text="Required only when signing up as a doctor.",
    )

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ["username", "first_name", "last_name", "email", "role", "doctor", "password1", "password2"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["doctor"].queryset = Doctor.objects.filter(user_profile__isnull=True).order_by("user__first_name", "user__last_name")

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("role") == Profile.Role.DOCTOR and not cleaned.get("doctor"):
            self.add_error("doctor", "Select your doctor profile.")
        if cleaned.get("role") == Profile.Role.PATIENT:
            cleaned["doctor"] = None
        return cleaned
