import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DoctorDetail from './pages/DoctorDetail';
import MyAppointments from './pages/MyAppointments';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-base-100 text-slate-800 transition-colors duration-300">
          <Navbar />
          
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/doctors/:id" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <DoctorDetail />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/appointments" 
                element={
                  <ProtectedRoute>
                    <MyAppointments />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
          
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
