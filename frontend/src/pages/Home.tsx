import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { 
  Search, Award, DollarSign, Stethoscope, ChevronRight, 
  Play, Compass, ShieldCheck, ArrowRight
} from 'lucide-react';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  qualification: string;
  experience_years: number;
  consultation_fee: string;
  bio: string;
  is_available: boolean;
  online_consultation: boolean;
  hospital_name: string;
  city: string;
  rating: string | number;
}

const Home: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  
  // Advanced Search Filters
  const [genderFilter, setGenderFilter] = useState('');
  const [feeMax, setFeeMax] = useState('1500');
  const [experienceMin, setExperienceMin] = useState('0');
  const [ratingMin, setRatingMin] = useState('0');
  const [onlineConsultation, setOnlineConsultation] = useState('');
  const [insuranceAccepted, setInsuranceAccepted] = useState('');
  const [availableToday, setAvailableToday] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (specialtyFilter) params.specialty = specialtyFilter;
      if (genderFilter) params.gender = genderFilter;
      if (feeMax) params.fee_max = feeMax;
      if (experienceMin && experienceMin !== '0') params.experience_min = experienceMin;
      if (ratingMin && ratingMin !== '0') params.rating_min = ratingMin;
      if (onlineConsultation) params.online_consultation = onlineConsultation;
      if (insuranceAccepted) params.insurance_accepted = insuranceAccepted;
      if (availableToday) params.available_today = 'true';
      if (cityFilter) params.city = cityFilter;
      if (languageFilter) params.language = languageFilter;

      const res = await api.get('/api/doctors/', { params });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setDoctors(data);
      
      // Populate specialties dynamically
      if (specialties.length === 0 && data.length > 0) {
        const specs: string[] = Array.from(new Set(data.map((d: any) => d.specialty)));
        setSpecialties(specs);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch doctors. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [
    searchQuery,
    specialtyFilter,
    genderFilter,
    feeMax,
    experienceMin,
    ratingMin,
    onlineConsultation,
    insuranceAccepted,
    availableToday,
    cityFilter,
    languageFilter
  ]);

  const filteredDoctors = doctors.filter(doctor => doctor.is_available);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1613] text-stone-850 dark:text-stone-100 transition-colors duration-300 font-sans">
      
      {/* 1. HERO SECTION (MATCHES mockup STYLE) */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 md:px-12 lg:px-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side text */}
        <div className="lg:col-span-7 space-y-6 text-left animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            100+ Specialists from Partner Hubs
          </div>

          <h1 className="text-4xl md:text-[54px] lg:text-[62px] font-black tracking-tight leading-[1.05] text-stone-900 dark:text-white">
            Healthcare <br />
            for <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Personalised</span> <br />
            Wellness solutions!
          </h1>

          <p className="text-stone-600 dark:text-stone-300 text-base md:text-lg max-w-xl leading-relaxed">
            Skip wait times. Book immediate physical or teleconsultation slots with certified clinicians, securely upload diagnostic records, and maintain clinical histories inside our premium wellness gateway.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4">
            <button className="btn btn-outline border-stone-300 dark:border-stone-850 text-stone-800 dark:text-stone-200 rounded-full px-6 h-12 flex items-center gap-2 font-bold hover:bg-stone-100 dark:hover:bg-stone-900 bg-transparent transition-all">
              <Play className="h-4 w-4 text-amber-500 fill-amber-500" />
              Watch Video
            </button>
            
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-800"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-800"></span>
            </div>
          </div>

          {/* Inline Premium Search Bar inside Hero */}
          <div className="max-w-xl p-1.5 rounded-2xl bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-850 shadow-lg flex flex-col md:flex-row gap-2 mt-8">
            <div className="relative flex-grow flex items-center px-3">
              <Search className="h-5 w-5 text-stone-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search specialty, doctor, location..." 
                className="input input-ghost w-full focus:outline-none text-stone-850 dark:text-white placeholder-stone-400 bg-transparent h-11 text-sm border-none focus:bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="select select-ghost bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-none h-11 focus:outline-none focus:ring-0 md:w-44 text-sm font-semibold rounded-xl capitalize"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              <option value="">All Specialties</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side Illustration matching mockup */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end animate-fadeIn">
          <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-[42px] bg-gradient-to-tr from-[#F1EDE4] via-[#E2DACB] to-[#F1EDE4] p-2 shadow-2xl border border-stone-200/50">
            <img 
              src="/hero-doctor.png" 
              alt="Specialist" 
              className="w-full h-full object-cover rounded-[36px] bg-stone-50"
            />
            
            {/* Tag 1: Surgical Dept (floating top right) */}
            <div className="absolute top-8 -right-8 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/50 dark:border-stone-800 shadow-xl flex items-center gap-2 transition-transform hover:scale-105 duration-300">
              <span className="p-1 bg-amber-500/10 text-amber-600 rounded-lg text-xs">🩺</span>
              <span className="text-[10px] font-bold tracking-tight text-stone-800 dark:text-stone-200">Surgical Department</span>
            </div>

            {/* Tag 2: Healthy Patients (floating middle left) */}
            <div className="absolute top-1/2 -left-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/50 dark:border-stone-800 shadow-xl flex items-center gap-2 transition-transform hover:scale-105 duration-300">
              <span className="p-1 bg-orange-500/10 text-orange-600 rounded-lg text-xs">👥</span>
              <span className="text-[10px] font-bold tracking-tight text-stone-800 dark:text-stone-200">Healthy Patients</span>
            </div>

            {/* Tag 3: Action Link (bottom center) */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] bg-white/95 dark:bg-stone-950/95 backdrop-blur-md p-3.5 rounded-2xl border border-stone-200 dark:border-stone-850 shadow-xl flex justify-between items-center">
              <div>
                <p className="text-[8px] text-stone-400 font-extrabold uppercase tracking-wider">Book Now</p>
                <p className="text-[11px] font-bold text-stone-850 dark:text-stone-100">Consult Top Specialists</p>
              </div>
              <a href="#practitioners" className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white hover:opacity-90 transition-opacity">
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

      </section>

      {/* 2. "WORLD OF HEALTH" DECORATIVE BLOCK (MATCHES mockup STYLE) */}
      <section className="bg-stone-50 dark:bg-stone-900/30 border-y border-stone-200/50 dark:border-stone-850 py-16 px-4 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <h2 className="lg:col-span-4 text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              World of health
            </h2>
            
            <div className="lg:col-span-8 border-l-2 border-amber-500 pl-6">
              <blockquote className="text-stone-600 dark:text-stone-300 text-sm md:text-base italic leading-relaxed font-medium">
                "Join us on the forefront of a wellness revolution. This platform is dedicated to unleashing the potential of personalized healthcare, ensuring that each step of your health is a testament to our commitment to extraordinary clinical care."
              </blockquote>
            </div>
          </div>

          {/* Cards Network Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Feelmind Avatars network */}
            <div className="bg-white dark:bg-[#25201C] p-6 rounded-[32px] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between h-64 hover:shadow-md transition-all">
              <div className="relative flex justify-center items-center h-28 bg-[#FDFBF7] dark:bg-stone-900/60 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800">
                {/* Radial visual layout resembling the mockup */}
                <div className="w-16 h-16 rounded-full border border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center relative">
                  <Compass className="h-5 w-5 text-amber-500" />
                  
                  {/* Floating mini avatars */}
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" className="absolute -top-3 left-4 w-6 h-6 rounded-full object-cover border border-white" alt="" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" className="absolute -bottom-3 left-4 w-6 h-6 rounded-full object-cover border border-white" alt="" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" className="absolute top-4 -right-3 w-6 h-6 rounded-full object-cover border border-white" alt="" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-amber-600">Platform Hub</span>
                <p className="text-xs font-bold text-stone-850 dark:text-stone-200">Feelmind is the primary gateway for health and diagnostics.</p>
              </div>
            </div>

            {/* Card 2: Not Just Healthcare Pill Card */}
            <div className="bg-[#E7E2D8] dark:bg-stone-800/80 p-6 rounded-[32px] border border-stone-200 dark:border-stone-750 shadow-sm flex flex-col justify-between h-64 hover:shadow-md transition-all">
              <div className="flex justify-center items-center h-28 bg-[#DFD9CE] dark:bg-stone-900/60 rounded-2xl relative overflow-hidden">
                <div className="px-5 py-2.5 bg-[#FAF9F5] dark:bg-stone-800 rounded-full shadow-sm text-xs font-bold text-stone-800 dark:text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  Not Just Healthcare
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-stone-600 dark:text-stone-400">#Professionals</span>
                <p className="text-xs font-bold text-stone-850 dark:text-stone-100">Redefining modern patient-practitioner consultations with digital-first solutions.</p>
              </div>
            </div>

            {/* Card 3: Redefines precision and surgical care */}
            <div className="bg-[#E4ECE7] dark:bg-emerald-950/20 p-6 rounded-[32px] border border-stone-200 dark:border-emerald-900/20 shadow-sm flex flex-col justify-between h-64 hover:shadow-md transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">T</div>
                  <div>
                    <h4 className="text-[10px] font-bold text-stone-800 dark:text-stone-200">Tena Johnson</h4>
                    <p className="text-[8px] text-stone-400">Surgery specialist</p>
                  </div>
                </div>
                <a href="#practitioners" className="badge badge-sm py-2 px-3 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 font-bold border-stone-250 dark:border-stone-800">Appointment &rarr;</a>
              </div>
              
              <p className="text-sm font-bold tracking-tight text-[#2B3F34] dark:text-emerald-400 leading-snug">
                Redefines Precision and Compassion in Specialized Surgical Care!
              </p>
              
              <div className="text-[9px] text-stone-500 border-t border-stone-300/40 pt-2 flex justify-between items-center">
                <span>www.medislot.com</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. PRACTITIONERS LIST & FILTER SIDEBAR (FUNCTIONAL INTERACTION) */}
      <main id="practitioners" className="max-w-7xl mx-auto px-4 lg:px-12 py-16 space-y-8 scroll-mt-6">
        
        {/* Available Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-200 dark:border-stone-850 pb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white">Available Practitioners</h2>
            <p className="text-xs text-stone-500 dark:text-stone-450 mt-1">
              Showing {filteredDoctors.length} certified medical specialists ready for scheduled consultations
            </p>
          </div>
          
          {/* Specialties Tabs Selector */}
          <div className="flex flex-wrap gap-1.5 bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-850 w-fit">
            <button 
              onClick={() => setSpecialtyFilter('')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all ${
                specialtyFilter === '' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-850'
              }`}
            >
              All
            </button>
            {specialties.map((spec) => (
              <button 
                key={spec}
                onClick={() => setSpecialtyFilter(spec)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all ${
                  specialtyFilter === spec ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-850'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert-error shadow-sm rounded-xl py-3 flex gap-2">
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Advanced Sidebar search Panel */}
          <div className="lg:col-span-1 bg-white dark:bg-[#25201C] border border-stone-200 dark:border-stone-850 rounded-3xl p-6 shadow-sm space-y-6 h-fit">
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-md text-stone-900 dark:text-white">Refine Search</h3>
              <button 
                onClick={() => {
                  setGenderFilter('');
                  setFeeMax('1500');
                  setExperienceMin('0');
                  setRatingMin('0');
                  setOnlineConsultation('');
                  setInsuranceAccepted('');
                  setAvailableToday(false);
                  setCityFilter('');
                  setLanguageFilter('');
                }}
                className="text-[10px] text-amber-600 hover:underline font-bold uppercase tracking-wider"
              >
                Reset
              </button>
            </div>

            {/* Filters Forms */}
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Clinic Location</label>
                <select 
                  className="select select-bordered select-sm w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <option value="">All Cities</option>
                  <option value="Indore">Indore</option>
                  <option value="Bhopal">Bhopal</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Gender Profile</label>
                <select 
                  className="select select-bordered select-sm w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Consultation Fee</label>
                  <span className="text-xs font-bold text-amber-600">${feeMax} Max</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="1500" 
                  step="50"
                  value={feeMax} 
                  onChange={(e) => setFeeMax(e.target.value)}
                  className="range range-warning range-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Min Experience</label>
                  <span className="text-xs font-bold text-amber-600">{experienceMin} Years+</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  step="1"
                  value={experienceMin} 
                  onChange={(e) => setExperienceMin(e.target.value)}
                  className="range range-warning range-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Rating Benchmark</label>
                <select 
                  className="select select-bordered select-sm w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                  value={ratingMin}
                  onChange={(e) => setRatingMin(e.target.value)}
                >
                  <option value="0">All Ratings</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Languages Spoken</label>
                <input 
                  type="text" 
                  placeholder="e.g. Hindi, English" 
                  className="input input-bordered input-sm w-full bg-[#FDFBF7] dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-sm focus:outline-none"
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input 
                    type="checkbox" 
                    checked={availableToday} 
                    onChange={(e) => setAvailableToday(e.target.checked)} 
                    className="checkbox checkbox-warning checkbox-sm border-stone-300"
                  />
                  <span>Available Today</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input 
                    type="checkbox" 
                    checked={onlineConsultation === 'true'} 
                    onChange={(e) => setOnlineConsultation(e.target.checked ? 'true' : '')} 
                    className="checkbox checkbox-warning checkbox-sm border-stone-300"
                  />
                  <span>Online Video Consult</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-stone-700 dark:text-stone-300">
                  <input 
                    type="checkbox" 
                    checked={insuranceAccepted === 'true'} 
                    onChange={(e) => setInsuranceAccepted(e.target.checked ? 'true' : '')} 
                    className="checkbox checkbox-warning checkbox-sm border-stone-300"
                  />
                  <span>Insurance Accepted</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Specialists listing grid */}
          <div className="lg:col-span-3 text-left">
            {loading ? (
              <div className="flex justify-center py-20">
                <span className="loading loading-spinner loading-lg text-amber-500"></span>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-20 bg-stone-50 dark:bg-stone-900/30 rounded-[32px] border border-dashed border-stone-250 dark:border-stone-800">
                <Stethoscope className="h-12 w-12 mx-auto text-stone-300 dark:text-stone-700 mb-3" />
                <h3 className="text-lg font-bold text-stone-850 dark:text-white">No Specialists Registered</h3>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 max-w-xs mx-auto">
                  No active clinicians fit these advanced search parameters. Try expanding your search queries.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div 
                    key={doctor.id} 
                    className="bg-white dark:bg-[#25201C] rounded-[28px] border border-stone-200 dark:border-stone-850 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
                  >
                    <div className="p-6 space-y-4">
                      
                      {/* Badge info */}
                      <div className="flex justify-between items-start">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                          <Stethoscope className="h-3 w-3" />
                          {doctor.specialty}
                        </span>
                        
                        <div className="flex gap-1.5">
                          {doctor.online_consultation && (
                            <span className="badge bg-cyan-500/10 border-none text-cyan-600 dark:text-cyan-400 font-extrabold text-[9px] px-2 py-2">Video</span>
                          )}
                          <span className="badge bg-emerald-500/10 border-none text-emerald-600 dark:text-emerald-450 font-extrabold text-[9px] px-2 py-2">Active</span>
                        </div>
                      </div>

                      {/* Header details */}
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-extrabold text-stone-900 dark:text-white group-hover:text-amber-500 transition-colors">Dr. {doctor.name}</h3>
                        <p className="text-[11px] text-stone-450 font-semibold">{doctor.qualification} • {doctor.hospital_name} ({doctor.city})</p>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-stone-550 dark:text-stone-350 line-clamp-3 leading-relaxed">
                        {doctor.bio || 'Experienced healthcare specialist dedicated to providing comprehensive diagnostic consultations, therapy directives, and patient health mapping.'}
                      </p>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4 pt-3.5 text-[11px] text-stone-600 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="font-bold">{doctor.experience_years} Years ({doctor.rating}★)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-orange-500 shrink-0" />
                          <span className="font-extrabold text-stone-850 dark:text-white">${doctor.consultation_fee} Fee</span>
                        </div>
                      </div>

                    </div>

                    {/* Book slot footer button */}
                    <div className="p-6 pt-0 mt-auto">
                      <Link 
                        to={`/doctors/${doctor.id}`} 
                        className="btn btn-primary w-full gap-2 border-none bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-amber-500/10 h-11 text-xs"
                      >
                        <span>Request Appointment</span>
                        <ChevronRight className="h-4.5 w-4.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>

    </div>
  );
};

export default Home;
