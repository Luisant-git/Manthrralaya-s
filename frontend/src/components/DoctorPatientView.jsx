import React, { useState, useEffect } from 'react';
import { Stethoscope, CalendarDays, Clock, CheckCircle2, XCircle, Droplets, AlertCircle, Loader2, Search, ChevronLeft, ChevronRight, RefreshCw, Eye, Users } from 'lucide-react';
import { getDoctorsPatientStats } from '../api/doctorApi';

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
      <span className="text-sm font-extrabold">{b.initial}</span>
    </span>
    <span className="flex flex-col items-center rounded-lg bg-teal-50 text-teal-700 px-1 py-1.5 leading-tight">
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">Detox</span>
      <span className="text-sm font-extrabold">{b.detox}</span>
    </span>
    <span className="flex flex-col items-center rounded-lg bg-indigo-50 text-indigo-700 px-1 py-1.5 leading-tight">
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">Review</span>
      <span className="text-sm font-extrabold">{b.review}</span>
    </span>
  </div>
);

export default function DoctorPatientView({ onSelectDoctor }) {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadStats();
  }, [fromDate, toDate]);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDoctorsPatientStats(fromDate, toDate);
      if (result.success) {
        setStats(result.data || []);
      } else {
        setError('Failed to load doctor patient statistics.');
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStats = stats.filter(doc => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(term) ||
      doc.specialization?.toLowerCase().includes(term) ||
      doc.doctorId?.toString().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = filteredStats.slice(startIndex, startIndex + itemsPerPage);

  const totalPatientsAllDoctors = stats.reduce((sum, d) => sum + (d.stats?.booked || 0), 0);
  const totalConsultingAllDoctors = stats.reduce((sum, d) => sum + (d.stats?.consulting || 0), 0);
  const totalArrivedAllDoctors = stats.reduce((sum, d) => sum + (d.stats?.arrived || 0), 0);
  const totalStartedDetoxAllDoctors = stats.reduce((sum, d) => sum + (d.stats?.startedDetox || 0), 0);
  const totalDetoxCompletedAllDoctors = stats.reduce((sum, d) => sum + (d.stats?.detoxCompleted || 0), 0);
  const totalPendingAllDoctors = stats.reduce((sum, d) => sum + (d.stats?.pending || 0), 0);
  const totalCancelledAllDoctors = stats.reduce((sum, d) => sum + (d.stats?.cancelled || 0), 0);

  const aggBreakdown = (key) => {
    const acc = { initial: 0, detox: 0, review: 0 };
    stats.forEach((d) => {
      const b = d.stats?.breakdown ? d.stats.breakdown[key] : null;
      if (b) {
        acc.initial += b.initial || 0;
        acc.detox += b.detox || 0;
        acc.review += b.review || 0;
      }
    });
    return acc;
  };
  const bookedBreakdown = aggBreakdown('booked');
  const checkinBreakdown = aggBreakdown('checkin');
  const arrivedBreakdown = aggBreakdown('arrived');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Doctor Patient Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View date-wise patient counts for each doctor. Click a doctor to see full details.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor name, specialization..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
            onClick={loadStats}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Total Booked" value={totalPatientsAllDoctors} icon={Users} color="blue" b={bookedBreakdown} />
          <StatCard label="Checked-in" value={totalConsultingAllDoctors} icon={CheckCircle2} color="emerald" b={checkinBreakdown} />
          <StatCard label="Arrived" value={totalArrivedAllDoctors} icon={Clock} color="amber" b={arrivedBreakdown} />
          <StatCard label="Detox Going On" value={totalStartedDetoxAllDoctors} icon={Droplets} color="teal" />
          <StatCard label="Detox Completed" value={totalDetoxCompletedAllDoctors} icon={CheckCircle2} color="violet" />
          <StatCard label="Cancelled" value={totalCancelledAllDoctors} icon={XCircle} color="rose" />
          <StatCard label="Pending" value={totalPendingAllDoctors} icon={Clock} color="slate" />
        </div>
      )}

      {/* Table */}
      {!isLoading && stats.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-100">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-3" />
                <p className="font-medium">Loading doctor statistics...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center">
                <AlertCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />
                <p className="text-slate-500">{error}</p>
                <button onClick={loadStats} className="mt-4 text-emerald-600 font-bold hover:underline">Try Again</button>
              </div>
            ) : paginatedDoctors.length === 0 ? (
              <div className="py-12 text-center text-slate-500 bg-white rounded-xl">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No doctors found for this date.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3 font-bold">S.No</th>
                        <th className="px-4 py-3 font-bold">Doctor</th>
                        <th className="px-4 py-3 font-bold text-center">Booked</th>
                        <th className="px-4 py-3 font-bold text-center">Pending</th>
                        <th className="px-4 py-3 font-bold text-center">Completed</th>
                        <th className="px-4 py-3 font-bold text-center">Detox</th>
                        <th className="px-4 py-3 font-bold text-center">Cancelled</th>
                        <th className="px-4 py-3 font-bold text-center">Status</th>
                        <th className="px-4 py-3 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedDoctors.map((doc, idx) => {
                        const stats_data = doc.stats || {};
                        return (
                          <tr
                            key={doc.doctorId}
                            className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                            onClick={() => onSelectDoctor(doc, { from: fromDate, to: toDate })}
                          >
                            <td className="px-4 py-3 text-slate-500 font-medium">{startIndex + idx + 1}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-bold text-slate-800">{doc.name}</p>
                                <p className="text-xs text-slate-500">{doc.specialization}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold">
                                {stats_data.booked || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg bg-rose-50 text-rose-700 font-extrabold">
                                {stats_data.pending || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold">
                                {stats_data.completed || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg bg-violet-50 text-violet-700 font-extrabold">
                                {stats_data.detox || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-extrabold">
                                {stats_data.cancelled || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border tracking-wider whitespace-nowrap ${
                                doc.status === 'Available'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-rose-50 border-rose-200 text-rose-700'
                              }`}>
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs whitespace-nowrap">
                                <Eye className="w-4 h-4" /> View
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
                    <p className="text-sm text-slate-500">
                      Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredStats.length)}</span> of{' '}
                      <span className="font-semibold text-slate-800">{filteredStats.length}</span> doctors
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-xl text-sm font-semibold transition ${
                              currentPage === pageNum ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
