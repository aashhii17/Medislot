from django.contrib.auth import get_user_model
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import os
import uuid
import datetime
from django.utils import timezone
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from appointments.models import Profile
from users.models import OTP, PatientProfile
from .serializers import UserSerializer, SignUpSerializer, PatientProfileSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return JsonResponse({'status': 'ok', 'service': 'MediSlot API'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignUpSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'user': user_data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    token = request.data.get('token')
    if not token:
        return Response({'error': 'Google token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        client_id = os.environ.get('GOOGLE_CLIENT_ID', None)
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        email = idinfo.get('email')
        if not email:
            return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
            
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
        # Get or create User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0] + '_' + str(uuid.uuid4().hex[:6]),
                'first_name': first_name,
                'last_name': last_name,
            }
        )
        
        if created:
            user.set_unusable_password()
            user.save()
            
        # Get or create Profile
        Profile.objects.get_or_create(user=user, defaults={'role': Profile.Role.PATIENT})
        PatientProfile.objects.get_or_create(user=user)
        
        # Generate JWT
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        
        return Response({
            'user': user_data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Auth failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get or create user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email.split('@')[0] + '_' + str(uuid.uuid4().hex[:6]),
            'first_name': email.split('@')[0].capitalize(),
            'last_name': 'Patient'
        }
    )
    if created:
        user.set_unusable_password()
        user.save()
        Profile.objects.get_or_create(user=user, defaults={'role': Profile.Role.PATIENT})
        PatientProfile.objects.get_or_create(user=user)

    code = OTP.generate_code()
    expires_at = timezone.now() + datetime.timedelta(minutes=10)
    
    # Create OTP object
    OTP.objects.create(
        user=user,
        code=code,
        purpose='login',
        expires_at=expires_at
    )
    
    # Log the OTP for console and return it directly for easy client debugging
    print(f"--- OTP CODE FOR {email}: {code} ---")
    
    return Response({
        'message': 'OTP sent successfully',
        'code': code  # Returned for ease of sandbox execution testing
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    code = request.data.get('code')
    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    otps = OTP.objects.filter(user=user, code=code, is_used=False)
    valid_otp = None
    for otp in otps:
        if otp.is_valid():
            valid_otp = otp
            break
            
    if not valid_otp:
        return Response({'error': 'Invalid or expired OTP code'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Mark OTP as used
    valid_otp.is_used = True
    valid_otp.save()
    
    # Ensure patient profile setup
    Profile.objects.get_or_create(user=user, defaults={'role': Profile.Role.PATIENT})
    PatientProfile.objects.get_or_create(user=user)
    
    # Generate JWT
    refresh = RefreshToken.for_user(user)
    user_data = UserSerializer(user).data
    
    return Response({
        'user': user_data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def patient_profile_view(request):
    try:
        profile, created = PatientProfile.objects.get_or_create(user=request.user)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    if request.method == 'GET':
        serializer = PatientProfileSerializer(profile)
        return Response(serializer.data)
        
    elif request.method == 'PUT':
        serializer = PatientProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Also update user first_name and last_name if supplied
            user_data = request.data.get('user', {})
            user = request.user
            updated_user = False
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
                updated_user = True
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
                updated_user = True
            if updated_user:
                user.save()
                
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
