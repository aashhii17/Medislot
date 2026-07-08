from django.urls import path
from django.contrib.auth import views as auth_views

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("signup/", views.signup, name="signup"),
    path("login/", auth_views.LoginView.as_view(template_name="registration/login.html", redirect_authenticated_user=True), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("dashboard/admin/", views.admin_dashboard, name="admin_dashboard"),
    path("dashboard/doctor/", views.doctor_dashboard, name="doctor_dashboard"),
    path("dashboard/patient/", views.patient_dashboard, name="patient_dashboard"),
    path("doctors/<str:pk>/", views.doctor_detail, name="doctor_detail"),
    path("doctors/<str:pk>/book/", views.book_appointment, name="book_appointment"),
    path("appointments/<int:pk>/confirmed/", views.booking_success, name="booking_success"),
    path("my-appointments/", views.my_appointments, name="my_appointments"),
    path("appointments/<int:pk>/cancel/", views.cancel_appointment, name="cancel_appointment"),
    path("appointments/<int:pk>/<str:status>/", views.update_appointment_status, name="update_appointment_status"),
]
