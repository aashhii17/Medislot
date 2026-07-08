from rest_framework import serializers
from .models import Doctor

class DoctorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    specialty = serializers.CharField(source='specialization')
    is_available = serializers.BooleanField(source='is_active')
    hospital_name = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            'id',
            'name',
            'specialty',
            'qualification',
            'experience_years',
            'consultation_fee',
            'bio',
            'is_available',
            'hospital',
            'hospital_name',
            'city',
            'user',
            'rating',
            'languages',
            'online_consultation',
            'insurance_accepted',
            'gender',
        ]

    def get_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return ""

    def get_hospital_name(self, obj):
        return obj.hospital.name if obj.hospital else "Independent Clinic"

    def get_city(self, obj):
        return obj.hospital.city if obj.hospital else "Indore"
