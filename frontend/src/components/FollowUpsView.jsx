import React, { useState, useMemo } from 'react';
import { Search, CalendarDays, Clock, Activity, FileText, CheckCircle, X, PhoneCall, Filter, User } from 'lucide-react';
import { updateReceptionistFollowup, sendFollowupReminder } from '../api/consultationApi';
import { toast } from 'react-toastify';

export default function FollowUpsView({ patients = [], consultations = [], followups = [], detoxSessions = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');

  // Edit Modal State
  const [editingFup, setEditingFup] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('Pending');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Derive a master list of all follow-ups
  const masterFollowUps = useMemo(() => {
    const list = [];
    
    // Check all patients for follow-ups
    patients.forEach(pt => {
      let ptFollowup = null;
      
      // 1. Check latest consultation
      const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(pt.id));
      const latestCons = [...ptCons].sort((a,b)=> new Date(b.consultationDate || b.date || 0) - new Date(a.consultationDate || a.date || 0))[0];
      
      if (latestCons) {
        const rec = latestCons.receptionistFollowup || latestCons.receptionist_followup;
        if (rec && (rec.followupDate || rec.followup_date)) {
          ptFollowup = {
            id: rec.id || `rec-${latestCons.id}`,
            consultationId: latestCons.id,
            patient: pt,
            date: rec.followupDate || rec.followup_date,
            status: rec.status || 'Pending',
            notes: rec.notes || rec.notes_text || '',
            type: 'Review',
            source: 'Receptionist/Doctor'
          };
        } else if (latestCons.followup_date || latestCons.followupDate) {
          ptFollowup = {
            id: `doc-${latestCons.id}`,
            consultationId: latestCons.id,
            patient: pt,
            date: latestCons.followup_date || latestCons.followupDate,
            status: 'Pending',
            notes: latestCons.followup_remarks || latestCons.followupRemarks || '',
            type: latestCons.detox_recommended || latestCons.detoxRecommended ? 'Detox' : 'Review',
            source: 'Doctor'
          };
        }
      }
      
      // 2. Fallback to derived followups if no consultation followup
      if (!ptFollowup) {
        const fup = followups
          .filter(f => String(f.patient_id) === String(pt.id))
          .sort((a, b) => new Date(a.scheduled_date || a.date) - new Date(b.scheduled_date || b.date))[0];
          
        if (fup) {
          ptFollowup = {
            id: fup.id,
            consultationId: fup.id?.startsWith('FUP-C-') ? parseInt(fup.id.split('-')[2]) : null,
            patient: pt,
            date: fup.scheduled_date || fup.date,
            status: fup.status || 'Pending',
            notes: fup.notes || '',
            type: fup.notes?.toLowerCase().includes('detox') ? 'Detox' : 'Review',
            source: 'System'
          };
        }
      }
      
      if (ptFollowup) {
        // Calculate the action date (3 days before scheduled date)
        const scheduledDateObj = new Date(ptFollowup.date);
        const actionDateObj = new Date(scheduledDateObj);
        actionDateObj.setDate(scheduledDateObj.getDate() - 3);
        
        ptFollowup.actionDate = actionDateObj.toISOString().split('T')[0];
        
        list.push(ptFollowup);
      }
    });
    
    return list;
  }, [patients, consultations, followups]);

  // Filter based on search and status
  const filteredList = masterFollowUps.filter(f => {
    const matchesSearch = !searchTerm || 
      f.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.patient.phone?.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate dashboard counts based on ACTION DATE (3 days before)
  const todayCount = filteredList.filter(f => f.actionDate === today).length;
  const tomorrowCount = filteredList.filter(f => f.actionDate === tomorrow).length;
  const detoxCount = filteredList.filter(f => f.type === 'Detox').length;
  const reviewCount = filteredList.filter(f => f.type === 'Review').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Follow-up Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track and manage patient follow-ups, reviews, and detox schedules.
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
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Call Patient On<br/><span className="text-[10px] text-slate-400 normal-case">(3 days before)</span></th>
                <th className="py-3 px-4">Scheduled For</th>
                <th className="py-3 px-4">Patient Info</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Notes / Remarks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.sort((a,b) => new Date(a.actionDate) - new Date(b.actionDate)).map(fup => {
                const isToday = fup.actionDate === today;
                const isTomorrow = fup.actionDate === tomorrow;
                const isOverdue = fup.actionDate < today && fup.status === 'Pending';
                
                return (
                  <tr key={fup.id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="py-4 px-4 whitespace-nowrap bg-slate-50/50">
                      <div className="flex flex-col">
                        <span className={`font-bold ${isOverdue ? 'text-rose-600' : isToday ? 'text-blue-600' : isTomorrow ? 'text-amber-600' : 'text-slate-800'}`}>
                          {new Date(fup.actionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {isToday && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Call Today</span>}
                        {isTomorrow && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Call Tomorrow</span>}
                        {isOverdue && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Overdue</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-600">
                        {new Date(fup.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-4 px-4 min-w-[200px]">
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
                    <td className="py-4 px-4">
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xs break-words">
                        {fup.notes || <span className="italic text-slate-400">No remarks provided.</span>}
                      </p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
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
                      {fup.consultationId ? (
                        <button
                          onClick={() => {
                            setEditingFup(fup);
                            setEditDate(fup.date);
                            setEditNotes(fup.notes);
                            setEditStatus(fup.status);
                          }}
                          className="bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 transition-colors font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ml-auto shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" /> Edit
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No Edit</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
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
      </div>

      {/* Edit Follow-up Modal */}
      {editingFup && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-left border border-slate-200">
            <div className="p-4 flex justify-between items-start border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Update Follow-up</h3>
                <p className="text-sm font-medium text-slate-500 mt-0.5">{editingFup.patient.name}</p>
              </div>
              <button onClick={() => setEditingFup(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-50 transition-colors"> <X className="w-5 h-5"/> </button>
            </div>
            
            <div className="p-4 space-y-4">
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
                 <button className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors" onClick={async ()=>{
                   try {
                     setIsUpdating(true);
                     await updateReceptionistFollowup(editingFup.consultationId, { followupDate: null, notes: null, status: 'Pending' });
                     toast.success('Follow-up cleared');
                     if (onRefresh) await onRefresh();
                     setEditingFup(null);
                   } catch (err) { toast.error('Failed to clear'); } finally { setIsUpdating(false); }
                 }}>Remove</button>
               ) : <div></div>}
               
               <div className="flex gap-2">
                 <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm" onClick={()=>setEditingFup(null)}>Cancel</button>
                 <button className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2" onClick={async ()=>{
                    if (!editingFup.consultationId) { toast.error('No consultation available to attach follow-up'); return; }
                    try {
                      setIsUpdating(true);
                      await updateReceptionistFollowup(editingFup.consultationId, { 
                        followupDate: editDate || null, 
                        notes: editNotes || null, 
                        status: editStatus || 'Pending' 
                      });
                      // Trigger WhatsApp follow-up reminder send
                      try {
                        await sendFollowupReminder(editingFup.consultationId);
                        toast.success('Follow-up updated and WhatsApp reminder sent');
                      } catch (remErr) {
                        console.error('Failed to send followup reminder', remErr);
                        toast.warning('Follow-up updated but failed to send WhatsApp reminder');
                      }
                      if (onRefresh) await onRefresh();
                      setEditingFup(null);
                    } catch (err) { toast.error('Failed to save'); } finally { setIsUpdating(false); }
                  }}>{isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : 'Save'}</button>
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
