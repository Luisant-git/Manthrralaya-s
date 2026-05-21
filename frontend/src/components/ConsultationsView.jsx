import React, { useState } from 'react';
import { Stethoscope, Activity, ClipboardList, PenTool, Save, CheckCircle } from 'lucide-react';

export default function ConsultationsView({ appointments, patients, doctors, onAddConsultation, onAddPrescription, onAddDietChart, activeRole }) {
  const [selectedApptId, setSelectedApptId] = useState('');
  
  // Forms states
  const [consultationNotes, setConsultationNotes] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [detoxProcedure, setDetoxProcedure] = useState('');
  
  // Prescription sub-form
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [homeCare, setHomeCare] = useState('');
  
  // Diet Chart sub-form
  const [diet, setDiet] = useState({ morning: '', breakfast: '', lunch: '', evening: '', dinner: '', remarks: '' });
  
  // Detox Recommended flag
  const [detoxRecommended, setDetoxRecommended] = useState(false);
  const [detoxType, setDetoxType] = useState('Deep Tissue Cell Detox');

  // Only show "Checked-in" appointments for doctor to consult
  const pendingConsults = appointments.filter(a => a.status === 'Checked-in');
  const activeAppt = pendingConsults.find(a => a.id === selectedApptId);
  const activePt = activeAppt ? patients.find(p => p.id === activeAppt.patient_id) : null;

  const handleAddMed = () => setMeds([...meds, { name: '', dosage: '', frequency: '', duration: '' }]);
  
  const handleMedChange = (index, field, value) => {
    const updated = [...meds];
    updated[index][field] = value;
    setMeds(updated);
  };

  const handleCompleteConsultation = () => {
    if (!activeAppt) return;
    
    const doctorName = activeAppt.doctor_name || 'Dr. Evelyn Carter';

    // 1. Create Consultation Log
    const newCons = {
      id: `C-${300 + Math.floor(Math.random()*100)}`,
      patient_id: activePt.id,
      doctor_name: doctorName,
      date: new Date().toISOString().split('T')[0],
      consultation_notes: consultationNotes,
      medical_history: medicalHistory,
      detox_procedure: detoxProcedure,
      detox_recommended: detoxRecommended,
      detox_type: detoxRecommended ? detoxType : null
    };

    // 2. Create Prescription if meds exist
    if (meds[0].name !== '') {
      const newPresc = {
        id: `RX-${700 + Math.floor(Math.random()*100)}`,
        patient_id: activePt.id,
        doctor_name: doctorName,
        date: new Date().toISOString().split('T')[0],
        medicines: meds.filter(m => m.name !== ''),
        home_care: homeCare
      };
      onAddPrescription(newPresc);
    }

    // 3. Create Diet Chart if filled
    if (diet.breakfast !== '') {
      const newDiet = {
        id: `DC-${600 + Math.floor(Math.random()*100)}`,
        patient_id: activePt.id,
        date: new Date().toISOString().split('T')[0],
        meals: diet,
        remarks: diet.remarks
      };
      onAddDietChart(newDiet);
    }

    onAddConsultation(newCons, activeAppt.id);
    setSelectedApptId('');
    
    // Reset forms
    setConsultationNotes('');
    setMedicalHistory('');
    setDetoxProcedure('');
    setMeds([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setHomeCare('');
    setDiet({ morning: '', breakfast: '', lunch: '', evening: '', dinner: '', remarks: '' });
    setDetoxRecommended(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Clinical Consultations
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Doctor workspace for logging vitals, prescriptions, and detox therapy assignments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Waiting Queue */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm h-fit">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" /> Waiting Room Queue
          </h3>
          <div className="space-y-3">
            {pendingConsults.map(appt => {
              const pt = patients.find(p => p.id === appt.patient_id) || {};
              return (
                <button
                  key={appt.id}
                  onClick={() => setSelectedApptId(appt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    selectedApptId === appt.id
                      ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-slate-800 text-sm">{pt.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{appt.time} • {pt.age} yrs, {pt.gender}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">Assigned to: {appt.doctor_name || 'Dr. Evelyn Carter'}</div>
                </button>
              );
            })}
            {pendingConsults.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm italic">
                No patients currently checked-in.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Consultation Forms */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {activeAppt && activePt ? (
            <div className="divide-y divide-slate-100">
              
              {/* Header Info */}
              <div className="p-5 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{activePt.name}</h2>
                  <span className="text-sm text-slate-500">ID: {activePt.id} • Conditions: {activePt.medical_conditions}</span>
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold border border-emerald-200">
                  Consultation in Progress
                </div>
              </div>

              {/* 1. Clinical Consultation Notes */}
              <div className="p-5 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> 1. Clinical Consultation Notes
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Notes</label>
                  <textarea rows="3" value={consultationNotes} onChange={e => setConsultationNotes(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" placeholder="Document chief complaint, exam findings, and clinical plan..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Medical History</label>
                  <textarea rows="3" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" placeholder="Summarize past history, medications, allergies, and chronic conditions..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Detox Procedure Logging</label>
                  <textarea rows="3" value={detoxProcedure} onChange={e => setDetoxProcedure(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" placeholder="Record selected detox procedure details, steps, and patient response..."></textarea>
                </div>
              </div>

              {/* 2. Medical Prescription */}
              <div className="p-5 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-600" /> 2. Medical Prescription
                </h3>
                <div className="space-y-3">
                  {meds.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-3">
                      <input type="text" placeholder="Medicine Name" value={med.name} onChange={e => handleMedChange(idx, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      <input type="text" placeholder="Dosage" value={med.dosage} onChange={e => handleMedChange(idx, 'dosage', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      <input type="text" placeholder="Frequency" value={med.frequency} onChange={e => handleMedChange(idx, 'frequency', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      <input type="text" placeholder="Duration" value={med.duration} onChange={e => handleMedChange(idx, 'duration', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                  ))}
                  <button onClick={handleAddMed} className="text-emerald-600 font-bold text-sm hover:underline">+ Add Medicine Row</button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Home Care Guidelines</label>
                  <input type="text" value={homeCare} onChange={e => setHomeCare(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>

              {/* 3. Detox Recommendation */}
              <div className="p-5 bg-emerald-50 border-y border-emerald-100">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="detoxCheck" checked={detoxRecommended} onChange={e => setDetoxRecommended(e.target.checked)} className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500" />
                  <label htmlFor="detoxCheck" className="font-bold text-slate-800 text-sm">Recommend Clinical Detox Session</label>
                </div>
                {detoxRecommended && (
                  <div className="mt-3 ml-8">
                    <select value={detoxType} onChange={e => setDetoxType(e.target.value)} className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                      <option>Deep Tissue Cell Detox</option>
                      <option>Liver Flushing Protocol</option>
                      <option>Gut Microbiome Reset</option>
                    </select>
                    <p className="text-xs text-emerald-700 mt-1.5 font-medium">Selecting this automatically pushes the patient to the Detox Scheduling queue.</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="p-5 bg-slate-50 flex justify-end">
                <button
                  onClick={handleCompleteConsultation}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save & Finalize Consultation
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Stethoscope className="w-12 h-12 text-slate-300" />
              <p className="text-base font-medium">Select a patient from the waiting queue to begin consultation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
