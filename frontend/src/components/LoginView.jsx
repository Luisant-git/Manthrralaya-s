import React, { useState } from 'react';
import { User, Shield, Stethoscope, Lock, ArrowRight } from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('receptionist');
  const [pin, setPin] = useState('');

  const roles = [
    { id: 'receptionist', title: 'Receptionist', icon: User, desc: 'Manage appointments, intake calls, and billing.' },
    { id: 'doctor', title: 'Doctor', icon: Stethoscope, desc: 'View consults, vitals, and issue prescriptions.' },
    { id: 'admin', title: 'System Admin', icon: Shield, desc: 'Full access to clinical reports and settings.' }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (!pin) return alert('Please enter your staff PIN code.');
    // Demo authentication: Accept any PIN for this mock
    onLogin(selectedRole);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden min-h-[550px]">
        
        {/* Left Side: Branding */}
        <div className="bg-emerald-600 p-12 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight font-outfit mb-3 mt-8">Detox360</h1>
            <p className="text-emerald-50 text-lg font-medium leading-relaxed max-w-sm">
              Advanced Clinical Management, Patient CRM, & Detox Lifecycle Engine.
            </p>
          </div>

          <div className="relative z-10 text-emerald-100 text-sm font-medium">
            <p>Secure Staff Portal. Authorized personnel only.</p>
            <p className="mt-1 opacity-70">© 2026 Detox360 Wellness</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-8">Select your clinical department to access the workspace.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              {roles.map(role => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <label 
                    key={role.id} 
                    className={`flex items-start space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="role" 
                      value={role.id} 
                      checked={isSelected}
                      onChange={() => setSelectedRole(role.id)} 
                      className="mt-1 hidden" 
                    />
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-base ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>{role.title}</h4>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>{role.desc}</p>
                    </div>
                  </label>
                );
              })}
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Access Workspace <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
