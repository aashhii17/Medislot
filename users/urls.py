from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('me/', views.current_user, name='current_user'),
    path('health/', views.health_check, name='health_check'),
    path('signup/', views.signup, name='api_signup'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('google/', views.google_login, name='api_google_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # OTP endpoints
    path('otp/send/', views.send_otp, name='send_otp'),
    path('otp/verify/', views.verify_otp, name='verify_otp'),
    
    # Patient profile endpoints
    path('patient/profile/', views.patient_profile_view, name='patient_profile'),
]
