from django.contrib.auth import get_user_model
from rest_framework import serializers
from appointments.models import Profile, Doctor
from django.db import transaction

User = get_user_model()

from users.models import PatientProfile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['role', 'doctor']

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            'patient_id', 'gender', 'date_of_birth', 'blood_group',
            'city', 'address', 'medical_history', 'allergies',
            'emergency_contact_name', 'emergency_contact_phone',
            'has_insurance', 'insurance_provider', 'insurance_policy_number'
        ]
        read_only_fields = ['patient_id']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    patient_profile = PatientProfileSerializer(read_only=True)
    role = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile', 'patient_profile', 'role', 'doctor_id')
        
    def get_role(self, obj):
        try:
            return obj.profile.role
        except Profile.DoesNotExist:
            return 'patient'
            
    def get_doctor_id(self, obj):
        try:
            return obj.profile.doctor.id if obj.profile.doctor else None
        except Profile.DoesNotExist:
            return None

class SignUpSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")
    role = serializers.ChoiceField(choices=Profile.Role.choices, default=Profile.Role.PATIENT)
    doctor_id = serializers.UUIDField(required=False, allow_null=True, default=None)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        username = validated_data['username']
        password = validated_data['password']
        email = validated_data['email']
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        role = validated_data.get('role', Profile.Role.PATIENT)
        doctor_id = validated_data.get('doctor_id')

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            
            doctor = None
            if role == Profile.Role.DOCTOR and doctor_id:
                try:
                    doctor = Doctor.objects.get(pk=doctor_id)
                except Doctor.DoesNotExist:
                    raise serializers.ValidationError({"doctor_id": "Selected doctor does not exist."})
                    
            Profile.objects.create(user=user, role=role, doctor=doctor)
            
        return user
