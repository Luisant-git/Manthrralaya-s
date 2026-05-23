import React, { useState } from 'react';
import { User, Shield, Stethoscope, Lock, ArrowRight } from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('receptionist');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  const roles = [
    { id: 'receptionist', title: 'Receptionist', icon: User,  },
    { id: 'doctor', title: 'Doctor', icon: Stethoscope,  },
    { id: 'admin', title: 'System Admin', icon: Shield, }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return alert('Please enter your staff username.');
    if (!pin) return alert('Please enter your staff PIN code.');

    const isValidCredentials =
      (selectedRole === 'receptionist' && trimmedUsername === 'Receptionist' && pin === '1234') ||
      (selectedRole === 'doctor' && trimmedUsername === 'Doctor' && pin === '1234') ||
      (selectedRole === 'admin' && trimmedUsername === 'Admin' && pin === '1234');

    if (!isValidCredentials) {
      return alert('Invalid credentials. Use Receptionist / 1234 or Doctor / 1234  or Admin / 1234');
    }

    onLogin({ role: selectedRole, username: trimmedUsername });
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
                <User className="w-4 h-4" /> Username
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Access Workspace <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-slate-400 mt-2">
              Use: Receptionist / 1234 or Doctor / 1234 or Admin / 1234 supported.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
