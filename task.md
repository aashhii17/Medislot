# Task List: MediSlot Pro Upgrade

## Database Models & Migrations
- [ ] Update `doctors/models.py` (languages, rating, online_consultation, insurance_accepted)
- [ ] Update `appointments/models.py` (TimeSlot, Prescription, MedicalReport, Review, DoctorHoliday models; Appointment field additions)
- [ ] Create and apply migrations

## Seeding Script
- [ ] Create `appointments/management/commands/seed_db.py` to populate realistic data
- [ ] Execute `python manage.py seed_db`

## Backend API Endpoints
- [ ] Add OTP send/verify views in `users/views.py` and map in `users/urls.py`
- [ ] Add Patient Profile GET/PUT endpoints in `users/views.py`
- [ ] Update `doctors/views.py` to support advanced query filtering
- [ ] Add `TimeSlot` query list and dynamic available slot checker
- [ ] Add endpoints for MedicalReports, Prescriptions, DoctorHolidays, and Reviews in `appointments/api_views.py`
- [ ] Add Analytics Dashboard endpoints

## Frontend Upgrades
- [ ] Implement OTP Login option in `Login.tsx`
- [ ] Implement Patient Profile edit & Reports upload in `Dashboard.tsx` / a profile tab
- [ ] Expand Doctor Search filters (Gender, Fee, Experience, Rating, City, etc.) on `Home.tsx`
- [ ] Implement interactive slot bookings in `DoctorDetail.tsx` (using dynamic fetched slots)
- [ ] Add Doctor management dashboard (Write prescription, Accept/Reject appointments, Earnings, Block holidays)
- [ ] Add Hospital/Admin Analytics Dashboard
