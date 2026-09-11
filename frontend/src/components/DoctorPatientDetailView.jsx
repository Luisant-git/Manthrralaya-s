import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Droplets, CalendarDays, Search, Loader2, AlertCircle, RefreshCw, User, Eye } from 'lucide-react';
import { getDoctorPatientDetail } from '../api/doctorApi';
import PatientHistoryModal from './PatientHistoryModal';

const STATUS_TABS = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'amber' },
  { id: 'startedDetox', label: 'Started Detox', icon: Droplets, color: 'teal' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'emerald' },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'rose' },
  { id: 'detox', label: 'Detox Sessions', icon: Droplets, color: 'violet' },
];

const COLOR_MAP = {
  amber: { text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  blue: { text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  teal: { text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
  emerald: { text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  rose: { text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  violet: { text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800' },
};

function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CARD_CHIP = {
  blue:   'bg-blue-100 text-blue-600',
  emerald:'bg-emerald-100 text-emerald-600',
  amber:  'bg-amber-100 text-amber-600',
  teal:   'bg-teal-100 text-teal-600',
  violet: 'bg-violet-100 text-violet-600',
  rose:   'bg-rose-100 text-rose-600',
  slate:  'bg-slate-200 text-slate-600',
};

const StatCard = ({ label, value, icon: Icon, color, b }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-full">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${CARD_CHIP[color] || CARD_CHIP.slate}`}>
        <Icon className="w-4 h-4" />
      </span>
    </div>
    <p className="text-3xl font-extrabold text-slate-800 leading-none">{value}</p>
    {b ? <BreakdownChips b={b} /> : <div className="flex-1" />}
  </div>
);

const BreakdownChips = ({ b }) => (
  <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-3">
    <span className="flex flex-col items-center rounded-lg bg-blue-50 text-blue-700 px-1 py-1.5 leading-tight">
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">Initial</span>
      <span className="text-sm font-extrabold">{b.initial || 0}</span>
    </span>
    <span className="flex flex-col items-center rounded-lg bg-teal-50 text-teal-700 px-1 py-1.5 leading-tight">
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">Detox</span>
      <span className="text-sm font-extrabold">{b.detox || 0}</span>
    </span>
    <span className="flex flex-col items-center rounded-lg bg-indigo-50 text-indigo-700 px-1 py-1.5 leading-tight">
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">Review</span>
      <span className="text-sm font-extrabold">{b.review || 0}</span>
    </span>
  </div>
);

export default function DoctorPatientDetailView({ doctor, 
onBack, initialFrom, initialTo, consultations = [], detoxSessions = [], doctors = [], onGiveConsultation, onGiveReview, activeRole 
}) {
  const today = new Date().toISOString().split('T')[0];
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(initialFrom || today);
  const [toDate, setToDate] = useState(initialTo || initialFrom || today);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [historyPatient, setHistoryPatient] = useState(null);

  useEffect(() => {
    loadDetail();
  }, [fromDate, toDate, doctor.doctorId]);

  const loadDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDoctorPatientDetail(doctor.doctorId, fromDate, toDate);
      if (result.success) {
        setDetail(result);
      } else {
        setError(result.message || 'Failed to load doctor details.');
      }
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = detail?.stats || {};

  const baseItems = (detail?.appointments?.[activeTab] || [])
    .concat(activeTab === 'detox' ? detail?.detoxSessions || [] : []);

  // If there are shared records for this doctor and we're viewing pending, show them first
  const sharedItems = (activeTab === 'pending' && detail?.shares && Array.isArray(detail.shares))
    ? detail.shares.map(s => ({
        id: `share-${s.id}`,
        patientId: s.patientId,
        patient: s.patient,
        appointmentType: 'Shared',
        session: '-',
        status: 'Shared',
        notes: s.notes,
        time: s.date,
        date: s.date,
        isShared: true,
        fromDoctor: s.fromDoctor
      }))
    : [];

  const allItems = sharedItems.concat(baseItems);

  const filteredList = allItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const p = item.patient || {};
    return (
      p.name?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term) ||
      item.session?.toLowerCase().includes(term) ||
      item.appointmentType?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header with back button and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
              {doctor.name}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {doctor.specialization} &middot; <span className={doctor.status === 'Available' ? 'text-emerald-600' : 'text-rose-600'}>{doctor.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search + From/To date range row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, phone, location, session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <label className="text-xs font-bold text-slate-500 uppercase">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm text-slate-800 bg-transparent focus:outline-none font-medium"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <label className="text-xs font-bold text-slate-500 uppercase">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm text-slate-800 bg-transparent focus:outline-none font-medium"
            />
          </div>
          <button
            onClick={loadDetail}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <p className="font-medium">Loading patient data...</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <AlertCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <p className="text-slate-500">{error}</p>
          <button onClick={loadDetail} className="mt-4 text-emerald-600 font-bold hover:underline">Try Again</button>
        </div>
      ) : (
        <>
          {/* Stats Cards (ordered: Total Booked, Checked-in, Arrived, Detox Going On, Detox Completed, Cancelled, Pending) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <StatCard label="Total Booked" value={stats.booked || 0} icon={CalendarDays} color="blue" b={stats.breakdown?.booked} />
            <StatCard label="Checked-in" value={stats.consulting || 0} icon={CheckCircle2} color="emerald" b={stats.breakdown?.checkin} />
            <StatCard label="Arrived" value={stats.arrived || 0} icon={Clock} color="amber" b={stats.breakdown?.arrived} />
            <StatCard label="Detox Going On" value={stats.startedDetox || 0} icon={Droplets} color="teal" />
            <StatCard label="Detox Completed" value={stats.detoxCompleted || 0} icon={CheckCircle2} color="violet" />
            <StatCard label="Cancelled" value={stats.cancelled || 0} icon={XCircle} color="rose" />
            <StatCard label="Pending" value={stats.pending || 0} icon={Clock} color="slate" />
          </div>

          {/* Status Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
              {STATUS_TABS.map((tab) => {
                const Icon = tab.icon;
                const count = tab.id === 'detox' ? (stats.detox || 0) : (stats[tab.id] || 0);
                const colors = COLOR_MAP[tab.color];
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                      isActive
                        ? `${colors.text} border-current bg-white`
                        : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? colors.badge : 'bg-slate-200 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-4">
              {filteredList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium">No patients found for the selected date range.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3 font-bold">S.No</th>
                        <th className="px-4 py-3 font-bold">Patient ID</th>
                        <th className="px-4 py-3 font-bold">Patient</th>
                        <th className="px-4 py-3 font-bold">Date</th>
                        {activeTab !== 'detox' && (
                          <>
                            <th className="px-4 py-3 font-bold text-center">Session</th>
                            <th className="px-4 py-3 font-bold text-center">Type</th>
                          </>
                        )}
                        {activeTab === 'detox' && (
                          <>
                            <th className="px-4 py-3 font-bold text-center">Session</th>
                            <th className="px-4 py-3 font-bold text-center">Type</th>
                          </>
                        )}
                        <th className="px-4 py-3 font-bold">Location</th>
                        <th className="px-4 py-3 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredList.map((item, idx) => {
                        const p = item.patient || {};
                        return (
                          <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 text-emerald-700 font-bold">P-{p.id || item.patientId}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-bold text-slate-800">{p.name}</p>
                                {p.age && <p className="text-xs text-slate-500">{p.age} yrs{p.gender ? ` · ${p.gender}` : ''}</p>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(item.date || item.sessionDate || item.time)}</td>
                            {activeTab !== 'detox' && (
                              <>
                                <td className="px-4 py-3 text-center">
                                  {item.session ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                      {item.session === 'FN' ? 'Morning' : 'Afternoon'}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {item.appointmentType ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                      {item.appointmentType}
                                    </span>
                                  ) : '-'}
                                </td>
                              </>
                            )}
                            {activeTab === 'detox' && (
                              <>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg bg-violet-50 text-violet-700 font-extrabold">
                                    {item.sessionNumber ? `S${item.sessionNumber}` : '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                                    {item.sessionType || '-'}
                                  </span>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3 text-slate-600">{p.location || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setHistoryPatient(p.id ? p : { ...p, id: p.id ?? item.patientId })}
                                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                History
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {historyPatient && (
        <PatientHistoryModal
          patient={historyPatient}
          consultations={consultations}
          detoxSessions={detoxSessions}
          doctors={doctors}
          onClose={() => setHistoryPatient(null)}
          onShare={() => loadDetail()}
          onRefresh={() => loadDetail()}
          fromDoctorId={doctor.doctorId || doctor.id}
          activeRole={activeRole}
        />
      )}
    </div>
  );
}
