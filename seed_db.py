import os
import sys
import django

# Set up Django environment dynamically
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "clinic_site.settings")
django.setup()

from django.contrib.auth.models import User
from hospitals.models import Hospital
from doctors.models import Doctor
from appointments.models import Profile

def seed():
    # 1. Create Hospital
    hospital, created = Hospital.objects.get_or_create(
        name="MediSlot Premium Clinic",
        defaults={
            "city": "Mumbai",
            "state": "Maharashtra",
            "address": "123 Healthcare Boulevard, Mumbai",
            "phone": "+919876543210",
            "email": "info@medislot.com",
            "website": "https://medislot.com",
        }
    )
    print(f"Hospital: {hospital.name} (Created: {created})")

    # 2. Doctors list
    doctors_data = [
        {
            "username": "dr_aarav",
            "email": "aarav.sharma@medislot.com",
            "first_name": "Aarav",
            "last_name": "Sharma",
            "specialization": "Cardiology",
            "qualification": "MBBS, MD (Cardiology)",
            "experience_years": 14,
            "consultation_fee": 900,
            "bio": "Specialises in preventive cardiology, hypertension management, and long-term heart health."
        },
        {
            "username": "dr_meera",
            "email": "meera.iyer@medislot.com",
            "first_name": "Meera",
            "last_name": "Iyer",
            "specialization": "Dermatology",
            "qualification": "MBBS, MD (Dermatology)",
            "experience_years": 11,
            "consultation_fee": 700,
            "bio": "Provides evidence-based care for skin, hair, and nail conditions for patients of all ages."
        },
        {
            "username": "dr_vikram",
            "email": "vikram.singh@medislot.com",
            "first_name": "Vikram",
            "last_name": "Singh",
            "specialization": "Orthopaedics",
            "qualification": "MBBS, MS (Orthopaedics)",
            "experience_years": 16,
            "consultation_fee": 850,
            "bio": "Focused on joint health, sports injuries, fracture care, and non-surgical rehabilitation."
        },
        {
            "username": "dr_nisha",
            "email": "nisha.kapoor@medislot.com",
            "first_name": "Nisha",
            "last_name": "Kapoor",
            "specialization": "Paediatrics",
            "qualification": "MBBS, MD (Paediatrics)",
            "experience_years": 9,
            "consultation_fee": 650,
            "bio": "Compassionate care for infants, children, and adolescents, including growth and vaccination guidance."
        },
        {
            "username": "dr_rohan",
            "email": "rohan.desai@medislot.com",
            "first_name": "Rohan",
            "last_name": "Desai",
            "specialization": "Neurology",
            "qualification": "MBBS, DM (Neurology)",
            "experience_years": 13,
            "consultation_fee": 1000,
            "bio": "Treats headaches, movement disorders, epilepsy, and other neurological conditions."
        },
        {
            "username": "dr_ananya",
            "email": "ananya.rao@medislot.com",
            "first_name": "Ananya",
            "last_name": "Rao",
            "specialization": "General Medicine",
            "qualification": "MBBS, MD (Internal Medicine)",
            "experience_years": 8,
            "consultation_fee": 600,
            "bio": "Offers comprehensive primary care, health screening, and management of common medical conditions."
        }
    ]

    for data in doctors_data:
        # Create User
        user, u_created = User.objects.get_or_create(
            username=data["username"],
            defaults={
                "email": data["email"],
                "first_name": data["first_name"],
                "last_name": data["last_name"],
            }
        )
        if u_created:
            user.set_password("DoctorPassword123!")
            user.save()
        
        # Create Doctor Profile
        doctor, d_created = Doctor.objects.get_or_create(
            user=user,
            defaults={
                "hospital": hospital,
                "specialization": data["specialization"],
                "qualification": data["qualification"],
                "experience_years": data["experience_years"],
                "consultation_fee": data["consultation_fee"],
                "bio": data["bio"],
                "is_active": True,
            }
        )

        # Create Profile
        profile, p_created = Profile.objects.get_or_create(
            user=user,
            defaults={
                "role": Profile.Role.DOCTOR,
                "doctor": doctor
            }
        )
        print(f"Doctor User: {user.username} (Created: {u_created}), Profile: {doctor.specialization} (Created: {d_created})")

if __name__ == "__main__":
    seed()
