import React, { useState } from 'react';
import { FileText, ShieldAlert, Users } from 'lucide-react';

export default function ReportsView({
  patients,
  appointments,
  consultations,
  detoxSessions,
  stayManagement,
  prescriptions,
  dietCharts,
  followups
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [activeReportTab, setActiveReportTab] = useState('history');

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0] || {};
  
  const ptAppointments = appointments.filter(a => a.patient_id === activePatient.id);
  const ptConsultations = consultations.filter(c => c.patient_id === activePatient.id);
  const ptDetoxes = detoxSessions.filter(d => d.patient_id === activePatient.id);
  const ptStays = stayManagement.filter(s => s.patient_id === activePatient.id);
  const ptPrescriptions = prescriptions.filter(pr => pr.patient_id === activePatient.id);
  const ptDietCharts = dietCharts.filter(di => di.patient_id === activePatient.id);
  const ptFollowups = followups.filter(f => f.patient_id === activePatient.id);

  const systemUsers = [
    { name: 'Dr. Evelyn Carter', role: 'Doctor', dept: 'Clinical Consultations', code: 'MD-KA-991' },
    { name: 'Sarah Jenkins', role: 'Receptionist', dept: 'Front Desk', code: 'REC-BLR-01' },
    { name: 'Nolan Ross', role: 'Technician', dept: 'Detox Procedure', code: 'TECH-DTX-02' },
    { name: 'System Admin', role: 'Admin', dept: 'Operations', code: 'ADM-SYS-90' }
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate clinical treatment sheets and audit user roles.
          </p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReportTab('history')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeReportTab === 'history'
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          📄 Lifecycle History
        </button>
        <button
          onClick={() => setActiveReportTab('permissions')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeReportTab === 'permissions'
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          🔐 User Roles Manager
        </button>
      </div>

      {activeReportTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm h-fit space-y-4">
            <div>
              <label className="block text-xs text-slate-500 font-bold uppercase mb-2">Select Patient File</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl text-sm text-slate-600 leading-relaxed text-left">
              <h4 className="font-bold text-slate-800 mb-1">🔍 360° Audit Summary</h4>
              <span>
                Selecting a patient compiles their entire clinic records—from intake calls, consultations, detox therapies, stay logs, prescriptions, and followups.
              </span>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{activePatient.name}</h3>
                <span className="text-sm text-slate-500 font-medium">Lifecycle Audit Sheet • Registered: {activePatient.registered_at}</span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">{activePatient.id}</span>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span> 
                  Consultation Notes & Diagnosis
                </h4>
                {ptConsultations.length > 0 ? (
                  ptConsultations.map(c => (
                    <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mb-2">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Doctor: {c.doctor_name}</span>
                        <span className="text-slate-500">Date: {c.date}</span>
                      </div>
                      <p className="text-slate-600"><strong className="text-slate-700">Diagnosis:</strong> {c.diagnosis}</p>
                      <p className="text-slate-600"><strong className="text-slate-700">Vitals:</strong> BP: {c.vitals?.bp} | Weight: {c.vitals?.weight} | Pulse: {c.vitals?.pulse}</p>
                      {c.detox_recommended && (
                        <div className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-md border border-emerald-200 w-fit mt-2">
                          Detox Recommended: {c.detox_type}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic pl-3">No consultations logged.</p>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span> 
                  Detox Procedure History
                </h4>
                {ptDetoxes.length > 0 ? (
                  <div className="space-y-2">
                    {ptDetoxes.map(d => (
                      <div key={d.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800 block mb-0.5">{d.type}</strong>
                          <span className="text-slate-500 text-xs">Date: {d.scheduled_date} • Tech: {d.technician}</span>
                        </div>
                        <span className="px-3 py-1 rounded-md bg-white border border-slate-200 text-emerald-700 font-bold text-xs shadow-sm">
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic pl-3">No detox sessions scheduled.</p>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span> 
                  Admission & Stay Logs
                </h4>
                {ptStays.length > 0 ? (
                  <div className="space-y-2">
                    {ptStays.map(s => (
                      <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex justify-between font-bold text-slate-800 mb-1">
                          <span>Room: {s.room_name}</span>
                          <span className="text-purple-600">{s.status}</span>
                        </div>
                        <p className="text-xs text-slate-500">Check-in: {s.check_in_time} {s.check_out_time && `• Check-out: ${s.check_out_time}`}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic pl-3">No admission stays recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'permissions' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600" /> Clinic ERP Access Matrix
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Active configuration profiles detailing system module restrictions. Change roles in the header to test workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {systemUsers.map((user, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="block text-sm font-bold text-slate-800">{user.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md font-bold uppercase w-fit block">
                  {user.role}
                </span>
                <div className="text-xs text-slate-500 pt-1 space-y-1 font-medium">
                  <div>Dept: {user.dept}</div>
                  <div>Code: {user.code}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
