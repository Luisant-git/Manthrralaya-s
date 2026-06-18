import React, { useState, useMemo } from 'react';
import { 
  Search, CalendarDays, Clock, Activity, FileText, CheckCircle, X, 
  PhoneCall, Filter, User, Stethoscope, Edit2, Save, UserPlus, 
  Mail, Lock, Shield, AlertCircle, Trash2, Power, UserCheck, 
  Phone, ArrowLeft, Briefcase, Key, AlertTriangle, Eye, 
  EyeOff, ChevronLeft, ChevronRight, FileSignature, Clipboard, 
  Calendar, MessageSquare, PenTool, Check, Calendar as CalendarIcon,

} from 'lucide-react';
import { updateReceptionistFollowup, sendFollowupReminder } from '../api/consultationApi';
import { toast } from 'react-toastify';

export default function FollowUpsView({ patients = [], consultations = [], appointments = [], followups = [], detoxSessions = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');

  // Edit Modal State
  const [editingFup, setEditingFup] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('Pending');
  const [isUpdating, setIsUpdating] = useState(false);

  // View Modal State
  const [viewingFup, setViewingFup] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Derive a master list of all follow-ups
  const masterFollowUps = useMemo(() => {
    const list = [];
    
    patients.forEach(pt => {
      let ptFollowup = null;
      
      const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(pt.id));
      const latestCons = [...ptCons].sort((a,b)=> new Date(b.consultationDate || b.date || 0) - new Date(a.consultationDate || a.date || 0))[0];

      // Check detox sessions for explicit follow-up
      const ptDetoxSessions = detoxSessions ? detoxSessions.filter(ds => String(ds.patient_id || ds.patientId) === String(pt.id)) : [];
      const latestDetox = [...ptDetoxSessions].sort((a, b) => new Date(b.sessionDate || b.date || 0) - new Date(a.sessionDate || a.date || 0))[0];
      
      if (latestDetox && (latestDetox.followupDate || latestDetox.followup_date)) {
        const detoxApptId = latestDetox.appointmentId || latestDetox.appointment_id;
        const detoxConsId = latestDetox.consultationId || latestDetox.consultation_id;
        
        let linkedConsultationId = detoxConsId || null;
        let detoxDate = latestDetox.followupDate || latestDetox.followup_date;
        let detoxStatus = latestDetox.status || 'Pending';
        let detoxNotes = latestDetox.notes || latestDetox.followupRemarks || '';
        
        if (!linkedConsultationId && detoxApptId) {
          const consFromAppt = consultations.find(c => String(c.appointment_id || c.appointmentId) === String(detoxApptId));
          if (consFromAppt) {
            linkedConsultationId = consFromAppt.id;
          }
        }
        
        if (!linkedConsultationId && latestCons) {
          linkedConsultationId = latestCons.id;
        }

        let receptionistData = null;
        if (linkedConsultationId) {
          const linkedConsObj = consultations.find(c => String(c.id) === String(linkedConsultationId));
          const rec = linkedConsObj?.receptionistFollowup || linkedConsObj?.receptionist_followup;
          if (rec && (rec.followupDate || rec.followup_date)) {
            receptionistData = {
              date: rec.followupDate || rec.followup_date,
              status: rec.status || detoxStatus,
              notes: rec.notes || rec.notes_text || ''
            };
          }
        }
        
        ptFollowup = {
          id: latestDetox.id || `detox-${latestDetox.id}`,
          consultationId: linkedConsultationId,
          patient: pt,
          doctorDate: detoxDate,
          doctorNotes: detoxNotes,
          doctorStatus: detoxStatus,
          receptionistDate: receptionistData?.date || null,
          receptionistNotes: receptionistData?.notes || null,
          receptionistStatus: receptionistData?.status || null,
          date: receptionistData?.date || detoxDate,
          notes: receptionistData?.notes || detoxNotes,
          status: receptionistData?.status || detoxStatus,
          type: 'Detox',
          source: 'DetoxSession',
          hasReceptionistData: !!receptionistData
        };
      }

      if (latestCons && !ptFollowup) {
        const rec = latestCons.receptionistFollowup || latestCons.receptionist_followup;
        let doctorDate = latestCons.followup_date || latestCons.followupDate;
        let doctorNotes = latestCons.followup_remarks || latestCons.followupRemarks || '';
        let doctorStatus = 'Pending';
        
        let receptionistData = null;
        if (rec && (rec.followupDate || rec.followup_date)) {
          receptionistData = {
            date: rec.followupDate || rec.followup_date,
            status: rec.status || 'Pending',
            notes: rec.notes || rec.notes_text || ''
          };
        }
        
        if (doctorDate || receptionistData) {
          ptFollowup = {
            id: rec?.id || `doc-${latestCons.id}`,
            consultationId: latestCons.id,
            patient: pt,
            doctorDate: doctorDate || null,
            doctorNotes: doctorNotes || '',
            doctorStatus: doctorStatus,
            receptionistDate: receptionistData?.date || null,
            receptionistNotes: receptionistData?.notes || null,
            receptionistStatus: receptionistData?.status || null,
            date: receptionistData?.date || doctorDate,
            notes: receptionistData?.notes || doctorNotes,
            status: receptionistData?.status || doctorStatus,
            type: latestCons.detox_recommended || latestCons.detoxRecommended ? 'Detox' : 'Review',
            source: 'Doctor',
            hasReceptionistData: !!receptionistData
          };
        }
      }
      
      // Fallback to derived followups
      if (!ptFollowup) {
        const fup = followups
          .filter(f => String(f.patient_id) === String(pt.id))
          .sort((a, b) => new Date(a.scheduled_date || a.date) - new Date(b.scheduled_date || b.date))[0];
          
        if (fup) {
          ptFollowup = {
            id: fup.id,
            consultationId: fup.id?.startsWith('FUP-C-') ? parseInt(fup.id.split('-')[2]) : (latestCons?.id || null),
            patient: pt,
            doctorDate: fup.scheduled_date || fup.date,
            doctorNotes: fup.notes || '',
            doctorStatus: fup.status || 'Pending',
            receptionistDate: null,
            receptionistNotes: null,
            receptionistStatus: null,
            date: fup.scheduled_date || fup.date,
            notes: fup.notes || '',
            status: fup.status || 'Pending',
            type: fup.notes?.toLowerCase().includes('detox') ? 'Detox' : 'Review',
            source: 'System',
            hasReceptionistData: false
          };
        }
      }
      
      if (ptFollowup) {
        const scheduledDateObj = new Date(ptFollowup.date);
        const actionDateObj = new Date(scheduledDateObj);
        actionDateObj.setDate(scheduledDateObj.getDate() - 3);
        ptFollowup.actionDate = actionDateObj.toISOString().split('T')[0];
        list.push(ptFollowup);
      }
    });
    
    return list;
  }, [patients, consultations, followups, detoxSessions, appointments]);

  // Filter based on search and status
  const filteredList = masterFollowUps.filter(f => {
    const matchesSearch = !searchTerm || 
      f.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.patient.phone?.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate dashboard counts (ONLY PENDING items count for review/detox)
  const todayCount = filteredList.filter(f => f.actionDate === today).length;
  const tomorrowCount = filteredList.filter(f => f.actionDate === tomorrow).length;
  const detoxCount = filteredList.filter(f => f.type === 'Detox' && f.status === 'Pending').length;
  const reviewCount = filteredList.filter(f => f.type === 'Review' && f.status === 'Pending').length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Follow-up Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track and manage patient follow-ups, next visit dates, and receptionist updates.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-blue-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full opacity-50"></div>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 z-10">
            <Clock className="w-6 h-6" />
          </div>
          <div className="z-10">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Today's Follow-ups</span>
            <div className="text-3xl font-extrabold text-blue-600 mt-0.5">{todayCount}</div>
          </div>
        </div>

        <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-50 rounded-full opacity-50"></div>
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 z-10">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="z-10">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Call Tomorrow</span>
            <div className="text-3xl font-extrabold text-amber-600 mt-0.5">{tomorrowCount}</div>
          </div>
        </div>

        <div className="bg-white border border-teal-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-teal-50 rounded-full opacity-50"></div>
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0 z-10">
            <Activity className="w-6 h-6" />
          </div>
          <div className="z-10">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Detox Follow-ups</span>
            <div className="text-3xl font-extrabold text-teal-600 mt-0.5">{detoxCount}</div>
          </div>
        </div>

        <div className="bg-white border border-purple-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-50 rounded-full opacity-50"></div>
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 z-10">
            <FileText className="w-6 h-6" />
          </div>
          <div className="z-10">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Review Follow-ups</span>
            <div className="text-3xl font-extrabold text-purple-600 mt-0.5">{reviewCount}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Call On</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Next Visit Date</th>
                <th className="py-3 px-4">Follow-up Update</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.sort((a,b) => new Date(a.actionDate) - new Date(b.actionDate)).map(fup => {
                const isToday = fup.actionDate === today;
                const isTomorrow = fup.actionDate === tomorrow;
                const isOverdue = fup.actionDate < today && fup.status === 'Pending';
                
                return (
                  <tr key={fup.id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`font-bold ${isOverdue ? 'text-rose-600' : isToday ? 'text-blue-600' : isTomorrow ? 'text-amber-600' : 'text-slate-800'}`}>
                          {new Date(fup.actionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {isToday && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Call Today</span>}
                        {isTomorrow && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Call Tomorrow</span>}
                        {isOverdue && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Overdue</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[180px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{fup.patient.name}</div>
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <PhoneCall className="w-3 h-3" />
                            {fup.patient.phone?.replace(/\D/g, '').slice(-10) || 'No Phone'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide ${fup.type === 'Detox' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                        {fup.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {fup.doctorDate ? (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-semibold text-emerald-700">
                            {new Date(fup.doctorDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not set</span>
                      )}
                    </td>
                    <td className="py-4 px-4 max-w-[200px]">
                      {fup.receptionistDate ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                             <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-semibold text-blue-700">
                              {new Date(fup.receptionistDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                         
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No update</span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        fup.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        fup.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        fup.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {fup.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {fup.consultationId ? (
                          <>
                            <button
                              onClick={() => setViewingFup(fup)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingFup(fup);
                                setEditDate(fup.date);
                                setEditNotes(fup.notes);
                                setEditStatus(fup.status);
                              }}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Follow-up"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No Edit</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <CalendarDays className="w-10 h-10 text-slate-300 mb-3" />
                      <p>No follow-ups found for the selected criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredList.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6 px-6 pb-4">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredList.length)}</span> of <span className="font-semibold text-slate-800">{filteredList.length}</span> follow-ups
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition ${
                        currentPage === pageNum 
                          ? 'bg-emerald-600 text-white' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

     {viewingFup && (
  <div
    className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-start justify-center pt-12 z-50 animate-fadeIn"
    onClick={() => setViewingFup(null)}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200"
      onClick={e => e.stopPropagation()}
    >
      {/* Header - Simplified */}
      <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800 leading-tight">{viewingFup.patient.name}</h3>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Follow-up Details</p>
        </div>
        <button
          onClick={() => setViewingFup(null)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-6 pt-5 pb-6 space-y-4">

        {/* Patient info row - simplified */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">{viewingFup.patient.name}</p>
            <p className="text-sm text-slate-500 mt-1">{viewingFup.patient.phone?.replace(/\D/g, '').slice(-10) || 'No phone'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${viewingFup.type === 'Detox' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
              {viewingFup.type}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ${viewingFup.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : viewingFup.status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>
              {viewingFup.status}
            </span>
          </div>
        </div>

        {/* Dates grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Doctor's Date</p>
            {viewingFup.doctorDate ? (
              <p className="text-base font-bold text-emerald-800">
                {new Date(viewingFup.doctorDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">Not set</p>
            )}
            {viewingFup.doctorNotes && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed border-t border-emerald-100 pt-3">
                {viewingFup.doctorNotes}
              </p>
            )}
          </div>

          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Reception Update</p>
            {viewingFup.receptionistDate ? (
              <p className="text-base font-bold text-blue-800">
                {new Date(viewingFup.receptionistDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">No update</p>
            )}
            {viewingFup.receptionistNotes && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed border-t border-blue-100 pt-3">
                {viewingFup.receptionistNotes}
              </p>
            )}
          </div>
        </div>

        {/* Call action strip */}
        <div className="flex items-center gap-3 p-4 bg-amber-50/70 rounded-xl border border-amber-100">
          <CalendarDays className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Call Patient On</p>
            <p className="text-base font-bold text-amber-800 mt-0.5">
              {new Date(viewingFup.actionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button
          onClick={() => setViewingFup(null)}
          className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
      {/* Edit Follow-up Modal */}
      {editingFup && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-4 flex justify-between items-start border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Follow-up</h3>
                <p className="text-sm font-medium text-slate-500 mt-0.5">{editingFup.patient.name}</p>
              </div>
              <button onClick={() => setEditingFup(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-50 transition-colors"> 
                <X className="w-5 h-5"/> 
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Doctor's Original Notes - Read Only */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <Stethoscope className="w-4 h-4" /> Doctor's Original Notes
                  
                </div>
                {editingFup.doctorDate && (
                  <div className="text-sm font-semibold text-emerald-800 mt-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-emerald-500" />
                    {new Date(editingFup.doctorDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
                <p className="text-sm text-emerald-900 mt-2 leading-relaxed">
                  {editingFup.doctorNotes || <span className="italic text-emerald-400 font-medium">No doctor notes</span>}
                </p>
              </div>

              {/* Receptionist's Edit Fields */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <select 
                  value={editStatus} 
                  onChange={e=>setEditStatus(e.target.value)} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Schedule Date</label>
                <input 
                  type="date" 
                  value={editDate ? new Date(editDate).toISOString().split('T')[0] : ''} 
                  onChange={e=>setEditDate(e.target.value)} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes (Optional)</label>
                <textarea 
                  rows={2} 
                  placeholder="Any remarks..." 
                  value={editNotes} 
                  onChange={e=>setEditNotes(e.target.value)} 
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-shadow" 
                />
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
              {editingFup.consultationId ? (
                <button 
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors" 
                  onClick={async ()=>{
                    try {
                      setIsUpdating(true);
                      await updateReceptionistFollowup(editingFup.consultationId, { 
                        followupDate: null, 
                        notes: null, 
                        status: 'Pending'
                      });
                      toast.success('Follow-up cleared');
                      if (onRefresh) await onRefresh();
                      setEditingFup(null);
                    } catch (err) { toast.error('Failed to clear'); } finally { setIsUpdating(false); }
                  }}
                >
                  Remove
                </button>
              ) : <div></div>}
              
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm" 
                  onClick={()=>setEditingFup(null)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2" 
                  onClick={async ()=>{
                    if (!editingFup.consultationId) { 
                      toast.error('No consultation available to attach follow-up'); 
                      return; 
                    }
                    try {
                      setIsUpdating(true);
                      
                      const prevDate = editingFup.date ? new Date(editingFup.date).toISOString().split('T')[0] : null;
                      const newDate = editDate ? new Date(editDate).toISOString().split('T')[0] : null;
                      const prevNotes = editingFup.notes || '';
                      const prevStatus = editingFup.status || 'Pending';
                      
                      const notesUpdated = prevNotes !== (editNotes || '');
                      const dateUpdated = prevDate !== newDate;
                      
                      // If cancelled, also clear the follow-up date
                      const isCancelled = editStatus === 'Cancelled';
                      await updateReceptionistFollowup(editingFup.consultationId, { 
                        followupDate: isCancelled ? null : (editDate || null), 
                        notes: editNotes || null, 
                        status: editStatus || 'Pending'
                      });

                      const shouldSendReminder = 
                        !isCancelled && 
                        dateUpdated;

                      if (shouldSendReminder) {
                        try {
                          await sendFollowupReminder(editingFup.consultationId);
                          toast.success('Follow-up date updated and WhatsApp reminder sent');
                        } catch (remErr) {
                          console.error('Failed to send followup reminder', remErr);
                          toast.warning('Date updated but failed to send WhatsApp reminder');
                        }
                      } else {
                        if (isCancelled) {
                          toast.success('Follow-up cancelled successfully. Follow-up date cleared from patient record.');
                        } else if (notesUpdated && !isCancelled) {
                          toast.success('Notes updated successfully');
                        } else if (dateUpdated && !isCancelled) {
                          toast.success('Follow-up date updated successfully');
                        } else if (prevStatus !== editStatus) {
                          toast.success('Follow-up status updated successfully');
                        } else {
                          toast.success('Follow-up updated successfully');
                        }
                      }

                      if (onRefresh) await onRefresh();
                      setEditingFup(null);
                    } catch (err) { 
                      toast.error('Failed to save: ' + err.message); 
                    } finally { 
                      setIsUpdating(false); 
                    }
                  }}
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}