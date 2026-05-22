import React from 'react';
import { Users, Calendar, Activity, CheckCircle, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function DashboardView({ 
  patients, 
  appointments, 
  consultations,
  detoxSessions,
  followups,
  stayManagement,
  onCheckIn,
  onNavigateToTab
}) {
  
  const todayDate = new Date().toISOString().split('T')[0];

  // Calculate quick metrics
  const totalPatients = patients.length;
  const todaysAppts = appointments.filter(a => a.date === todayDate).length;
  const activeStays = stayManagement.filter(s => s.status === 'Admitted').length;
  const pendingFollowups = followups.filter(f => f.status === 'Pending').length;

  const todayAppointments = appointments.filter(a => a.date === todayDate);
  const todayPatientDetails = todayAppointments.map((appt) => {
    const patient = patients.find(p => p.id === appt.patient_id) || {};
    const historyCount = consultations.filter(c => c.patient_id === appt.patient_id).length;
    const historyRecords = consultations
      .filter(c => c.patient_id === appt.patient_id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestNote = historyRecords[0]?.consultation_notes || appt.notes || 'No consultation notes yet.';

    return {
      ...appt,
      patient,
      historyCount,
      latestNote
    };
  });

  // Chart data
  const revenueData = [
    { name: 'Jan', patients: 65, detox: 40 },
    { name: 'Feb', patients: 85, detox: 55 },
    { name: 'Mar', patients: 110, detox: 80 },
    { name: 'Apr', patients: 145, detox: 110 },
    { name: 'May', patients: 190, detox: 155 }
  ];

  const sourceData = [
    { source: 'Phone', bookings: 45 },
    { source: 'Walk-in', bookings: 25 },
    { source: 'Website', bookings: 65 },
    { source: 'WhatsApp', bookings: 85 }
  ];

  // Quick Action Queue (Today's arrivals)
  const arrivals = appointments.filter(a => a.status === 'Scheduled' && a.date === todayDate).slice(0, 5);
  const checkedInArrivals = appointments.filter(a => a.status === 'Checked-in' && a.date === todayDate).slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Top Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Clinic Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time insights on patient flow, admissions, and upcoming detox sessions.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-sm font-semibold text-slate-500 block">Total Patients</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{totalPatients}</span>
              <span className="text-sm font-bold text-emerald-500 flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> 12%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigateToTab('appointments')}>
          <div>
            <span className="text-sm font-semibold text-slate-500 block">Today's Appointments</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{todaysAppts}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigateToTab('stay')}>
          <div>
            <span className="text-sm font-semibold text-slate-500 block">Active Admissions</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{activeStays}</span>
              <span className="text-sm font-medium text-slate-400">/ 8 Beds</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-sm font-semibold text-slate-500 block">Pending Reviews</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-800">{pendingFollowups}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Patients */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Today’s Patient List</h2>
              <p className="text-sm text-slate-500">Showing all patients scheduled for today with active history counts.</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{todayPatientDetails.length} patients</span>
          </div>

          <div className="space-y-4">
            {todayPatientDetails.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.patient.name || 'Unknown Patient'}</div>
                    <div className="text-xs text-slate-500">{item.patient.medical_conditions || item.appointmentType}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.time} • {item.source}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-slate-500">History</div>
                    <div className="text-2xl font-bold text-slate-900">{item.historyCount}</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-sm text-slate-700">
                  <span className="text-xs text-slate-500 block mb-1">Latest note:</span>
                  <span className="font-medium text-slate-900">{item.latestNote.replace(/<[^>]+>/g, '').slice(0, 80)}{item.latestNote.length > 80 ? '…' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Queues */}
        <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Growth Chart */}
        {/* <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Patient Growth & Detox Uptake</h3>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">2026 YTD</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDetox" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                <Area type="monotone" dataKey="patients" name="New Patients" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                <Area type="monotone" dataKey="detox" name="Detox Sessions" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorDetox)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div> */}

        {/* Checked-in Patients */}
        {checkedInArrivals.length > 0 && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" /> Checked-in Patients
              </h3>
              <button
                type="button"
                onClick={() => onNavigateToTab('consultations')}
                className="text-xs font-semibold uppercase tracking-widest text-emerald-600 hover:text-emerald-800 whitespace-nowrap"
              >
                Go to Consultations
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto">
              {checkedInArrivals.map((appt) => {
                const pt = patients.find(p => p.id === appt.patient_id) || {};
                return (
                  <div key={appt.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 transition-colors hover:border-emerald-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{pt.name}</span>
                        <span className="text-xs text-slate-500 font-medium">{appt.time} • {appt.source}</span>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-semibold">
                        {appt.status}
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigateToTab('consultations')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      Open Consultation
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Queue */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" /> Pending Arrivals
            </h3>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto">
            {arrivals.map((appt) => {
              const pt = patients.find(p => p.id === appt.patient_id) || {};
              return (
                <div key={appt.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 transition-colors hover:border-emerald-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">{pt.name}</span>
                      <span className="text-xs text-slate-500 font-medium">{appt.time} • {appt.source}</span>
                    </div>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-md font-semibold">
                      {appt.status}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onCheckIn(appt.id);
                      onNavigateToTab('consultations');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Check-in & Open Consultation
                  </button>
                </div>
              );
            })}
            
            {arrivals.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                No pending arrivals in queue.
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
