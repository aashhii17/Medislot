import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { User, Mail, Lock, ChevronRight, AlertCircle, Sparkles, Stethoscope } from 'lucide-react';

interface DoctorOption {
  id: number;
  name: string;
  specialty: string;
}

const Signup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [doctorId, setDoctorId] = useState<number | null>(null);
  
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // If the user selects the doctor role, fetch all doctor entries so they can bind their profile.
    if (role === 'doctor') {
      const fetchDoctors = async () => {
        try {
          const res = await api.get('/api/doctors/');
          const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
          setDoctors(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchDoctors();
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !email || !firstName || !lastName) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/signup/', {
        username,
        password,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        doctor_id: role === 'doctor' ? doctorId : null,
      });

      const { access, refresh, user: userData } = res.data;
      login(access, refresh, userData);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      const errMsgs = err.response?.data;
      if (errMsgs) {
        // Collect field validation errors
        const collect = Object.keys(errMsgs)
          .map((key) => `${key}: ${Array.isArray(errMsgs[key]) ? errMsgs[key].join(', ') : errMsgs[key]}`)
          .join(' | ');
        setError(collect || 'Failed to register account.');
      } else {
        setError('Something went wrong. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#FDFBF7] dark:bg-[#1A1613] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden text-stone-850 dark:text-stone-100">
      {/* Decorative colored glow background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white dark:bg-[#25201C] p-8 rounded-[36px] border border-stone-200 dark:border-stone-850 shadow-xl space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              Create Account
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Join MediSlot today to schedule instant appointments
            </p>
          </div>

          {error && (
            <div className="alert alert-error bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm shadow-sm rounded-xl p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                role === 'patient'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-stone-550 dark:text-stone-400 hover:text-stone-800'
              }`}
              onClick={() => setRole('patient')}
            >
              <Sparkles className="h-4 w-4" />
              <span>Patient Account</span>
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                role === 'doctor'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-stone-550 dark:text-stone-400 hover:text-stone-800'
              }`}
              onClick={() => setRole('doctor')}
            >
              <Stethoscope className="h-4 w-4" />
              <span>Doctor Portal</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">First Name</label>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Last Name</label>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  className="input input-bordered w-full pl-11 bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full pl-11 bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                  placeholder="john_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  className="input input-bordered w-full pl-11 bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white placeholder-stone-400 focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Doctor linking dropdown (only visible when role == 'doctor') */}
            {role === 'doctor' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Link to Doctor Listing</label>
                <select
                  required
                  className="select select-bordered w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-850 dark:text-white focus:border-amber-500 focus:outline-none rounded-xl h-11 text-sm"
                  onChange={(e) => setDoctorId(Number(e.target.value))}
                  value={doctorId || ''}
                >
                  <option value="" disabled>Select your Doctor record</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.name} ({doc.specialty})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-400">
                  * Bind your account to your medical listing to manage patients.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-11 gap-2 border-none bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all mt-4"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-1.5">
            <p className="text-sm text-stone-550 dark:text-stone-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-amber-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
