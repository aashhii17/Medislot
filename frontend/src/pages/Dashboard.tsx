import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Calendar, Clock, CheckCircle, DollarSign, Heart, 
  Activity, Star, User, Plus, Trash2, Video, FileText, PlusCircle,
  FileCheck, ShieldAlert, Thermometer, UserCheck, Download
} from 'lucide-react';

interface Appointment {
  id: number;
  doctor: number;
  doctor_detail: {
    id: number;
    name: string;
    specialty: string;
    consultation_fee: string;
  };
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: 'pending' | 'booked' | 'completed' | 'cancelled';
  video_link: string;
  is_emergency: boolean;
  payment_status: 'pending' | 'paid';
  prescription?: {
    id: number;
    medicine: string;
    dosage: string;
  };
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Patient Dashboard state
  const [activeTab, setActiveTab] = useState<'appointments' | 'profile' | 'reports' | 'prescriptions'>('appointments');
  const [patientProfile, setPatientProfile] = useState<any>({
    gender: '',
    date_of_birth: '',
    blood_group: '',
    city: '',
    address: '',
    medical_history: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    has_insurance: false,
    insurance_provider: '',
    insurance_policy_number: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Medical Reports
  const [reports, setReports] = useState<any[]>([]);
  const [reportTitle, setReportTitle] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [reportsLoading, setReportsLoading] = useState(false);

  // Review / Rating Modal
  const [reviewingApp, setReviewingApp] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Doctor Dashboard state
  const [doctorFilter, setDoctorFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayLoading, setHolidayLoading] = useState(false);

  // Doctor Prescriptions Modal
  const [prescribingApp, setPrescribingApp] = useState<Appointment | null>(null);
  const [prescMedicine, setPrescMedicine] = useState('');
  const [prescDosage, setPrescDosage] = useState('');
  const [prescSubmitting, setPrescSubmitting] = useState(false);

  // Admin addition models
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [newHospitalName, setNewHospitalName] = useState('');
  const [newHospitalCity, setNewHospitalCity] = useState('');

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch appointments
      const appRes = await api.get('/api/appointments/');
      setAppointments(Array.isArray(appRes.data) ? appRes.data : (appRes.data.results || []));

      // 2. Fetch analytics
      const analyticsRes = await api.get('/api/analytics/dashboard/');
      setAnalytics(analyticsRes.data);

      // 3. Conditional fetches based on role
      if (user?.role === 'patient') {
        const profileRes = await api.get('/api/auth/patient/profile/');
        if (profileRes.data) {
          setPatientProfile(profileRes.data);
        }
        const reportsRes = await api.get('/api/reports/');
        setReports(Array.isArray(reportsRes.data) ? reportsRes.data : (reportsRes.data.results || []));
      } else if (user?.role === 'doctor') {
        const holidayRes = await api.get('/api/holidays/');
        setHolidays(Array.isArray(holidayRes.data) ? holidayRes.data : (holidayRes.data.results || []));
      } else if (user?.is_superuser) {
        const hospRes = await api.get('/api/hospitals/');
        setHospitalsList(Array.isArray(hospRes.data) ? hospRes.data : (hospRes.data.results || []));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.post(`/api/appointments/${id}/cancel/`);
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'cancelled' } : app))
      );
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.post(`/api/appointments/${id}/complete/`);
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'completed' } : app))
      );
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to complete appointment.');
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await api.post(`/api/appointments/${id}/accept/`);
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'booked' } : app))
      );
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to accept appointment.');
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      const res = await api.put('/api/auth/patient/profile/', patientProfile);
      updateUser(res.data); // Update user auth context
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save patient profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Report Upload
  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle) return;
    setReportsLoading(true);
    try {
      const res = await api.post('/api/reports/', {
        title: reportTitle,
        file_url: reportUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      });
      setReports((prev) => [res.data, ...prev]);
      setReportTitle('');
      setReportUrl('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to add medical report.');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/api/reports/${id}/`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete report.');
    }
  };

  // Doctor Holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate) return;
    setHolidayLoading(true);
    try {
      const res = await api.post('/api/holidays/', { date: holidayDate });
      setHolidays((prev) => [res.data, ...prev]);
      setHolidayDate('');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.non_field_errors?.[0] || 'Failed to block holiday date.');
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!window.confirm('Remove holiday block?')) return;
    try {
      await api.delete(`/api/holidays/${id}/`);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete holiday block.');
    }
  };

  // Prescription Save
  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescribingApp || !prescMedicine || !prescDosage) return;
    setPrescSubmitting(true);
    try {
      await api.post(`/api/appointments/${prescribingApp.id}/prescription/`, {
        medicine: prescMedicine,
        dosage: prescDosage
      });
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === prescribingApp.id
            ? { ...app, prescription: { id: Date.now(), medicine: prescMedicine, dosage: prescDosage } }
            : app
        )
      );
      setPrescribingApp(null);
      setPrescMedicine('');
      setPrescDosage('');
      alert('Prescription logged successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to save prescription.');
    } finally {
      setPrescSubmitting(false);
    }
  };

  // Review Submit
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingApp) return;
    setReviewSubmitting(true);
    try {
      await api.post(`/api/appointments/${reviewingApp.id}/review/`, {
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewingApp(null);
      setReviewRating(5);
      setReviewComment('');
      alert('Thank you! Review submitted successfully.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Add Hospital (Admin)
  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospitalName || !newHospitalCity) return;
    try {
      const res = await api.post('/api/hospitals/', {
        name: newHospitalName,
        city: newHospitalCity
      });
      setHospitalsList((prev) => [...prev, res.data]);
      setNewHospitalName('');
      setNewHospitalCity('');
      fetchDashboardData();
      alert('Hospital registered successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to register hospital.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100 dark:bg-slate-900">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.is_superuser;

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Dynamic metrics computations
  const upcomingPatientAppointments = appointments.filter(a => a.status === 'booked' && a.appointment_date >= todayStr);
  const pastPatientAppointments = appointments.filter(a => a.status === 'completed' || (a.status === 'booked' && a.appointment_date < todayStr));

  const filteredAppointments = appointments.filter((app) => {
    if (!isDoctor) return true;
    if (doctorFilter === 'today') return app.appointment_date === todayStr;
    if (doctorFilter === 'upcoming') return app.appointment_date > todayStr;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1613] text-stone-850 dark:text-stone-100 py-10 px-4 lg:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-tr from-stone-900 via-[#3C2719] to-stone-950 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl border border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_40%)]"></div>
          <div className="relative z-10 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-450/10 px-3 py-1 rounded-full border border-amber-400/20">
              {isAdmin ? 'System Administrator' : isDoctor ? 'Doctor Workspace' : 'Patient Workspace'}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Hello, {user?.first_name || user?.username}!
            </h1>
            <p className="text-sm text-stone-300 max-w-xl">
              {isAdmin ? 'Manage global partner locations, specialists, and analyze clinical health system metrics.' : 
               isDoctor ? 'Schedule consultations, evaluate holiday dates, write digital prescriptions and track total earnings.' : 
               'Schedule video teleconsultations, fill medical history forms, log clinical reports and read prescriptions.'}
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            {!isDoctor && !isAdmin && (
              <a 
                href="/" 
                className="btn btn-primary bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-6 border-none rounded-xl shadow-lg shadow-amber-500/10"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Book Consultation
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-error shadow-sm rounded-xl py-3 flex gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* ────────────── METRICS LAYER ────────────── */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {isAdmin ? (
              <>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Gross revenue</p>
                    <h3 className="text-2xl font-black text-amber-500 mt-1">${analytics.total_revenue}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><DollarSign className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Active specialists</p>
                    <h3 className="text-2xl font-black text-amber-600 mt-1">{analytics.total_doctors}</h3>
                  </div>
                  <div className="p-3 bg-amber-600/10 rounded-xl text-amber-600"><UserCheck className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Registered patients</p>
                    <h3 className="text-2xl font-black text-orange-500 mt-1">{analytics.total_patients}</h3>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500"><User className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total partner clinics</p>
                    <h3 className="text-2xl font-black text-orange-600 mt-1">{hospitalsList.length}</h3>
                  </div>
                  <div className="p-3 bg-orange-600/10 rounded-xl text-orange-600"><Activity className="h-6 w-6" /></div>
                </div>
              </>
            ) : isDoctor ? (
              <>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total earnings</p>
                    <h3 className="text-2xl font-black text-amber-500 mt-1">${analytics.total_earnings}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><DollarSign className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Completed consults</p>
                    <h3 className="text-2xl font-black text-amber-600 mt-1">{analytics.completed_count}</h3>
                  </div>
                  <div className="p-3 bg-amber-600/10 rounded-xl text-amber-600"><CheckCircle className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Today itinerary</p>
                    <h3 className="text-2xl font-black text-orange-500 mt-1">{analytics.today_count}</h3>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500"><Calendar className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Clinic rating</p>
                    <h3 className="text-2xl font-black text-amber-500 mt-1">{analytics.average_rating}★</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><Star className="h-6 w-6 fill-amber-500" /></div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Gross Spent</p>
                    <h3 className="text-2xl font-black text-amber-500 mt-1">${analytics.total_spent}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><DollarSign className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total Bookings</p>
                    <h3 className="text-2xl font-black text-amber-600 mt-1">{analytics.appointments_count}</h3>
                  </div>
                  <div className="p-3 bg-amber-600/10 rounded-xl text-amber-600"><Calendar className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Completed visits</p>
                    <h3 className="text-2xl font-black text-orange-500 mt-1">{analytics.completed_count}</h3>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500"><CheckCircle className="h-6 w-6" /></div>
                </div>
                <div className="bg-white dark:bg-[#25201C] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Lab Records</p>
                    <h3 className="text-2xl font-black text-orange-600 mt-1">{analytics.reports_count}</h3>
                  </div>
                  <div className="p-3 bg-orange-600/10 rounded-xl text-orange-600"><FileText className="h-6 w-6" /></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ────────────── WORKSPACE PANELS ────────────── */}
        
        {/* 1. ADMIN WORKSPACE */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Doctors */}
            <div className="lg:col-span-2 bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xl text-stone-900 dark:text-white">Practitioners Leadership Board</h3>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="text-xs uppercase text-stone-400 border-b border-stone-100 dark:border-stone-800">
                      <th>Doctor Name</th>
                      <th>Specialty</th>
                      <th>Clinic Rating</th>
                      <th>Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.top_doctors?.map((doc: any, i: number) => (
                      <tr key={i} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 border-b border-stone-100 dark:border-stone-800/60">
                        <td className="font-bold text-sm">{doc.name}</td>
                        <td className="text-xs text-stone-500">{doc.specialty}</td>
                        <td><span className="badge badge-warning badge-sm font-bold text-amber-850 bg-amber-100 border-none">{doc.rating}★</span></td>
                        <td className="font-semibold text-sm">{doc.appointments} consults</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Add Clinic */}
            <div className="lg:col-span-1 bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xl text-stone-900 dark:text-white">Register Partner Clinic</h3>
              <form onSubmit={handleAddHospital} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-400 font-bold uppercase">Clinic Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Apollo Hospital" 
                    className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-850 h-11 text-sm focus:outline-none"
                    value={newHospitalName}
                    onChange={(e) => setNewHospitalName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-400 font-bold uppercase">Location City</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Indore" 
                    className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-850 h-11 text-sm focus:outline-none"
                    value={newHospitalCity}
                    onChange={(e) => setNewHospitalCity(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-full bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white font-bold h-11 rounded-xl shadow-lg"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  <span>Register Clinic</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2. DOCTOR WORKSPACE */}
        {isDoctor && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Holiday Blocking & availability */}
            <div className="lg:col-span-1 bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-6 h-fit">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                <h3 className="font-extrabold text-lg text-stone-900 dark:text-white">Block Schedule Holiday</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Prevent patient slot bookings on selected holiday dates</p>
              </div>

              <form onSubmit={handleAddHoliday} className="space-y-3">
                <input 
                  type="date" 
                  required 
                  min={todayStr}
                  className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-850 h-11 text-sm text-stone-800 dark:text-white focus:outline-none"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={holidayLoading}
                  className="btn btn-primary w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white font-bold"
                >
                  Block Date
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs text-stone-400 uppercase font-bold tracking-wider">Currently Blocked Dates</h4>
                {holidays.length === 0 ? (
                  <p className="text-xs text-stone-400">No blocked holiday dates registered.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {holidays.map((h) => (
                      <div key={h.id} className="flex justify-between items-center bg-stone-50 dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200/50 dark:border-stone-800 hover:border-red-500/10">
                        <span className="text-xs font-bold">{h.date}</span>
                        <button 
                          onClick={() => handleDeleteHoliday(h.id)} 
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Doctor assigned itineraries */}
            <div className="lg:col-span-3 bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-xl text-stone-900 dark:text-white">Assigned Patient Consultations</h3>
                  <p className="text-xs text-stone-450">Manage schedules, write digital prescriptions and mark slot completion</p>
                </div>
                <div className="flex bg-[#FDFBF7] dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
                  {['all', 'today', 'upcoming'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setDoctorFilter(filter as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        doctorFilter === filter ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="h-12 w-12 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-400">No consultations scheduled.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="text-xs uppercase text-stone-400 border-b border-stone-100 dark:border-stone-800">
                        <th>Patient Details</th>
                        <th>Schedule slot</th>
                        <th>Emergency</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((app) => (
                        <tr key={app.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/20 border-b border-stone-100 dark:border-stone-800/60">
                          <td>
                            <div>
                              <p className="font-bold text-sm text-stone-900 dark:text-white">{app.patient_name}</p>
                              <p className="text-xs text-stone-500">{app.patient_email} • {app.patient_phone}</p>
                            </div>
                          </td>
                          <td>
                            <div className="text-xs font-semibold">
                              <p className="flex items-center gap-1 text-stone-700 dark:text-stone-350"><Calendar className="h-3.5 w-3.5 text-amber-500" /> {app.appointment_date}</p>
                              <p className="flex items-center gap-1 mt-1 text-stone-450"><Clock className="h-3 w-3" /> {app.appointment_time.substring(0, 5)}</p>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-sm font-bold px-2 py-2 border-none ${app.is_emergency ? 'bg-red-500/10 text-red-600' : 'bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-400'}`}>
                              {app.is_emergency ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-sm font-bold capitalize px-2.5 py-2 border-none ${
                              app.status === 'booked' ? 'bg-amber-500/10 text-amber-600' : 
                              app.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex gap-2 justify-end">
                              {app.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleAccept(app.id)} 
                                    className="btn btn-xs btn-primary bg-amber-500 text-white font-bold border-none rounded-lg px-3 py-1 h-auto"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handleCancel(app.id)} 
                                    className="btn btn-xs btn-outline border-stone-300 dark:border-stone-700 text-stone-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg px-3 py-1 h-auto"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {app.status === 'booked' && (
                                <>
                                  {app.video_link && (
                                    <a 
                                      href={app.video_link} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="btn btn-xs bg-cyan-500 hover:bg-cyan-600 border-none text-white rounded-lg px-2.5 py-1 h-auto flex items-center gap-1"
                                    >
                                      <Video className="h-3 w-3" /> TeleConsult
                                    </a>
                                  )}
                                  <button 
                                    onClick={() => handleComplete(app.id)} 
                                    className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-lg px-3 py-1 h-auto font-bold"
                                  >
                                    Complete
                                  </button>
                                  <button 
                                    onClick={() => handleCancel(app.id)} 
                                    className="btn btn-xs btn-outline border-stone-200 dark:border-stone-800 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg px-3 py-1 h-auto"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {app.status === 'completed' && !app.prescription && (
                                <button 
                                  onClick={() => setPrescribingApp(app)} 
                                  className="btn btn-xs bg-amber-500 text-white font-bold border-none rounded-lg px-3 py-1 h-auto"
                                >
                                  Prescribe
                                </button>
                              )}
                              {app.prescription && (
                                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Rx Sent</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PATIENT WORKSPACE */}
        {!isDoctor && !isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1 bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-850 rounded-3xl p-5 shadow-sm space-y-2 h-fit">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest px-3 block mb-2">My Portal</span>
              
              <button 
                onClick={() => setActiveTab('appointments')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === 'appointments' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/10' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/60'
                }`}
              >
                <Calendar className="h-4.5 w-4.5 shrink-0" />
                <span>My Consultations</span>
                {upcomingPatientAppointments.length > 0 && (
                  <span className="ml-auto badge badge-xs bg-amber-100 text-amber-850 border-none font-bold px-1.5 py-1.5">{upcomingPatientAppointments.length}</span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === 'profile' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/10' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/60'
                }`}
              >
                <User className="h-4.5 w-4.5 shrink-0" />
                <span>Clinical Profile</span>
              </button>

              <button 
                onClick={() => setActiveTab('reports')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === 'reports' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/10' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/60'
                }`}
              >
                <FileText className="h-4.5 w-4.5 shrink-0" />
                <span>Lab Reports</span>
                {reports.length > 0 && (
                  <span className="ml-auto badge badge-xs bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400 border-none font-bold px-1.5 py-1.5">{reports.length}</span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('prescriptions')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === 'prescriptions' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/10' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/60'
                }`}
              >
                <Heart className="h-4.5 w-4.5 shrink-0" />
                <span>Prescriptions Log</span>
              </button>
            </div>

            {/* Right Main Content */}
            <div className="lg:col-span-3 bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-850 rounded-3xl p-6 lg:p-8 shadow-sm">
              
              {/* TAB CONTENT: APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Upcoming Consultations */}
                  <div className="space-y-4">
                    <div className="border-b border-stone-100 dark:border-stone-800 pb-3.5">
                      <h3 className="font-extrabold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-amber-500" /> Upcoming Consultations
                      </h3>
                      <p className="text-xs text-stone-450 mt-0.5">Manage your upcoming physical or teleconsultation appointments</p>
                    </div>

                    {upcomingPatientAppointments.length === 0 ? (
                      <div className="text-center py-10 bg-[#FDFBF7] dark:bg-stone-900/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                        <Calendar className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-stone-400">No upcoming consultations booked.</p>
                        <a href="/" className="text-xs text-amber-600 font-bold hover:underline mt-1 inline-block">Book a slot now &rarr;</a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingPatientAppointments.map((app) => (
                          <div key={app.id} className="bg-stone-50 dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800/80 hover:border-amber-500/10 flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-stone-900 dark:text-white text-md">Dr. {app.doctor_detail.name}</h4>
                                  <p className="text-xs text-stone-500 capitalize">{app.doctor_detail.specialty}</p>
                                </div>
                                <span className="badge badge-success badge-sm text-white border-none font-semibold capitalize">{app.status}</span>
                              </div>

                              <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 font-semibold bg-white dark:bg-[#25201C] p-3 rounded-xl border border-stone-200/40 dark:border-stone-800">
                                <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-amber-500" /> {app.appointment_date}</p>
                                <p className="flex items-center gap-1.5 mt-0.5"><Clock className="h-4 w-4 text-amber-500" /> {app.appointment_time.substring(0, 5)}</p>
                              </div>

                              {app.video_link && (
                                <a 
                                  href={app.video_link} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-bold hover:underline"
                                >
                                  <Video className="h-4 w-4 text-amber-500" /> Join TeleConsult Video Meeting
                                </a>
                              )}
                            </div>

                            <div className="pt-2 border-t border-stone-200/50 dark:border-stone-800 flex justify-between items-center">
                              <span className="text-[10px] font-bold text-stone-400">ID: #MS{app.id.toString().padStart(5, '0')}</span>
                              <button 
                                onClick={() => handleCancel(app.id)} 
                                className="btn btn-ghost hover:bg-red-50 text-red-500 hover:text-red-700 btn-xs text-[10px] font-bold rounded-lg"
                              >
                                Cancel Appointment
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Consultations */}
                  <div className="space-y-4 pt-4">
                    <div className="border-b border-stone-100 dark:border-stone-800 pb-3.5">
                      <h3 className="font-extrabold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-emerald-500" /> Consultation History
                      </h3>
                      <p className="text-xs text-stone-450 mt-0.5">Read digital prescriptions or review specialists for completed sessions</p>
                    </div>

                    {pastPatientAppointments.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-6 bg-stone-50 dark:bg-stone-900/40 rounded-xl">No historical records found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table w-full">
                          <thead>
                            <tr className="text-xs uppercase text-stone-400 border-b border-stone-100 dark:border-stone-800">
                              <th>Doctor</th>
                              <th>Consult Date</th>
                              <th>Billing</th>
                              <th>Plan</th>
                              <th className="text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pastPatientAppointments.map((app) => (
                              <tr key={app.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/20 border-b border-stone-100 dark:border-stone-800/60">
                                <td className="font-bold text-sm text-stone-900 dark:text-white">Dr. {app.doctor_detail.name}</td>
                                <td className="text-xs text-stone-500">{app.appointment_date}</td>
                                <td><span className="badge badge-success badge-sm text-white font-bold capitalize border-none">{app.payment_status}</span></td>
                                <td>
                                  {app.prescription ? (
                                    <span className="text-xs text-emerald-500 font-bold">Rx Active</span>
                                  ) : (
                                    <span className="text-xs text-stone-400">-</span>
                                  )}
                                </td>
                                <td className="text-right">
                                  {app.status === 'completed' && (
                                    <button 
                                      onClick={() => setReviewingApp(app)} 
                                      className="btn btn-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-none font-bold rounded-lg px-2.5"
                                    >
                                      Review
                                    </button>
                                  )}
                                  {app.status === 'cancelled' && (
                                    <span className="text-xs text-red-500 font-bold capitalize">Cancelled</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-3.5">
                    <h3 className="font-extrabold text-xl text-stone-900 dark:text-white">Personal & Medical Profile</h3>
                    <p className="text-xs text-stone-450 mt-0.5">Clinical records are securely archived and visible only to assigned specialists</p>
                  </div>

                  {profileSuccess && (
                    <div className="alert alert-success shadow-sm rounded-xl py-3 flex gap-2">
                      <CheckCircle className="h-5 w-5 text-white" />
                      <span className="text-white text-sm font-bold">Clinical medical history saved successfully!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Block 1: Bio */}
                    <div className="bg-stone-50 dark:bg-stone-900/60 p-5 rounded-2xl border border-stone-200/50 dark:border-stone-850 space-y-4">
                      <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><User className="h-4 w-4" /> Personal Health Registry</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Biological Gender</label>
                          <select 
                            className="select select-bordered select-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.gender || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, gender: e.target.value})}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Date of Birth</label>
                          <input 
                            type="date" 
                            className="input input-bordered input-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.date_of_birth || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, date_of_birth: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Blood Group</label>
                          <select 
                            className="select select-bordered select-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.blood_group || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, blood_group: e.target.value})}
                          >
                            <option value="">Select blood group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">City Location</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Indore"
                            className="input input-bordered input-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.city || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, city: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Residential Address</label>
                          <input 
                            type="text" 
                            placeholder="Building block, street details"
                            className="input input-bordered input-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.address || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, address: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Medical Details */}
                    <div className="bg-stone-50 dark:bg-stone-900/60 p-5 rounded-2xl border border-stone-200/50 dark:border-stone-850 space-y-4">
                      <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><Thermometer className="h-4 w-4" /> Medical History & Exclusions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Chronic Illnesses / Diseases</label>
                          <textarea 
                            rows={2}
                            placeholder="e.g. Asthma, Diabetes, Thyroid"
                            className="textarea textarea-bordered w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.medical_history || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, medical_history: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Allergies</label>
                          <textarea 
                            rows={2}
                            placeholder="e.g. Peanuts, Penicillin, Dust"
                            className="textarea textarea-bordered w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.allergies || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, allergies: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Block 3: Insurance & Emergency */}
                    <div className="bg-stone-50 dark:bg-stone-900/60 p-5 rounded-2xl border border-stone-200/50 dark:border-stone-850 space-y-4">
                      <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> Emergency Contact & Insurance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Emergency Contact Name</label>
                          <input 
                            type="text" 
                            placeholder="Family member / relation name"
                            className="input input-bordered input-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.emergency_contact_name || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, emergency_contact_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Emergency Contact Phone</label>
                          <input 
                            type="tel" 
                            placeholder="Mobile or landline number"
                            className="input input-bordered input-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                            value={patientProfile.emergency_contact_phone || ''}
                            onChange={(e) => setPatientProfile({...patientProfile, emergency_contact_phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          <input 
                            type="checkbox" 
                            checked={patientProfile.has_insurance || false} 
                            onChange={(e) => setPatientProfile({...patientProfile, has_insurance: e.target.checked})} 
                            className="checkbox checkbox-primary checkbox-sm border-stone-300"
                          />
                          <span>Yes, I have Active Health Insurance Policy</span>
                        </label>

                        {patientProfile.has_insurance && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-fadeIn">
                            <div className="space-y-1.5">
                              <label className="text-xs text-stone-400 font-bold">Insurance Provider</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Star Health Insurance"
                                className="input input-bordered input-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                                value={patientProfile.insurance_provider || ''}
                                onChange={(e) => setPatientProfile({...patientProfile, insurance_provider: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-stone-400 font-bold">Policy/Certificate ID</label>
                              <input 
                                type="text" 
                                placeholder="e.g. STAR-96231"
                                className="input input-bordered input-sm w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                                value={patientProfile.insurance_policy_number || ''}
                                onChange={(e) => setPatientProfile({...patientProfile, insurance_policy_number: e.target.value})}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={profileSaving}
                      className="btn btn-primary w-full bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white font-bold h-12 rounded-xl shadow-lg hover:opacity-95"
                    >
                      {profileSaving ? 'Saving profile settings...' : 'Update Health Registry Profile'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB CONTENT: REPORTS */}
              {activeTab === 'reports' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-3.5">
                    <h3 className="font-extrabold text-xl text-stone-900 dark:text-white">Diagnostic Lab Reports</h3>
                    <p className="text-xs text-stone-450 mt-0.5">Log clinical summaries or diagnostic files for consulting specialists</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form upload */}
                    <div className="lg:col-span-1 bg-stone-50 dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/50 dark:border-stone-850 h-fit space-y-4">
                      <h4 className="font-bold text-sm text-stone-900 dark:text-white">Add Lab File</h4>
                      <form onSubmit={handleAddReport} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Report Title</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Complete Blood Count" 
                            className="input input-bordered w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 h-10 text-sm focus:outline-none"
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-stone-400 font-bold uppercase">Document URL</label>
                          <input 
                            type="url" 
                            placeholder="e.g. https://domain.com/report.pdf" 
                            className="input input-bordered w-full bg-white dark:bg-[#25201C] border-stone-200 dark:border-stone-800 h-10 text-sm focus:outline-none"
                            value={reportUrl}
                            onChange={(e) => setReportUrl(e.target.value)}
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={reportsLoading}
                          className="btn btn-primary w-full btn-sm h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white font-bold"
                        >
                          Upload Report
                        </button>
                      </form>
                    </div>

                    {/* Listing */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="font-bold text-sm text-stone-900 dark:text-white">Uploaded Records History</h4>
                      {reports.length === 0 ? (
                        <p className="text-xs text-stone-400 py-6 text-center bg-stone-50 dark:bg-stone-900/40 rounded-xl">No files archived.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {reports.map((rep) => (
                            <div key={rep.id} className="bg-stone-50 dark:bg-stone-900 p-4 rounded-xl border border-stone-250 dark:border-stone-800 hover:border-amber-500/10 flex justify-between items-start transition-all">
                              <div className="space-y-1 max-w-[80%]">
                                <h5 className="font-bold text-xs text-stone-850 dark:text-white truncate">{rep.title}</h5>
                                <p className="text-[9px] text-stone-400">Date: {new Date(rep.created_at).toLocaleDateString()}</p>
                                <a 
                                  href={rep.file_url || rep.file} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:underline font-bold mt-1"
                                >
                                  <Download className="h-3 w-3" /> View/Download File
                                </a>
                              </div>
                              <button 
                                onClick={() => handleDeleteReport(rep.id)} 
                                className="text-red-400 hover:text-red-600 mt-0.5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: PRESCRIPTIONS */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-3.5">
                    <h3 className="font-extrabold text-xl text-stone-900 dark:text-white">Active Digital Prescriptions</h3>
                    <p className="text-xs text-stone-450 mt-0.5">Medical plan directives and treatment structures written by consulting physicians</p>
                  </div>

                  {appointments.filter(a => a.prescription).length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-10 bg-stone-50 dark:bg-stone-900/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">No active prescriptions logged.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {appointments.filter(a => a.prescription).map((app) => (
                        <div key={app.id} className="bg-stone-50 dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800 flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start pb-2.5 border-b border-stone-200/50 dark:border-stone-800">
                              <div>
                                <h4 className="font-bold text-sm text-stone-900 dark:text-white">Dr. {app.doctor_detail.name}</h4>
                                <p className="text-[10px] text-stone-500 capitalize">{app.doctor_detail.specialty}</p>
                              </div>
                              <span className="text-[10px] text-stone-400 font-bold">{app.appointment_date}</span>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Medicines</span>
                                <pre className="text-xs font-semibold whitespace-pre-wrap font-sans mt-0.5 text-stone-700 dark:text-stone-300">
                                  {app.prescription?.medicine}
                                </pre>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Dosage Directions</span>
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-500 mt-0.5">
                                  {app.prescription?.dosage}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ────────────── REVIEW MODALS & FORMS ────────────── */}
        
        {/* Patient: Write Review Modal */}
        {reviewingApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#25201C] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-200 dark:border-stone-800 animate-scaleUp">
              <div className="flex justify-between items-center pb-2.5 border-b border-stone-100 dark:border-stone-800">
                <h3 className="font-extrabold text-lg">Submit Specialist Review</h3>
                <button onClick={() => setReviewingApp(null)} className="text-stone-400 hover:text-stone-600 font-extrabold text-lg">×</button>
              </div>

              <p className="text-xs text-stone-450">Share your consultation experience with Dr. {reviewingApp.doctor_detail.name}</p>

              <form onSubmit={handleAddReview} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-450 uppercase">Session Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-amber-500 focus:outline-none"
                      >
                        <Star className={`h-8 w-8 ${reviewRating >= star ? 'fill-amber-500 text-amber-500' : 'text-stone-300 dark:text-stone-700'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-450 uppercase">Feedback Comment</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe symptoms diagnostics, clinic experience, doctor behavior..."
                    className="textarea textarea-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-250 dark:border-stone-800 focus:outline-none text-sm"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={reviewSubmitting}
                  className="btn btn-warning w-full text-stone-800 font-bold bg-amber-500 border-none rounded-xl h-11"
                >
                  {reviewSubmitting ? 'Logging Feedback...' : 'Submit Rating & Comment'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Doctor: Write Prescription Modal */}
        {prescribingApp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#25201C] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-200 dark:border-stone-800 animate-scaleUp">
              <div className="flex justify-between items-center pb-2.5 border-b border-stone-100 dark:border-stone-800">
                <h3 className="font-extrabold text-lg">Write Digital Prescription</h3>
                <button onClick={() => setPrescribingApp(null)} className="text-stone-400 hover:text-stone-600 font-extrabold text-lg">×</button>
              </div>

              <p className="text-xs text-stone-400">Patient: {prescribingApp.patient_name} • Date: {prescribingApp.appointment_date}</p>

              <form onSubmit={handleAddPrescription} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase">Prescribed Medicines</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Paracetamol 500mg (twice daily)&#10;Amoxicillin 250mg"
                    className="textarea textarea-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:outline-none text-sm"
                    value={prescMedicine}
                    onChange={(e) => setPrescMedicine(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase">Dosage Schedule</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1-0-1 (Morning & Night)"
                    className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 h-11 text-sm focus:outline-none"
                    value={prescDosage}
                    onChange={(e) => setPrescDosage(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={prescSubmitting}
                  className="btn btn-primary w-full bg-gradient-to-r from-amber-500 to-orange-500 border-none text-white font-bold rounded-xl h-11 shadow-lg"
                >
                  {prescSubmitting ? 'Logging Prescription...' : 'Log & Send Prescription'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
