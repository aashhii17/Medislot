import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Calendar, LogOut, User, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="navbar glass-panel sticky top-0 z-50 px-4 lg:px-12 shadow-sm transition-all duration-300">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden mr-2">
            <Menu className="h-5 w-5 text-neutral dark:text-white" />
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-200 dark:bg-slate-800 dark:border-slate-700">
            <li><Link to="/">Home</Link></li>
            {user && (
              <>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/appointments">My Appointments</Link></li>
              </>
            )}
          </ul>
        </div>
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-neutral dark:text-white">
          <div className="bg-gradient-to-tr from-primary to-secondary p-1.5 rounded-lg text-white">
            <Calendar className="h-6 w-6" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary text-gradient font-extrabold">MediSlot</span>
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2 font-medium">
          <li>
            <Link to="/" className="hover:text-primary transition-colors py-2 px-4 rounded-lg">Home</Link>
          </li>
          {user && (
            <>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors py-2 px-4 rounded-lg">Dashboard</Link>
              </li>
              <li>
                <Link to="/appointments" className="hover:text-primary transition-colors py-2 px-4 rounded-lg">My Appointments</Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="navbar-end gap-3">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="btn btn-ghost btn-circle text-neutral dark:text-white hover:bg-base-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {user ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder border border-primary/20 hover:border-primary/50 transition-colors">
              <div className="bg-gradient-to-tr from-primary to-secondary text-white rounded-full w-10">
                <span className="font-semibold text-sm">{user.username.substring(0,2).toUpperCase()}</span>
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-3 shadow-xl bg-base-100 rounded-xl w-60 border border-base-200 dark:bg-slate-800 dark:border-slate-700">
              <div className="px-2 py-1.5 mb-2 border-b border-base-200 dark:border-slate-700">
                <p className="font-semibold text-neutral dark:text-white">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                <span className="badge badge-primary badge-outline badge-sm mt-1.5 capitalize font-medium">{user.role}</span>
              </div>
              <li>
                <Link to="/dashboard" className="flex items-center gap-2 py-2 text-neutral dark:text-neutral-200 hover:text-primary">
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-ghost font-semibold text-neutral dark:text-white py-2 px-4 rounded-xl hover:bg-base-200 dark:hover:bg-slate-700 transition-all">
              Log In
            </Link>
            <Link to="/signup" className="btn btn-primary font-semibold text-white bg-gradient-to-r from-primary to-secondary border-none hover:opacity-90 py-2 px-5 rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
