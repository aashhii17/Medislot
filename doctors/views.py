from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
import datetime

from .models import Doctor
from .serializers import DoctorSerializer
from appointments.models import TimeSlot, Appointment, DoctorHoliday


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Doctor.objects.filter(is_active=True)
        
        # Search queries
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(specialization__icontains=search) |
                Q(qualification__icontains=search) |
                Q(bio__icontains=search)
            )

        # Filters
        specialty = self.request.query_params.get('specialty')
        if specialty:
            queryset = queryset.filter(specialization__iexact=specialty)

        hospital_id = self.request.query_params.get('hospital')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)

        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(hospital__city__iexact=city)

        gender = self.request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(gender__iexact=gender)

        lang = self.request.query_params.get('language')
        if lang:
            queryset = queryset.filter(languages__icontains=lang)

        fee_max = self.request.query_params.get('fee_max')
        if fee_max:
            try:
                queryset = queryset.filter(consultation_fee__lte=float(fee_max))
            except ValueError:
                pass

        exp_min = self.request.query_params.get('experience_min')
        if exp_min:
            try:
                queryset = queryset.filter(experience_years__gte=int(exp_min))
            except ValueError:
                pass

        rating_min = self.request.query_params.get('rating_min')
        if rating_min:
            try:
                queryset = queryset.filter(rating__gte=float(rating_min))
            except ValueError:
                pass

        online = self.request.query_params.get('online_consultation')
        if online:
            queryset = queryset.filter(online_consultation=online.lower() == 'true')

        insurance = self.request.query_params.get('insurance_accepted')
        if insurance:
            queryset = queryset.filter(insurance_accepted=insurance.lower() == 'true')

        available_today = self.request.query_params.get('available_today')
        if available_today and available_today.lower() == 'true':
            today = datetime.date.today()
            # Exclude doctors on holiday today
            on_holiday = DoctorHoliday.objects.filter(date=today).values_list('doctor_id', flat=True)
            queryset = queryset.exclude(id__in=on_holiday)

        return queryset

    @action(detail=True, methods=['get'], url_path='slots')
    def slots(self, request, pk=None):
        doctor = self.get_object()
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'Date parameter is required (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({'error': 'Invalid date format (use YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if doctor is on holiday on this date
        on_holiday = DoctorHoliday.objects.filter(doctor=doctor, date=date).exists()
        
        all_slots = TimeSlot.objects.all()
        # If no slots in database, seed them dynamically to prevent failures
        if not all_slots.exists():
            from appointments.management.commands.seed_db import SLOTS
            for slot_val in SLOTS:
                TimeSlot.objects.get_or_create(time=slot_val)
            all_slots = TimeSlot.objects.all()

        # Get booked slots for this doctor on this day
        booked_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=date,
            status=Appointment.Status.BOOKED
        ).values_list('appointment_time', flat=True)
        
        booked_times = [t.strftime("%H:%M") for t in booked_appointments]

        slots_data = []
        for slot in all_slots.order_by('time'):
            is_available = not on_holiday and (slot.time not in booked_times)
            slots_data.append({
                'time': slot.time,
                'is_available': is_available
            })

        return Response({
            'date': date_str,
            'on_holiday': on_holiday,
            'slots': slots_data
        })
