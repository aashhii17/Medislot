import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Award, DollarSign, Stethoscope, Clock, AlertCircle, ChevronRight, Check } from 'lucide-react';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  qualification: string;
  experience_years: number;
  consultation_fee: string;
  bio: string;
  is_available: boolean;
}

const DoctorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form fields
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appDate, setAppDate] = useState('');
  const [appTime, setAppTime] = useState('');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Dynamic Live Slots
  const [slots, setSlots] = useState<{ time: string; is_available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/api/doctors/${id}/`);
        setDoctor(res.data);
        
        // Auto-fill patient details from logged-in user if available
        if (user) {
          setPatientName(`${user.first_name} ${user.last_name}`.trim() || user.username);
          setPatientEmail(user.email);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch doctor details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id, user]);

  useEffect(() => {
    if (!appDate) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await api.get(`/api/doctors/${id}/slots/`, {
          params: { date: appDate }
        });
        setSlots(res.data.slots || []);
        setAppTime(''); // reset slot selection when date changes
      } catch (err) {
        console.error(err);
        setError('Failed to fetch available time slots.');
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [appDate, id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in or register a patient account to book appointments.');
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      alert('Only patient accounts are authorized to book appointments.');
      return;
    }

    if (!appDate || !appTime || !reason || !patientName || !patientEmail || !patientPhone) {
      alert('Please fill in all details.');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      await api.post('/api/appointments/', {
        doctor: doctor?.id,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        appointment_date: appDate,
        appointment_time: appTime + ':00', // API format hh:mm:ss
        reason,
      });
      
      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.non_field_errors?.[0] || 
        'Failed to book appointment. The slot might already be booked.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 alert alert-error rounded-2xl shadow-md">
        <span>{error}</span>
      </div>
    );
  }


  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Allow booking from tomorrow
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1613] text-stone-850 dark:text-stone-100 py-12 px-4 lg:px-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Doctor Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-850 rounded-[36px] p-6 shadow-md space-y-6">
            <div className="text-center space-y-3">
              <div className="avatar placeholder">
                <div className="bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-full w-24 h-24 flex items-center justify-center font-extrabold text-2xl uppercase border-4 border-stone-100 dark:border-stone-800">
                  {doctor?.name.substring(0, 2)}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-stone-900 dark:text-white">Dr. {doctor?.name}</h2>
                <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 capitalize mt-1.5 border border-amber-500/10">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {doctor?.specialty}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-stone-600 dark:text-stone-400 pt-4 border-t border-stone-150 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="font-bold text-stone-850 dark:text-white">{doctor?.qualification}</p>
                  <p className="text-xs text-stone-400">Education & Qualifications</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="font-bold text-stone-850 dark:text-white">{doctor?.experience_years} Years</p>
                  <p className="text-xs text-stone-400">Professional Experience</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-stone-850 dark:text-white">${doctor?.consultation_fee}</p>
                  <p className="text-xs text-stone-400">Consultation Rate</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-150 dark:border-stone-800 space-y-2">
              <h4 className="font-bold text-stone-900 dark:text-white text-sm">Professional Biography</h4>
              <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                {doctor?.bio || "Dr. " + doctor?.name + " is a highly accomplished specialist dedicated to providing client-centric medical diagnostics and recovery plans."}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form Card */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-850 rounded-[36px] p-6 lg:p-8 shadow-md h-full">
            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-full border border-emerald-500/20 animate-bounce">
                  <Check className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-black text-stone-900 dark:text-white">Appointment Reserved!</h3>
                <p className="text-sm text-stone-500 max-w-sm">
                  Your slot has been secured. Directing you to your schedule hub...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white">Book Appointment Slot</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Please provide patient details and pick a convenient scheduling slot</p>
                </div>

                {error && (
                  <div className="alert alert-error bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm shadow-sm rounded-xl p-3 flex gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleBook} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Patient Full Name</label>
                      <input
                        type="text"
                        required
                        className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                        placeholder="John Doe"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        required
                        className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                        placeholder="patient@example.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Phone Number</label>
                      <input
                        type="tel"
                        required
                        className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                        placeholder="e.g. +1234567890"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Consultation Date</label>
                      <input
                        type="date"
                        required
                        min={minDateStr}
                        className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                        value={appDate}
                        onChange={(e) => setAppDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Select Consultation Time Slot</label>
                    {!appDate ? (
                      <p className="text-sm text-amber-600/80 font-medium">Please select a consultation date to load live time slots.</p>
                    ) : slotsLoading ? (
                      <div className="flex gap-2 items-center text-xs text-stone-400">
                        <span className="loading loading-spinner loading-xs text-amber-500"></span>
                        <span>Loading live slots...</span>
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-red-500 font-medium">No slots available on this date. Doctor may be on holiday.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.is_available}
                            className={`py-2 px-1 text-center font-bold rounded-xl text-xs transition-all border ${
                              appTime === slot.time
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-md shadow-amber-500/25 scale-105'
                                : slot.is_available
                                ? 'bg-stone-100 dark:bg-stone-900 text-stone-850 dark:text-stone-300 border-stone-200 dark:border-stone-800/80 hover:border-amber-500/45'
                                : 'bg-stone-200 dark:bg-stone-950 text-stone-400 dark:text-stone-600 border-transparent cursor-not-allowed line-through'
                            }`}
                            onClick={() => setAppTime(slot.time)}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason for Consultation</label>
                    <textarea
                      required
                      rows={3}
                      className="textarea textarea-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl text-sm"
                      placeholder="Describe symptoms, regular checkup details or medical history reasons..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="btn btn-primary w-full h-12 gap-2 border-none bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all mt-4"
                  >
                    {bookingLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <span>Confirm Consultation Booking</span>
                        <ChevronRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DoctorDetail;
