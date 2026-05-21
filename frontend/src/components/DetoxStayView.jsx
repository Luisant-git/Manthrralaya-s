import React, { useState } from 'react';
import { BedDouble, Activity, CheckSquare, Square, LogOut, CheckCircle } from 'lucide-react';

export default function DetoxStayView({
  detoxSessions,
  stayManagement,
  patients,
  onScheduleDetox,
  onUpdateDetoxStatus,
  onAdmitPatient,
  onUpdateNursingChecklist,
  onDischargePatient
}) {
  const roomsList = [
    { id: '101', name: 'Suite 101 - Serenity', status: 'Available' },
    { id: '102', name: 'Suite 102 - Lotus', status: 'Available' },
    { id: '103', name: 'Suite 103 - Prana', status: 'Available' },
    { id: '104', name: 'Suite 104 - Zenith', status: 'Available' }
  ];

  const getOccupiedStay = (roomName) => {
    return stayManagement.find(s => s.room_name === roomName && s.status === 'Admitted');
  };

  const handleStatusChange = (sessionId, e) => {
    onUpdateDetoxStatus(sessionId, e.target.value);
  };

  const activeDetoxes = detoxSessions.filter(d => d.status !== 'Completed');

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Detox Therapy & Stay Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage active therapies, room assignments, and nursing checklists.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Detox Scheduling Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Therapy Procedures Queue</h3>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto">
            {activeDetoxes.map(session => {
              const pt = patients.find(p => p.id === session.patient_id) || {};
              return (
                <div key={session.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-slate-800 block text-sm">{pt.name}</strong>
                      <span className="text-xs text-slate-500 font-medium">Session: {session.type}</span>
                    </div>
                    <span className="text-xs font-bold bg-white border border-slate-200 text-emerald-700 px-2.5 py-1 rounded-md shadow-sm">
                      {session.scheduled_date}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Tech: {session.technician}</span>
                    <select
                      value={session.status}
                      onChange={(e) => handleStatusChange(session.id, e)}
                      className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium cursor-pointer"
                    >
                      <option>Scheduled</option>
                      <option>In-Progress</option>
                      <option>Completed</option>
                    </select>
                  </div>
                </div>
              );
            })}
            {activeDetoxes.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                No active detox sessions scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: One Day Stay Bed Board */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-800">One-Day Stay Bed Board</h3>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto">
            {roomsList.map(room => {
              const activeStay = getOccupiedStay(room.name);
              const pt = activeStay ? patients.find(p => p.id === activeStay.patient_id) || {} : null;
              const checklist = activeStay ? activeStay.nursing_checklist : {};

              return (
                <div key={room.id} className={`p-4 border rounded-xl transition-all ${
                  activeStay ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <BedDouble className={`w-4 h-4 ${activeStay ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {room.name}
                    </h4>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      activeStay ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {activeStay ? 'Occupied' : 'Available'}
                    </span>
                  </div>

                  {activeStay && pt ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-emerald-100">
                        <div>
                          <span className="text-sm font-bold text-slate-800 block">{pt.name}</span>
                          <span className="text-xs text-slate-500">ID: {pt.id} • Admitted: {activeStay.check_in_time.split(' ')[1]}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                          Nursing Progress Checklist
                        </span>
                        
                        <button onClick={() => onUpdateNursingChecklist(activeStay.id, 'vitals_checked_morning')} className="w-full flex items-center gap-2 text-sm text-slate-700 hover:bg-white p-1.5 rounded-lg transition-colors">
                          {checklist.vitals_checked_morning ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                          Vitals Checked
                        </button>
                        <button onClick={() => onUpdateNursingChecklist(activeStay.id, 'detox_liquids_served')} className="w-full flex items-center gap-2 text-sm text-slate-700 hover:bg-white p-1.5 rounded-lg transition-colors">
                          {checklist.detox_liquids_served ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                          Detox Liquids Served
                        </button>
                        <button onClick={() => onUpdateNursingChecklist(activeStay.id, 'post_procedure_bath')} className="w-full flex items-center gap-2 text-sm text-slate-700 hover:bg-white p-1.5 rounded-lg transition-colors">
                          {checklist.post_procedure_bath ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                          Post-Procedure Bath
                        </button>
                        <button onClick={() => onUpdateNursingChecklist(activeStay.id, 'resting_comfortably')} className="w-full flex items-center gap-2 text-sm text-slate-700 hover:bg-white p-1.5 rounded-lg transition-colors">
                          {checklist.resting_comfortably ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                          Resting Comfortably
                        </button>
                      </div>

                      <button
                        onClick={() => onDischargePatient(activeStay.id, room.id)}
                        className="w-full mt-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Process Discharge
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 text-sm text-slate-500">
                      <p className="italic">Room is clean and ready for admission.</p>
                      
                      {/* Temporary admit button for demo */}
                      <button
                        onClick={() => {
                          const admitPt = patients[1]; // Sarah
                          onAdmitPatient({
                            id: `STAY-${500 + stayManagement.length + 1}`,
                            patient_id: admitPt.id,
                            room_name: room.name,
                            check_in_time: new Date().toISOString().replace('T', ' ').substring(0, 16),
                            status: 'Admitted',
                            nursing_checklist: {
                              vitals_checked_morning: false, detox_liquids_served: false, post_procedure_bath: false, resting_comfortably: false
                            },
                            notes: 'Patient admitted directly from reception.'
                          }, room.id);
                        }}
                        className="mt-4 w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                      >
                        Admit Patient (Demo)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
