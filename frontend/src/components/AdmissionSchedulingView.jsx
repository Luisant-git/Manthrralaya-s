import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, BedDouble, Search, Loader2, User, FileText, CheckCircle2, Utensils, X, Calendar, Plus, Trash2, Save, Stethoscope } from 'lucide-react';
import FoodChartTab from './FoodChartTab';

export default function AdmissionSchedulingView({ consultations = [], activeRole, currentUserId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  const admissionList = consultations.filter(c => {
    if (!c.admission_recommended && !c.admissionRecommended) return false;
    if (activeRole?.toLowerCase() === 'doctor') {
      const uId = String(currentUserId || localStorage.getItem('user_id'));
      const docName = (localStorage.getItem('user_display_name') || '').toLowerCase();
      const isAssigned = String(c.admission_doctor_id || c.admissionDoctorId) === uId || 
                         String(c.doctor_id || c.doctorId) === uId ||
                         (c.doctor_name && docName && c.doctor_name.toLowerCase() === docName) ||
                         (c.admission_doctor_name && docName && c.admission_doctor_name.toLowerCase() === docName);
      return isAssigned;
    }
    return true;
  });

  const filteredList = admissionList.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const pIdStr = String(c.patient_id || c.patientId || '').toLowerCase();
    return (
      c.patient_name?.toLowerCase().includes(term) ||
      c.doctor_name?.toLowerCase().includes(term) ||
      c.admission_doctor_name?.toLowerCase().includes(term) ||
      pIdStr.includes(term) ||
      `p-${pIdStr}`.includes(term)
    );
  });

  const handleSelect = (admission) => {
    setSelectedAdmission(admission);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const canCreate = activeRole === 'doctor' || activeRole === 'admin';

  if (selectedAdmission) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedAdmission(null)}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-6xl w-full flex flex-col overflow-hidden"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="shrink-0 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create Food Chart</h2>
                  <p className="text-xs text-emerald-100">Patient Diet Tracking</p>
                </div>
              </div>
              <button onClick={() => setSelectedAdmission(null)} className="p-2 rounded-full hover:bg-white/10 transition text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Quick Info (Sub Header) */}
            <div className="shrink-0 bg-emerald-50 px-6 py-3 border-b border-emerald-100 z-10">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">{selectedAdmission.patient_name} <span className="text-slate-500 font-normal ml-1">(P-{selectedAdmission.patient_id})</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700">Assigned: {selectedAdmission.doctor_name || selectedAdmission.admission_doctor_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-700">Admission: {formatDate(selectedAdmission.admission_date)}</span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <div className="max-w-5xl mx-auto space-y-6">

            {/* Entries Section */}
            <FoodChartTab 
              consultation={selectedAdmission} 
              patient={{ id: selectedAdmission.patient_id }} 
            />

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 shrink-0 flex justify-end z-10">
           <button 
             onClick={() => setSelectedAdmission(null)}
             className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
           >
             Close
           </button>
        </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0 flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-emerald-600" />
            Admission Scheduling
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage recommended admissions and diet plans.
          </p>
        </div>
        
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-lg text-slate-600">No admissions found.</p>
            <p className="text-sm mt-1">Patients recommended for admission will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Patient Name</th>
                  <th className="py-3 px-4 font-bold">Admission Date</th>
                  <th className="py-3 px-4 font-bold">Admission Doctor</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="py-4 px-4 align-top">
                      <div className="font-semibold text-slate-900">{c.patient_name}</div>
                      <div className="text-xs text-slate-500 mt-1">P-{c.patient_id}</div>
                    </td>
                    <td className="py-4 px-4 align-top text-slate-600 font-medium">
                      {formatDate(c.admission_date)}
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border border-blue-200 bg-blue-50 text-blue-700">
                        {c.admission_doctor_name || c.doctor_name || 'Not Assigned'}
                      </span>
                    </td>
                    <td className="py-4 px-4 align-top text-right">
                      <button
                        onClick={() => handleSelect(c)}
                        className="inline-flex items-center justify-center bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold py-1.5 px-4 rounded-lg transition-colors text-xs"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
