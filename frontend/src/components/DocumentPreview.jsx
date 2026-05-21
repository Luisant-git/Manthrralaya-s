import React, { useState } from 'react';
import { FileText, Printer } from 'lucide-react';

export default function DocumentPreview({
  prescriptions,
  dietCharts,
  patients,
  onClose
}) {
  const [activeDocType, setActiveDocType] = useState('prescription');
  const [selectedPatientId, setSelectedPatientId] = useState(patients[1]?.id || ''); 

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0] || {};
  const activePrescription = prescriptions.find(pr => pr.patient_id === activePatient.id) || prescriptions[0] || {};
  const activeDiet = dietCharts.find(d => d.patient_id === activePatient.id) || dietCharts[0] || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Document Generation Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure, preview, and download print-ready clinic documentation.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> Print Document
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Document Config Panel */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm h-fit space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Patient File</label>
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

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Available Documents</label>
            <div className="space-y-2">
              <button
                onClick={() => setActiveDocType('prescription')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-colors ${
                  activeDocType === 'prescription'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" /> Medical Prescription
              </button>
              <button
                onClick={() => setActiveDocType('diet')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-colors ${
                  activeDocType === 'diet'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" /> Customized Diet Chart
              </button>
              <button
                onClick={() => setActiveDocType('homecare')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-colors ${
                  activeDocType === 'homecare'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" /> Home Care Guidelines
              </button>
            </div>
          </div>
        </div>

        {/* Live A4 Print Canvas */}
        <div className="lg:col-span-3 bg-white text-slate-900 p-10 rounded-xl shadow-md border border-slate-300 w-full max-w-[750px] mx-auto aspect-[1/1.414] print:m-0 print:border-none print:shadow-none print:p-0">
          
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6 mb-8">
            <div className="text-left">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-outfit m-0">
                ✚ {"Manthrralaya's"} Wellness
              </h2>
              <span className="text-xs uppercase font-bold tracking-widest text-slate-500 block mt-1">
                Advanced Metabolic & Gut Care Clinic
              </span>
              <span className="text-[10px] text-slate-500 block mt-1.5">
                Suite 404, Green Park Road, Bangalore • +91 99988 87766 • connect@manthrralayas.co
              </span>
            </div>
            <div className="text-right text-[10px] text-slate-500 font-bold uppercase space-y-1">
              <div>Clinic Code: BLR-809</div>
              <div>License: MD-KA-99120</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg text-left text-sm mb-8 border border-slate-200">
            <div>
              <span className="text-slate-500 text-[10px] block font-bold uppercase mb-0.5">Patient Name:</span>
              <strong className="text-slate-800">{activePatient.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-bold uppercase mb-0.5">Demographics:</span>
              <strong className="text-slate-800">{activePatient.age} yrs • {activePatient.gender}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-bold uppercase mb-0.5">Blood / Weight:</span>
              <strong className="text-slate-800">{activePatient.blood_group || 'O+'} • {activePrescription.weight || '70 kg'}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px] block font-bold uppercase mb-0.5">Date Issued:</span>
              <strong className="text-slate-800">{activePrescription.date || new Date().toISOString().split('T')[0]}</strong>
            </div>
          </div>

          {activeDocType === 'prescription' && (
            <div className="space-y-8 text-left text-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-2 mb-3 uppercase tracking-wide">
                  Clinical Diagnosis & Rx
                </h3>
                <p className="text-slate-700 italic">
                  Diagnosed with: {activePatient.medical_conditions || 'Digestive dysfunction & metabolic slug'}. Recommending structural colon reset therapy and liver detox protocol.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-2 mb-3 uppercase tracking-wide">
                  Prescribed Herbal Therapeutics
                </h3>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-600 font-bold uppercase text-xs">
                      <th className="py-2">Formulation</th>
                      <th className="py-2">Dosage</th>
                      <th className="py-2">Administration Frequency</th>
                      <th className="py-2 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(activePrescription.medicines || []).map((med, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-bold text-slate-800">{med.name}</td>
                        <td className="py-3 text-slate-700">{med.dosage}</td>
                        <td className="py-3 text-slate-700">{med.frequency}</td>
                        <td className="py-3 text-slate-700 text-right">{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-2 mb-3 uppercase tracking-wide">
                  Home Care Directives
                </h3>
                <p className="text-slate-700">
                  {activePrescription.home_care || 'Rest after procedures. Drink warm lemon water with ginger. Perform light walking.'}
                </p>
              </div>
            </div>
          )}

          {activeDocType === 'diet' && (
            <div className="space-y-8 text-left text-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-2 mb-3 uppercase tracking-wide">
                  Customized Metabolic Reset Diet
                </h3>
                <p className="text-slate-700 italic">
                  This menu is tailored specifically to lower blood glucose, restore optimal gut bacteria pH, and support hepatocyte recovery.
                </p>
              </div>

              {activeDiet.meals ? (
                <div className="space-y-0">
                  <div className="grid grid-cols-3 border-b border-slate-200 py-3">
                    <span className="font-bold text-slate-800">06:30 AM (Upon Waking):</span>
                    <span className="col-span-2 text-slate-700">{activeDiet.meals.morning}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-200 py-3">
                    <span className="font-bold text-slate-800">09:00 AM (Breakfast):</span>
                    <span className="col-span-2 text-slate-700">{activeDiet.meals.breakfast}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-200 py-3">
                    <span className="font-bold text-slate-800">01:30 PM (Lunch):</span>
                    <span className="col-span-2 text-slate-700">{activeDiet.meals.lunch}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-200 py-3">
                    <span className="font-bold text-slate-800">05:00 PM (Evening):</span>
                    <span className="col-span-2 text-slate-700">{activeDiet.meals.evening}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-200 py-3">
                    <span className="font-bold text-slate-800">07:30 PM (Dinner):</span>
                    <span className="col-span-2 text-slate-700">{activeDiet.meals.dinner}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">No diet chart issued.</p>
              )}

              <div className="pt-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-2 mb-3 uppercase tracking-wide">
                  Dietary Restrictions & Guidelines
                </h3>
                <p className="text-slate-700 font-bold">
                  {activeDiet.remarks || 'Strictly adhere to organic produce and zero refined seed oils.'}
                </p>
              </div>
            </div>
          )}

          {activeDocType === 'homecare' && (
            <div className="space-y-8 text-left text-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-2 mb-3 uppercase tracking-wide">
                  Post-Procedure Detox Home Care
                </h3>
                <p className="text-slate-700">
                  Following colon cleanse hydrotherapy or a heavy metal liver flush, your body undergoes cellular rebuilding. 
                  Please closely follow these safety and optimization guidelines over the next 72 hours.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <strong className="text-slate-800 block mb-1.5">💦 Hydration Protocol</strong>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    Drink 3.5 liters of filtered warm water daily. You may add organic sea salt or lemon juice.
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <strong className="text-slate-800 block mb-1.5">🧘 physical Exertion</strong>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    Strictly avoid intense resistance workouts. Do 15 minutes of slow breathing and light walking.
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <strong className="text-slate-800 block mb-1.5">💤 Rest & Recharge</strong>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    Prioritize 8+ hours of sleep. Use warm magnesium-salt foot baths before bedtime to quiet the central nervous system.
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <strong className="text-slate-800 block mb-1.5">⚠️ Detox Reactions</strong>
                  <span className="text-slate-600 text-sm leading-relaxed">
                    Mild headaches, fatigue, or loose stools are normal. If you experience severe nausea, contact our WhatsApp hotline.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-slate-300 flex items-center justify-between">
            <div className="text-left text-xs text-slate-500">
              <div>Document generated by {"Manthrralaya's"} Engine.</div>
              <div>Verification Hash: SHA256-60199120B44</div>
            </div>
            <div className="text-right">
              <div className="font-serif italic text-slate-800 text-lg font-bold">{activePrescription.doctor_name || 'Dr. Evelyn Carter'}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Authorized Clinic Physician</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
