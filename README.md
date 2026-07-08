# MediSlot

MediSlot is a doctor appointment platform with a Django web UI for booking, plus REST APIs for users, hospitals, and doctors.

## Project structure

```
Medislot/
├── appointments/   # Booking UI, dashboards, and core appointment models
├── users/          # Auth API (health check, current user) and patient profiles
├── hospitals/      # Hospital catalog API
├── doctors/        # Doctor catalog API
├── clinic_site/    # Django settings and URL routing
├── templates/      # HTML templates
├── static/         # CSS and static assets
└── manage.py
```

## Run locally

```powershell
cd "C:\Users\sande\OneDrive\Desktop\Medislot"
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

Open http://127.0.0.1:8000/

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/auth/health/` | API health check |
| `GET /api/auth/me/` | Current authenticated user |
| `GET /api/hospitals/` | List hospitals |
| `GET /api/doctors/` | List doctors |

## Features

- Patient and doctor signup/login with role-based dashboards
- Doctor search and appointment booking
- Duplicate-slot protection and cancellation
- Admin dashboard for superusers
- REST API modules for users, hospitals, and doctors
