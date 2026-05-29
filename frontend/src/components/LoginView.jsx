import React, { useState } from 'react';
import { User, Shield, Stethoscope, Lock, ArrowRight } from 'lucide-react';
import { authApi } from '../api/authApi';

export default function LoginView({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('receptionist');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { id: 'receptionist', title: 'Receptionist', icon: User,  },
    { id: 'doctor', title: 'Doctor', icon: Stethoscope,  },
    { id: 'admin', title: 'System Admin', icon: Shield, }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return alert('Please enter your staff username.');
    if (!pin) return alert('Please enter your staff PIN code.');

    setIsLoading(true);
    try {
      const response = await authApi.login({ email: trimmedUsername, pin });

      // Ensure the selected role in the UI matches the user's actual role in the database
      if (selectedRole.toUpperCase() !== response.role) {
        throw new Error(`Unauthorized: Your account does not have access to the ${selectedRole} workspace.`);
      }

      // Save the token to local storage so the session persists on refresh
      localStorage.setItem('access_token', response.access_token);

      // Pass the authenticated user data to the parent component
      onLogin({ role: response.role.toLowerCase(), username: response.name || response.fullName || response.email });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden min-h-[550px]">
        
        {/* Left Side: Branding */}
        <div className="bg-emerald-600 p-8 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight font-outfit mb-3 mt-8">{"Manthrralaya's"}</h1>
            <p className="text-emerald-50 text-lg font-medium leading-relaxed max-w-sm">
              Advanced Clinical Management, Patient CRM, & Detox Lifecycle Engine.
            </p>
          </div>

          <div className="relative z-10 text-emerald-100 text-sm font-medium">
            <p>Secure Staff Portal. Authorized personnel only.</p>
            <p className="mt-1 opacity-70">© 2026 {"Manthrralaya's"} Wellness</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-6">Select your clinical department to access the workspace.</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-xl animate-fadeIn text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              {roles.map(role => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <label 
                    key={role.id} 
                    className={`flex items-center space-x-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="role" 
                      value={role.id} 
                      checked={isSelected}
                      onChange={() => setSelectedRole(role.id)} 
                      className="hidden" 
                    />
                    <div className={`flex items-center justify-center w-10 h-10 rounded-2xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-semibold text-sm tracking-tight ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>{role.title}</h4>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>{role.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Email
              </label>
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-center font-bold text-lg placeholder:text-sm placeholder:font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Secure Auth PIN
              </label>
              <input
                type="password"
                required
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-center font-bold text-lg placeholder:text-sm placeholder:font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Authenticating...' : 'Access Workspace'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
