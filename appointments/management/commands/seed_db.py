import datetime
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from hospitals.models import Hospital
from doctors.models import Doctor
from appointments.models import TimeSlot, Appointment, Profile, Prescription, Review, MedicalReport
from users.models import PatientProfile

User = get_user_model()

SLOTS = [
    "09:00", "09:15", "09:30", "09:45",
    "10:00", "10:15", "10:30", "10:45",
    "11:00", "11:15", "11:30", "11:45",
    "02:00", "02:15", "02:30", "02:45",
    "03:00", "03:15", "03:30", "03:45",
    "04:00", "04:15", "04:30", "04:45",
]

HOSPITALS = [
    {"name": "Apollo Hospital", "city": "Indore", "address": "Vijay Nagar, Indore"},
    {"name": "Care Hospital", "city": "Bhopal", "address": "Arera Colony, Bhopal"},
    {"name": "Medanta Hospital", "city": "Indore", "address": "AB Road, Indore"},
    {"name": "Smile Clinic", "city": "Mumbai", "address": "Bandra West, Mumbai"},
    {"name": "City Hospital", "city": "Indore", "address": "Palasia, Indore"},
    {"name": "Women's Care", "city": "Bhopal", "address": "MP Nagar, Bhopal"},
    {"name": "Rainbow Hospital", "city": "Delhi", "address": "Saket, Delhi"},
    {"name": "Mind Clinic", "city": "Pune", "address": "Koregaon Park, Pune"},
]

DOCTORS_DATA = [
    {"name": "Dr. Raj Sharma", "specialty": "Cardiologist", "hospital": "Apollo Hospital", "experience": 14, "fee": 700, "rating": 4.8, "qualification": "MBBS MD DM", "languages": "Hindi, English", "gender": "male"},
    {"name": "Dr. Neha Jain", "specialty": "Dermatologist", "hospital": "Care Hospital", "experience": 9, "fee": 500, "rating": 4.6, "qualification": "MBBS DDVL", "languages": "Hindi, English", "gender": "female"},
    {"name": "Dr. Amit Verma", "specialty": "Neurologist", "hospital": "Medanta Hospital", "experience": 18, "fee": 1200, "rating": 4.9, "qualification": "MBBS MD DM", "languages": "Hindi, English", "gender": "male"},
    {"name": "Dr. Sneha Gupta", "specialty": "Dentist", "hospital": "Smile Clinic", "experience": 8, "fee": 400, "rating": 4.7, "qualification": "BDS MDS", "languages": "Hindi, English", "gender": "female"},
    {"name": "Dr. Vivek Patel", "specialty": "Orthopedic", "hospital": "City Hospital", "experience": 15, "fee": 800, "rating": 4.5, "qualification": "MBBS MS Ortho", "languages": "Hindi, English, Gujarati", "gender": "male"},
    {"name": "Dr. Rohit Singh", "specialty": "General Physician", "hospital": "Apollo Hospital", "experience": 12, "fee": 500, "rating": 4.8, "qualification": "MBBS MD Medicine", "languages": "Hindi, English", "gender": "male"},
    {"name": "Dr. Pooja Shah", "specialty": "Gynecologist", "hospital": "Women's Care", "experience": 11, "fee": 700, "rating": 4.9, "qualification": "MBBS MS OBG", "languages": "Hindi, English", "gender": "female"},
    {"name": "Dr. Ankit Gupta", "specialty": "ENT", "hospital": "Care Hospital", "experience": 7, "fee": 450, "rating": 4.4, "qualification": "MBBS MS ENT", "languages": "Hindi, English", "gender": "male"},
    {"name": "Dr. Kunal Joshi", "specialty": "Psychiatrist", "hospital": "Mind Clinic", "experience": 10, "fee": 900, "rating": 4.8, "qualification": "MBBS MD Psychiatry", "languages": "Hindi, English, Marathi", "gender": "male"},
    {"name": "Dr. Meera Kapoor", "specialty": "Pediatrician", "hospital": "Rainbow Hospital", "experience": 16, "fee": 650, "rating": 4.9, "qualification": "MBBS DCH MD", "languages": "Hindi, English", "gender": "female"},
]

FIRST_NAMES = ["Amit", "Rohan", "Priya", "Sunita", "Vikram", "Neha", "Rahul", "Aashi", "Siddharth", "Kiran"]
LAST_NAMES = ["Sharma", "Verma", "Pandey", "Gupta", "Jain", "Patel", "Singh", "Shah", "Mehta", "Joshi"]

class Command(BaseCommand):
    help = "Seeds database with time slots, hospitals, doctors, and users for a production-like workspace."

    def handle(self, *args, **options):
        self.stdout.write("Cleaning database...")
        Prescription.objects.all().delete()
        Review.objects.all().delete()
        MedicalReport.objects.all().delete()
        Appointment.objects.all().delete()
        Profile.objects.all().delete()
        PatientProfile.objects.all().delete()
        Doctor.objects.all().delete()
        Hospital.objects.all().delete()
        TimeSlot.objects.all().delete()
        
        # Delete user accounts except superusers
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write("Seeding time slots...")
        for slot in SLOTS:
            TimeSlot.objects.get_or_create(time=slot)

        self.stdout.write("Seeding hospitals...")
        hosp_instances = {}
        for h in HOSPITALS:
            inst = Hospital.objects.create(
                name=h["name"],
                city=h["city"],
                address=h["address"],
                phone="0731-252525",
                email=f"info@{h['name'].lower().replace(' ', '')}.com"
            )
            hosp_instances[h["name"]] = inst

        self.stdout.write("Seeding doctor user accounts and profiles...")
        doc_instances = []
        for d in DOCTORS_DATA:
            username = d["name"].lower().replace(". ", "_").replace(" ", "")
            email = f"{username}@medislot.com"
            
            # Create User
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=d["name"].split(" ")[1],
                last_name=d["name"].split(" ")[2] if len(d["name"].split(" ")) > 2 else "Doctor",
                password="password123"
            )
            
            # Create Doctor Profile
            hosp = hosp_instances.get(d["hospital"])
            doc = Doctor.objects.create(
                user=user,
                hospital=hosp,
                specialization=d["specialty"],
                qualification=d["qualification"],
                experience_years=d["experience"],
                consultation_fee=d["fee"],
                rating=d["rating"],
                languages=d["languages"],
                gender=d["gender"],
                bio=f"Dr. {user.first_name} is a highly accomplished {d['specialty']} with {d['experience']} years of clinical experience."
            )
            doc_instances.append(doc)
            
            # Create system Profile linking user and role
            Profile.objects.create(user=user, role=Profile.Role.DOCTOR, doctor=doc)

        self.stdout.write("Seeding patient user accounts and profiles...")
        patient_instances = []
        for i in range(15):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            username = f"{first.lower()}_{last.lower()}_{random.randint(10,99)}"
            email = f"{username}@gmail.com"
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first,
                last_name=last,
                password="password123"
            )
            patient_instances.append(user)
            Profile.objects.create(user=user, role=Profile.Role.PATIENT)
            PatientProfile.objects.create(
                user=user,
                gender=random.choice(["male", "female"]),
                date_of_birth=datetime.date(random.randint(1975, 2005), random.randint(1, 12), random.randint(1, 28)),
                blood_group=random.choice(["A+", "B+", "AB+", "O+", "O-", "A-"]),
                city=random.choice(["Indore", "Bhopal", "Mumbai", "Delhi"]),
                has_insurance=random.choice([True, False]),
                insurance_provider="HDFC Ergo" if random.choice([True, False]) else "Star Health"
            )

        # Seed some reviews & appointments
        self.stdout.write("Seeding appointments, reviews, and prescriptions...")
        reasons = [
            "Routine health checkup and physical evaluation",
            "Severe headache recurring over last 3 days",
            "Follow up on medication for hypertension",
            "Acute dental pain in upper molar",
            "Skin rash on arms with severe itching",
            "Chest pain and fatigue during mild exercise",
            "Consultation for child immunization plan",
            "Anxiety, lack of sleep and persistent stress"
        ]

        medicines = ["Paracetamol 500mg", "Amoxicillin 250mg", "Cetirizine 10mg", "Ibuprofen 400mg", "Atorvastatin 10mg", "Metformin 500mg"]
        dosages = ["1-0-1 after meals", "1-1-1 for 5 days", "0-0-1 at night", "1-0-0 empty stomach"]

        today = datetime.date.today()
        for idx, doc in enumerate(doc_instances):
            # Give every doctor 2-3 reviews
            patients_for_reviews = random.sample(patient_instances, 3)
            for pat in patients_for_reviews:
                rating = random.randint(4, 5) if doc.rating >= 4.7 else random.randint(3, 5)
                Review.objects.create(
                    doctor=doc,
                    patient=pat,
                    rating=rating,
                    comment=f"Great experience with Dr. {doc.user.first_name}. Very polite and professional."
                )

            # Give every doctor some booked appointments
            # Past appointments (completed)
            for day_offset in range(1, 5):
                pat = random.choice(patient_instances)
                date = today - datetime.timedelta(days=day_offset)
                time_str = random.choice(SLOTS)
                app = Appointment.objects.create(
                    doctor=doc,
                    patient=pat,
                    patient_name=pat.get_full_name() or pat.username,
                    patient_email=pat.email,
                    patient_phone="9876543210",
                    appointment_date=date,
                    appointment_time=datetime.datetime.strptime(time_str, "%H:%M").time(),
                    reason=random.choice(reasons),
                    status=Appointment.Status.COMPLETED,
                    payment_status="paid"
                )
                # Prescription for completed appointments
                Prescription.objects.create(
                    appointment=app,
                    medicine=f"{random.choice(medicines)}\n{random.choice(medicines)}",
                    dosage=f"{random.choice(dosages)}\n{random.choice(dosages)}"
                )

            # Future appointments (booked)
            for day_offset in range(0, 3):
                pat = random.choice(patient_instances)
                date = today + datetime.timedelta(days=day_offset)
                time_str = random.choice(SLOTS)
                
                # Check slot conflict
                if not Appointment.objects.filter(doctor=doc, appointment_date=date, appointment_time=datetime.datetime.strptime(time_str, "%H:%M").time(), status="booked").exists():
                    Appointment.objects.create(
                        doctor=doc,
                        patient=pat,
                        patient_name=pat.get_full_name() or pat.username,
                        patient_email=pat.email,
                        patient_phone="9876543210",
                        appointment_date=date,
                        appointment_time=datetime.datetime.strptime(time_str, "%H:%M").time(),
                        reason=random.choice(reasons),
                        status=Appointment.Status.BOOKED,
                        video_link=f"https://meet.google.com/abc-{random.randint(100,999)}-xyz",
                        payment_status="paid"
                    )

            # Medical report for a patient
            pat = random.choice(patient_instances)
            MedicalReport.objects.create(
                patient=pat,
                title="Routine Blood Report",
                file_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded the database!"))
