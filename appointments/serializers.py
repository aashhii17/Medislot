from rest_framework import serializers
from .models import Appointment, Doctor, Prescription, MedicalReport, Review, DoctorHoliday
from doctors.serializers import DoctorSerializer

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ['id', 'appointment', 'medicine', 'dosage', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'doctor', 'patient', 'patient_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'patient', 'patient_name', 'created_at']

    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.get_full_name() or obj.patient.username
        return "Anonymous Patient"


class DoctorHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorHoliday
        fields = ['id', 'doctor', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']


class MedicalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalReport
        fields = ['id', 'patient', 'file', 'file_url', 'title', 'created_at']
        read_only_fields = ['id', 'patient', 'created_at']


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_detail = DoctorSerializer(source='doctor', read_only=True)
    prescription = PrescriptionSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor', 'doctor_detail', 'patient', 'patient_name', 
            'patient_email', 'patient_phone', 'appointment_date', 
            'appointment_time', 'reason', 'status', 'video_link',
            'is_emergency', 'payment_status', 'prescription', 'created_at'
        ]
        read_only_fields = ['patient', 'status', 'created_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'doctor', 'patient_name', 'patient_email', 'patient_phone', 
            'appointment_date', 'appointment_time', 'reason',
            'is_emergency', 'payment_status', 'video_link'
        ]
        
    def validate(self, data):
        # Validate that slot is not already booked
        doctor = data['doctor']
        date = data['appointment_date']
        time = data['appointment_time']
        
        # Check doctor holiday
        if DoctorHoliday.objects.filter(doctor=doctor, date=date).exists():
            raise serializers.ValidationError(
                "The doctor is on holiday on this date."
            )
            
        existing = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=date,
            appointment_time=time,
            status=Appointment.Status.BOOKED
        )
        if existing.exists():
            raise serializers.ValidationError(
                "This slot is already booked for this doctor."
            )
        return data
