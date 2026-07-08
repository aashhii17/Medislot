import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, Shield, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-400 pt-16 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-white">
            <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-1.5 rounded-lg text-white">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-gradient font-extrabold">MediSlot</span>
          </Link>
          <p className="text-sm leading-relaxed">
            Your premier health companion. Book appointments seamlessly with top-rated medical practitioners, securely manage your consultations, and fast-track your health journey.
          </p>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            <span>Built with care for patients and doctors.</span>
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
            <li><Link to="/login" className="hover:text-amber-400 transition-colors">Log In</Link></li>
            <li><Link to="/signup" className="hover:text-amber-400 transition-colors">Create Account</Link></li>
            <li><Link to="/dashboard" className="hover:text-amber-400 transition-colors">Member Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Quality & Security</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-stone-200 font-medium">HIPAA Compliant</h4>
                <p className="text-xs text-stone-500">Your health data and medical histories are fully encrypted.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-stone-200 font-medium">Verified Doctors</h4>
                <p className="text-xs text-stone-500">All registered medical staff undergo multi-level credential validation.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Contact Info</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-amber-400" />
              <span>+1 (800) 555-SLOT</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-orange-400" />
              <span>support@medislot.io</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-1" />
              <span>100 Health Plaza, Suite 400,<br />Medical District, CA 90210</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 pt-8 border-t border-stone-850 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <p>© {new Date().getFullYear()} MediSlot Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-stone-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-stone-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-stone-400 transition-colors">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
