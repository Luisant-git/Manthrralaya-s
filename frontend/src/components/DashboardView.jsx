import React, { useState } from 'react';
import { Users, Calendar, Activity, CheckCircle, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function DashboardView({ 
  patients, 
  appointments, 
  consultations,
  detoxSessions,
  followups,
  stayManagement,
  activeRole,
  onCheckIn,
  onNavigateToTab
}) {
  
  const todayDate = new Date().toISOString().split('T')[0];

  // Calculate quick metrics
  const totalPatients = patients.length;
  const todaysAppts = appointments.filter(a => a.date === todayDate).length;
  const activeStays = stayManagement.filter(s => s.status === 'Admitted').length;
  const pendingFollowups = followups.filter(f => f.status === 'Pending').length;

  const [searchQuery, setSearchQuery] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const todayAppointments = appointments.filter(a => a.date === todayDate);
  const reviewCount = todayAppointments.filter(a => a.appointmentType === 'Review').length;
  const detoxCount = todayAppointments.filter(a => a.appointmentType === 'Detox').length;
  const initialCount = todayAppointments.filter(a => a.appointmentType === 'Initial consultation').length;
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

  const filteredReceptionistAppointments = todayAppointments.filter((appt) => {
    const patient = patients.find((p) => p.id === appt.patient_id) || {};
    const searchValue = searchQuery.trim().toLowerCase();
    const matchesSearch = !searchValue ||
      patient.name?.toLowerCase().includes(searchValue) ||
      patient.phone?.includes(searchValue) ||
      appt.appointmentType?.toLowerCase().includes(searchValue) ||
      (appt.notes || '').toLowerCase().includes(searchValue);
    const matchesType = appointmentFilter === 'all' || appt.appointmentType === appointmentFilter;
    return matchesSearch && matchesType;
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
  const isDoctorView = activeRole === 'doctor';

  return (
    <div className="space-y-6">
      
      {/* Top Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            {isDoctorView ? 'Doctor Dashboard' : 'Clinic Overview'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isDoctorView
              ? 'Today’s patient queue, checked-in arrivals, and pending appointments for the doctor.'
              : 'Real-time insights on patient flow, admissions, and upcoming detox sessions.'}
          </p>
        </div>
      </div>

      {isDoctorView && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Today’s Patients</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-800">{todaysAppts}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Review Patients</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-800">{reviewCount}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Detox Patients</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-800">{detoxCount}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Initial Patients</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-800">{initialCount}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {!isDoctorView && (
        <>
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
        </>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isDoctorView ? (
          <>
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
          </>
        ) : (
          <div className="lg:col-span-3 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Receptionist Appointments</h2>
                <p className="text-sm text-slate-500 mt-1">Today’s appointments with notes. Search by patient, type or note.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{filteredReceptionistAppointments.length} / {todayAppointments.length} today</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px] mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient, notes, or appointment type..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <select
                  value={appointmentFilter}
                  onChange={(e) => setAppointmentFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All Types</option>
                  <option value="Initial consultation">Initial consultation</option>
                  <option value="Detox">Detox</option>
                  <option value="Review">Review</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              {filteredReceptionistAppointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No appointments available.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Appointment Type</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceptionistAppointments.map((appt) => {
                      const pt = patients.find(p => p.id === appt.patient_id) || {};
                      return (
                        <tr key={appt.id} className="hover:bg-slate-50 transition-colors align-top">
                          <td className="py-3 px-4 align-top min-w-[180px]">
                            <div className="font-semibold text-slate-900 text-sm truncate">{pt.name || 'Unknown Patient'}</div>
                            <div className="text-xs text-slate-500">{pt.phone || 'No phone'}</div>
                          </td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">{appt.appointmentType || 'General'}</span>
                          </td>
                          <td className="py-3 px-4 align-top text-slate-600 text-sm max-w-[420px] break-words">{appt.notes || 'No notes available.'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
