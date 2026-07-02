from django.db import migrations


DOCTORS = [
    {"name": "Aarav Sharma", "specialty": "Cardiology", "qualification": "MBBS, MD (Cardiology)", "experience_years": 14, "consultation_fee": 900, "bio": "Specialises in preventive cardiology, hypertension management, and long-term heart health."},
    {"name": "Meera Iyer", "specialty": "Dermatology", "qualification": "MBBS, MD (Dermatology)", "experience_years": 11, "consultation_fee": 700, "bio": "Provides evidence-based care for skin, hair, and nail conditions for patients of all ages."},
    {"name": "Vikram Singh", "specialty": "Orthopaedics", "qualification": "MBBS, MS (Orthopaedics)", "experience_years": 16, "consultation_fee": 850, "bio": "Focused on joint health, sports injuries, fracture care, and non-surgical rehabilitation."},
    {"name": "Nisha Kapoor", "specialty": "Paediatrics", "qualification": "MBBS, MD (Paediatrics)", "experience_years": 9, "consultation_fee": 650, "bio": "Compassionate care for infants, children, and adolescents, including growth and vaccination guidance."},
    {"name": "Rohan Desai", "specialty": "Neurology", "qualification": "MBBS, DM (Neurology)", "experience_years": 13, "consultation_fee": 1000, "bio": "Treats headaches, movement disorders, epilepsy, and other neurological conditions."},
    {"name": "Ananya Rao", "specialty": "General Medicine", "qualification": "MBBS, MD (Internal Medicine)", "experience_years": 8, "consultation_fee": 600, "bio": "Offers comprehensive primary care, health screening, and management of common medical conditions."},
]


def seed_doctors(apps, schema_editor):
    Doctor = apps.get_model("appointments", "Doctor")
    Doctor.objects.bulk_create([Doctor(**data) for data in DOCTORS], ignore_conflicts=True)


class Migration(migrations.Migration):
    dependencies = [("appointments", "0001_initial")]
    operations = [migrations.RunPython(seed_doctors, migrations.RunPython.noop)]
