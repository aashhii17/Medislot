import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Stethoscope, Trash2 } from 'lucide-react';

interface Appointment {
  id: number;
  doctor: number;
  doctor_detail: {
    id: number;
    name: string;
    specialty: string;
  };
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: 'booked' | 'completed' | 'cancelled';
  created_at: string;
}

const MyAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/api/appointments/');
        setAppointments(Array.isArray(res.data) ? res.data : (res.data.results || []));
      } catch (err) {
        console.error(err);
        setError('Failed to load appointments.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.post(`/api/appointments/${id}/cancel/`);
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'cancelled' } : app))
      );
    } catch (err) {
      console.error(err);
      alert('Failed to cancel appointment.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4 lg:px-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-neutral dark:text-white">My Appointments</h2>
          <p className="text-xs text-neutral-400 mt-1">Track and manage your scheduled consultations and medical history</p>
        </div>

        {error && (
          <div className="alert alert-error rounded-xl shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="bg-base-100 dark:bg-slate-900 p-12 text-center rounded-3xl border border-base-300 dark:border-slate-800 shadow-sm">
            <Calendar className="h-14 w-14 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-neutral dark:text-white">No Consultations Scheduled</h3>
            <p className="text-sm text-slate-400 mt-1">You do not have any pending or historical bookings.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => (
              <div 
                key={app.id} 
                className="bg-base-100 dark:bg-slate-900 border border-base-300 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-sm font-semibold capitalize px-2.5 py-2.5 rounded-lg ${
                      app.status === 'booked' ? 'bg-primary/10 text-primary border-primary/20' : 
                      app.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                      'bg-error/10 text-error border-error/20'
                    }`}>
                      {app.status}
                    </span>
                    <span className="text-xs text-neutral-400">Booked on {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-neutral dark:text-white">
                    {user?.role === 'doctor' ? `Patient: ${app.patient_name}` : `Dr. ${app.doctor_detail.name}`}
                  </h3>
                  <p className="text-xs text-slate-400 capitalize flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    <span>{app.doctor_detail.specialty}</span>
                  </p>
                  <p className="text-sm text-slate-500 max-w-lg leading-relaxed"><span className="font-semibold text-neutral-400 text-xs uppercase mr-1">Reason:</span> {app.reason}</p>
                </div>

                <div className="flex flex-row md:flex-col items-start md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-base-200 dark:border-slate-800 gap-4">
                  <div className="text-left md:text-right space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-neutral dark:text-white">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{app.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 md:justify-end">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{app.appointment_time}</span>
                    </div>
                  </div>

                  {app.status === 'booked' && (
                    <button
                      onClick={() => handleCancel(app.id)}
                      className="btn btn-sm btn-outline btn-error gap-1.5 rounded-xl font-bold"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
