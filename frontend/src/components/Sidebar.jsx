import React, { useState } from 'react';
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
  Lock,
  UserCheck,
  Settings,
  ChevronDown
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, activeRole, isSidebarOpen, setIsSidebarOpen, menuPermissions }) {
  const [openMenus, setOpenMenus] = useState({
    'Appointment': false,
    'Master': false,
    'Consultation': false,
    'Patient report': false,
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      
      // If it wasn't already open, open it
      if (!prev[menu]) {
        newState[menu] = true;
      }
      
      return newState;
    });
  };

  const navigationGroups = [
    {
      title: null,
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist', 'therapist'] },
      ]
    },
    {
      title: 'Appointment',
      icon: CalendarDays,
      items: [
        { id: 'receptionist-desk', name: 'Appointment Booking', icon: null, roles: ['receptionist', 'admin'] },
        { id: 'appointments', name: 'Appointment List', icon: null, roles: ['admin'] },
        { id: 'follow-ups', name: 'Follow-ups', icon: null, roles: ['receptionist', 'admin'] },
      ]
    },
    {
      title: 'Master',
      icon: Users,
      items: [
        { id: 'user-management', name: 'Staff Management', icon: null, roles: ['admin'] },
        { id: 'doctor-master', name: activeRole === 'receptionist' ? 'Doctor Availability' : 'Doctor Master', icon: null, roles: ['receptionist', 'admin'] },
      ]
    },
    {
      title: 'Consultation',
      icon: Stethoscope,
      items: [
        { id: 'consultations', name: 'Consultations', icon: null, roles: ['admin', 'doctor'] },
        { id: 'detox', name: 'Detox Scheduling', icon: null, roles: ['admin', 'doctor', 'therapist'] },
        { id: 'admission-scheduling', name: 'Admission Scheduling', icon: null, roles: ['admin', 'doctor', 'therapist'] },
      ]
    },
    {
      title: 'Patient report',
      icon: ClipboardList,
      items: [
        { id: 'doctor-patients', name: 'Doctor wise patient report', icon: null, roles: ['admin'] },
        { id: 'my-patient-records', name: 'My Patient Report', icon: null, roles: ['doctor', 'admin', 'therapist'] },
      ]
    },
    {
      title: null,
      items: [
        { id: 'patients', name: 'Patient Details', icon: Users, roles: ['admin', 'doctor', 'receptionist', 'therapist'] },
        { id: 'settings', name: 'Settings', icon: Settings, roles: ['admin'] },
        { id: 'change-my-pin', name: 'Change My PIN', icon: Lock, roles: ['admin', 'doctor', 'receptionist', 'therapist'] },
      ]
    }
  ];

  const NavLink = ({ item, isSubmenu = false }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    return (
      <button
        onClick={() => {
          setActiveTab(item.id);
          if (setIsSidebarOpen) setIsSidebarOpen(false);
        }}
        className={`w-full flex items-center ${isSubmenu ? 'px-4 py-2 my-0.5' : 'px-3 py-2.5 my-1'} rounded-lg transition-all duration-200 group relative overflow-hidden ${
          isActive
            ? 'bg-emerald-600 text-white shadow-md font-medium'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } ${isSubmenu ? 'text-sm ml-6 w-[calc(100%-1.5rem)]' : 'text-[15px]'}`}
      >
        {isActive && !isSubmenu && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-full"></div>}
        <div className={`flex items-center space-x-3 w-full`}>
          {Icon ? (
            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600 transition-colors'}`} />
          ) : null}
          <span className="flex-1 text-left whitespace-nowrap tracking-wide">{item.name}</span>
        </div>
      </button>
    );
  };

  const NavGroup = ({ group, allowedItems }) => {
    const isOpen = openMenus[group.title];
    const Icon = group.icon;
    
    // Check if any child is active
    const isChildActive = allowedItems.some(item => activeTab === item.id);
    
    return (
      <div className="mb-1">
        <button
          onClick={() => toggleMenu(group.title)}
          className={`w-full flex items-center justify-between px-3 py-2.5 my-1 rounded-lg transition-all duration-200 group hover:bg-slate-100 text-slate-700`}
        >
          <div className="flex items-center space-x-3">
            {Icon && (
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isOpen || isChildActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
            )}
            <span className={`font-semibold tracking-wide whitespace-nowrap text-left text-[15px] ${isOpen || isChildActive ? 'text-emerald-600' : ''}`}>{group.title}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col space-y-1">
            {allowedItems.map(item => (
              <NavLink key={item.id} item={item} isSubmenu={true} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className={`
      w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none shadow-sm
      fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      <div className="flex-1 py-4 overflow-y-auto px-3">
        
        <nav className="flex-1 flex flex-col space-y-1">
          {navigationGroups.map((group, index) => {
            const allowedItems = group.items.filter((item) => {
              // Critical menus that must always be visible (never lock users out)
              const isAlwaysAllowed =
                activeRole === 'admin' && (item.id === 'settings' || item.id === 'user-management') ||
                item.id === 'dashboard';
              // Strict mode: show ONLY the menus the admin enabled for this role
              const isAllowed = isAlwaysAllowed
                ? true
                : menuPermissions
                  ? !!menuPermissions[item.id]
                  : false;
              
              return isAllowed;
            });

            if (allowedItems.length === 0) return null;

            if (group.title) {
              return <NavGroup key={index} group={group} allowedItems={allowedItems} />;
            }

            return (
              <React.Fragment key={index}>
                {allowedItems.map((item) => (
                  <NavLink key={item.id} item={item} isSubmenu={false} />
                ))}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 text-center text-xs text-slate-500 font-medium bg-slate-50">
        <div>{"Manthrralaya's"} v1.0</div>
        <div className="mt-1">Logged in as: <span className="uppercase text-emerald-600 font-bold">{activeRole}</span></div>
      </div>
    </aside>
  );
}