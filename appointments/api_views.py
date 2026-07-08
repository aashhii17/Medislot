from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
import datetime
from django.contrib.auth import get_user_model

from .models import Appointment, Profile, Prescription, MedicalReport, Review, DoctorHoliday
from doctors.models import Doctor
from .serializers import (
    AppointmentSerializer, 
    AppointmentCreateSerializer, 
    PrescriptionSerializer, 
    MedicalReportSerializer, 
    ReviewSerializer, 
    DoctorHolidaySerializer
)

User = get_user_model()


class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Appointment.objects.all()
            
        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.role == Profile.Role.DOCTOR and profile.doctor:
            return Appointment.objects.filter(doctor=profile.doctor)
        return Appointment.objects.filter(patient=user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        
        is_patient = appointment.patient == user
        is_doctor = profile.role == Profile.Role.DOCTOR and appointment.doctor == profile.doctor
        
        if not (is_patient or is_doctor or user.is_superuser):
            return Response(
                {"detail": "You do not have permission to cancel this appointment."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if appointment.status == Appointment.Status.CANCELLED:
            return Response(
                {"detail": "Appointment is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        appointment.status = Appointment.Status.CANCELLED
        appointment.save()
        return Response({"status": "Appointment cancelled successfully."})

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        appointment = self.get_object()
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        
        is_doctor = profile.role == Profile.Role.DOCTOR and appointment.doctor == profile.doctor
        
        if not (is_doctor or user.is_superuser):
            return Response(
                {"detail": "Only the assigned doctor can accept this appointment."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        appointment.status = Appointment.Status.BOOKED
        appointment.save()
        return Response({"status": "Appointment accepted successfully."})

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        appointment = self.get_object()
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        
        is_doctor = profile.role == Profile.Role.DOCTOR and appointment.doctor == profile.doctor
        
        if not (is_doctor or user.is_superuser):
            return Response(
                {"detail": "Only the doctor can mark this appointment as completed."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if appointment.status != Appointment.Status.BOOKED:
            return Response(
                {"detail": "Only booked appointments can be marked as completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        appointment.status = Appointment.Status.COMPLETED
        appointment.save()
        return Response({"status": "Appointment completed successfully."})

    @action(detail=True, methods=['post'], url_path='prescription')
    def write_prescription(self, request, pk=None):
        appointment = self.get_object()
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        
        is_doctor = profile.role == Profile.Role.DOCTOR and appointment.doctor == profile.doctor
        if not (is_doctor or user.is_superuser):
            return Response(
                {"detail": "Only the doctor can write a prescription for this appointment."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        medicine = request.data.get('medicine')
        dosage = request.data.get('dosage')
        if not medicine or not dosage:
            return Response(
                {"detail": "Medicine and dosage are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        prescription, created = Prescription.objects.update_or_create(
            appointment=appointment,
            defaults={'medicine': medicine, 'dosage': dosage}
        )
        serializer = PrescriptionSerializer(prescription)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='review')
    def add_review(self, request, pk=None):
        appointment = self.get_object()
        if appointment.patient != request.user:
            return Response(
                {"detail": "Only the patient of this appointment can review the doctor."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        if not rating:
            return Response(
                {"detail": "Rating is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            rating_val = int(rating)
            if rating_val < 1 or rating_val > 5:
                raise ValueError()
        except ValueError:
            return Response(
                {"detail": "Rating must be an integer between 1 and 5."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        review = Review.objects.create(
            doctor=appointment.doctor,
            patient=request.user,
            rating=rating_val,
            comment=comment
        )
        
        # Recalculate doctor average rating
        avg_rating = Review.objects.filter(doctor=appointment.doctor).aggregate(Avg('rating'))['rating__avg']
        if avg_rating:
            appointment.doctor.rating = round(avg_rating, 2)
            appointment.doctor.save()
            
        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PrescriptionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.role == Profile.Role.DOCTOR and profile.doctor:
            return Prescription.objects.filter(appointment__doctor=profile.doctor)
        return Prescription.objects.filter(appointment__patient=user)


class MedicalReportViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MedicalReport.objects.filter(patient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


class DoctorHolidayViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorHolidaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.role == Profile.Role.DOCTOR and profile.doctor:
            return DoctorHoliday.objects.filter(doctor=profile.doctor)
        return DoctorHoliday.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.role == Profile.Role.DOCTOR and profile.doctor:
            serializer.save(doctor=profile.doctor)
        else:
            raise permissions.exceptions.PermissionDenied("Only doctors can block holiday dates.")


class AnalyticsDashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        
        # 1. Admin Analytics
        if user.is_superuser:
            total_revenue = Appointment.objects.filter(status='completed').count() * 500  # mock revenue computation or sum of fees
            # Better: sum of doctor fees
            fee_sum = Appointment.objects.filter(status='completed').aggregate(Sum('doctor__consultation_fee'))['doctor__consultation_fee__sum'] or 0
            
            top_doctors_query = Doctor.objects.annotate(
                app_count=Count('appointments')
            ).order_by('-rating')[:5]
            
            top_doctors = [{
                'name': d.user.get_full_name() or d.user.username,
                'specialty': d.specialization,
                'rating': d.rating,
                'appointments': d.app_count
            } for d in top_doctors_query]

            app_stats = Appointment.objects.values('status').annotate(count=Count('id'))
            
            return Response({
                'role': 'admin',
                'total_revenue': float(fee_sum),
                'total_doctors': Doctor.objects.count(),
                'total_patients': User.objects.filter(profile__role='patient').count(),
                'top_doctors': top_doctors,
                'appointment_statistics': {item['status']: item['count'] for item in app_stats}
            })
            
        # 2. Doctor Analytics
        elif profile.role == Profile.Role.DOCTOR and profile.doctor:
            doc = profile.doctor
            completed_apps = Appointment.objects.filter(doctor=doc, status='completed')
            earnings = completed_apps.aggregate(Sum('doctor__consultation_fee'))['doctor__consultation_fee__sum'] or 0
            
            today = datetime.date.today()
            today_apps = Appointment.objects.filter(doctor=doc, appointment_date=today)
            upcoming_apps = Appointment.objects.filter(doctor=doc, appointment_date__gt=today, status='booked')
            
            return Response({
                'role': 'doctor',
                'total_earnings': float(earnings),
                'completed_count': completed_apps.count(),
                'today_count': today_apps.count(),
                'upcoming_count': upcoming_apps.count(),
                'average_rating': doc.rating
            })
            
        # 3. Patient Analytics
        else:
            apps = Appointment.objects.filter(patient=user)
            completed_apps = apps.filter(status='completed')
            total_spent = completed_apps.aggregate(Sum('doctor__consultation_fee'))['doctor__consultation_fee__sum'] or 0
            reports_count = MedicalReport.objects.filter(patient=user).count()
            
            return Response({
                'role': 'patient',
                'appointments_count': apps.count(),
                'completed_count': completed_apps.count(),
                'total_spent': float(total_spent),
                'reports_count': reports_count
            })
