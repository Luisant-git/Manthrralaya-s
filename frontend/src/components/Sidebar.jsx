import React from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  CalendarDays,
  Stethoscope,
  Activity,
  BedDouble,
  MessageSquareCode,
  FileBarChart,
  Users,
  UserPlus,
  Star,
  ClipboardList,
  Key,
  Lock
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, activeRole }) {
  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist', 'therapist'] },
    { id: 'user-management', name: 'Staff Management', icon: UserPlus, roles: ['admin'] },
    { id: 'receptionist-desk', name: 'Appointment Booking', icon: CalendarDays, roles: ['receptionist', 'admin'] },
    { id: 'doctor-master', name: activeRole === 'receptionist' ? 'Doctor Availability' : 'Doctor Master', icon: Stethoscope, roles: ['receptionist', 'admin'] },
    { id: 'patients', name: 'Patient Directory', icon: Users, roles: ['admin', 'doctor', 'receptionist', 'therapist'] },
    { id: 'follow-ups', name: 'Follow-ups', icon: PhoneCall, roles: ['receptionist', 'admin'] },
    // { id: 'phone-calls', name: 'Inquiries & Leads', icon: PhoneCall, roles: ['admin'] },
    { id: 'change-my-pin', name: 'Change My PIN', icon: Lock, roles: ['admin', 'doctor', 'receptionist', 'therapist'] },
    { id: 'appointments', name: 'Appointments', icon: CalendarDays, roles: ['admin'] },
    { id: 'consultations', name: 'Consultations', icon: Stethoscope, roles: ['admin', 'doctor'] },
    { id: 'my-patient-records', name: 'My Patient Records', icon: ClipboardList, roles: ['doctor', 'admin', 'therapist'] },
    { id: 'detox', name: 'Detox Scheduling', icon: Activity, roles: ['admin', 'doctor', 'therapist'] },
    // { id: 'whatsapp-hub', name: 'WhatsApp Hub', icon: MessageSquareCode, roles: ['admin', 'receptionist'] },
    // { id: 'reports', name: 'Reports & Analytics', icon: FileBarChart, roles: ['admin'] },
    // { id: 'reviews', name: 'Patient Feedback', icon: Star, roles: ['admin'] }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none shadow-sm">
      <div className="flex-1 py-6 overflow-y-auto px-4 space-y-6">
        
        <div>
          <span className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Main Menu
          </span>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isAllowed = item.roles.includes(activeRole);
              const isActive = activeTab === item.id;
              
              if (!isAllowed) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 text-center text-xs text-slate-500 font-medium bg-slate-50">
        <div>{"Manthrralaya's"} v1.0</div>
        <div className="mt-1">Logged in as: <span className="uppercase text-emerald-600 font-bold">{activeRole}</span></div>
      </div>
    </aside>
  );
}