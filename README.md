# MediSlot Doctor Appointment System

A Django appointment website with signup/login, separate admin, doctor, and patient dashboards, doctor search, booking, duplicate-slot protection, cancellation, and Django admin.

## Start the project

```powershell
cd "C:\Users\sande\OneDrive\Desktop\python\doctor_appointment"
python manage.py migrate
python manage.py runserver 8001
```

Open http://127.0.0.1:8001/.

To manage doctors and appointments through Django admin:

```powershell
python manage.py createsuperuser
```

Then open http://127.0.0.1:8001/admin/.

New patients and doctors can register at http://127.0.0.1:8001/signup/. After login, users are automatically sent to the dashboard for their role. Admin dashboard access is reserved for superusers created with `createsuperuser`.
# Medislot
