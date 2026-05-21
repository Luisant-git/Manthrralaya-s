import React, { useState, useRef } from 'react';
import { Stethoscope, Activity, ClipboardList, Save, CheckCircle } from 'lucide-react';

export default function ConsultationsView({ appointments, patients, doctors, consultations, dietCharts, onAddConsultation, onAddDietChart, activeRole }) {
  const [selectedApptId, setSelectedApptId] = useState('');
  const [selectedTab, setSelectedTab] = useState('consultation');
  
  // Forms states
  const [consultationNotes, setConsultationNotes] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [detoxProcedure, setDetoxProcedure] = useState('');
  const [dietPlanNote, setDietPlanNote] = useState('');
  const [homeCare, setHomeCare] = useState('');
  
  const consultationEditorRef = useRef(null);
  const medicalHistoryEditorRef = useRef(null);
  const detoxProcedureEditorRef = useRef(null);
  const dietPlanEditorRef = useRef(null);

  const applyEditorCommand = (command, value, editorRef, setter) => {
    if (!editorRef?.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setter(editorRef.current.innerHTML);
  };

  const handleFontSizeChange = (e, editorRef, setter) => {
    if (!editorRef?.current) return;
    const fontSize = e.target.value;
    if (!fontSize) return;
    
    editorRef.current.focus();
    document.execCommand('styleWithCSS', false, true);
    
    let fontSizeValue = '3';
    switch(fontSize) {
      case '12px': fontSizeValue = '1'; break;
      case '14px': fontSizeValue = '2'; break;
      case '16px': fontSizeValue = '3'; break;
      case '18px': fontSizeValue = '4'; break;
      case '20px': fontSizeValue = '5'; break;
      case '24px': fontSizeValue = '6'; break;
      case '32px': fontSizeValue = '7'; break;
      default: fontSizeValue = '3';
    }
    
    document.execCommand('fontSize', false, fontSizeValue);
    
    const fontElements = editorRef.current.querySelectorAll('font[size]');
    fontElements.forEach(el => {
      const span = document.createElement('span');
      let size = el.getAttribute('size');
      let pxValue = '16px';
      switch(size) {
        case '1': pxValue = '12px'; break;
        case '2': pxValue = '14px'; break;
        case '3': pxValue = '16px'; break;
        case '4': pxValue = '18px'; break;
        case '5': pxValue = '20px'; break;
        case '6': pxValue = '24px'; break;
        case '7': pxValue = '32px'; break;
        default: pxValue = '16px';
      }
      span.style.fontSize = pxValue;
      span.innerHTML = el.innerHTML;
      el.parentNode.replaceChild(span, el);
    });
    
    setter(editorRef.current.innerHTML);
    e.target.value = '';
  };

  // Diet Chart sub-form
  const [diet, setDiet] = useState({ morning: '', breakfast: '', lunch: '', evening: '', dinner: '', remarks: '' });
  
  // Detox Recommended flag
  const [detoxRecommended, setDetoxRecommended] = useState(false);
  const [detoxType, setDetoxType] = useState('Deep Tissue Cell Detox');
  const [detoxDoctorId, setDetoxDoctorId] = useState(doctors[0]?.id || '');

  // Only show "Checked-in" appointments for doctor to consult
  const pendingConsults = appointments.filter(a => a.status === 'Checked-in');
  const activeAppt = pendingConsults.find(a => a.id === selectedApptId);
  const activePt = activeAppt ? patients.find(p => p.id === activeAppt.patient_id) : null;

  const handleCompleteConsultation = () => {
    if (!activeAppt) return;
    
    const doctorName = activeAppt.doctor_name || 'Dr. Evelyn Carter';
    const detoxDoctor = doctors.find(d => d.id === detoxDoctorId);

    const newCons = {
      id: `C-${300 + Math.floor(Math.random() * 100)}`,
      patient_id: activePt.id,
      doctor_name: doctorName,
      date: new Date().toISOString().split('T')[0],
      consultation_notes: consultationNotes,
      medical_history: medicalHistory,
      detox_procedure: detoxProcedure,
      diet_plan_note: dietPlanNote,
      home_care: homeCare,
      detox_recommended: detoxRecommended,
      detox_type: detoxRecommended ? detoxType : null,
      detox_doctor_id: detoxRecommended ? detoxDoctorId : null,
      detox_doctor_name: detoxRecommended ? detoxDoctor?.name : null
    };

    if (diet.breakfast !== '') {
      const newDiet = {
        id: `DC-${600 + Math.floor(Math.random() * 100)}`,
        consultation_id: newCons.id,
        patient_id: activePt.id,
        date: new Date().toISOString().split('T')[0],
        doctor_name: doctorName,
        meals: diet,
        remarks: diet.remarks
      };
      onAddDietChart(newDiet);
    }

    onAddConsultation(newCons, activeAppt.id);
    setSelectedApptId('');
    
    setConsultationNotes('');
    setMedicalHistory('');
    setDetoxProcedure('');
    setDietPlanNote('');
    setHomeCare('');
    setDiet({ morning: '', breakfast: '', lunch: '', evening: '', dinner: '', remarks: '' });
    setDetoxRecommended(false);
    setDetoxType('Deep Tissue Cell Detox');
    setDetoxDoctorId(doctors[0]?.id || '');
  };

  const fontSizeOptions = [
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '32px', value: '32px' },
  ];

  // Reusable Editor Component with Word-style icons
  const RichTextEditor = ({ editorRef, content, setContent, placeholder }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex flex-wrap gap-2">
        <button 
          type="button" 
          onClick={() => applyEditorCommand('bold', null, editorRef, setContent)} 
          className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
        >
          Bold
        </button>
        <button 
          type="button" 
          onClick={() => applyEditorCommand('italic', null, editorRef, setContent)} 
          className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
        >
          Italic
        </button>
        <button 
          type="button" 
          onClick={() => applyEditorCommand('underline', null, editorRef, setContent)} 
          className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
        >
          Underline
        </button>
        
        <select
          onChange={(e) => handleFontSizeChange(e, editorRef, setContent)}
          className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>Font Size</option>
          {fontSizeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        {/* Word-style List Buttons */}
        <button 
          type="button" 
          onClick={() => applyEditorCommand('insertUnorderedList', null, editorRef, setContent)} 
          className="rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
          title="Bullet List"
        >
          <span className="text-base">•</span> Bullets
        </button>
        <button 
          type="button" 
          onClick={() => applyEditorCommand('insertOrderedList', null, editorRef, setContent)} 
          className="rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
          title="Numbered List"
        >
          <span className="text-xs font-bold">1.</span> Numbers
        </button>
        
        {/* Word-style Alignment Buttons */}
        <div className="flex gap-1 ml-1 border-l border-slate-200 pl-2">
          <button 
            type="button" 
            onClick={() => applyEditorCommand('justifyLeft', null, editorRef, setContent)} 
            className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
            title="Align Left"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Left
          </button>
          <button 
            type="button" 
            onClick={() => applyEditorCommand('justifyCenter', null, editorRef, setContent)} 
            className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
            title="Align Center"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Center
          </button>
          <button 
            type="button" 
            onClick={() => applyEditorCommand('justifyRight', null, editorRef, setContent)} 
            className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
            title="Align Right"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="9" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Right
          </button>
        </div>
      </div>
      
      <div
        ref={editorRef}
        contentEditable
        tabIndex={0}
        suppressContentEditableWarning
        onBlur={e => setContent(e.currentTarget.innerHTML)}
        className="editor-content min-h-[140px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {(!content || content === '<br>') && (
        <div className="text-slate-400 text-sm -mt-8 ml-3 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        /* Global styles for lists and editor content */
        .editor-content ul,
        .editor-content ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
        }
        
        .editor-content ul {
          list-style-type: disc;
        }
        
        .editor-content ol {
          list-style-type: decimal;
        }
        
        .editor-content li {
          margin-bottom: 0.25rem;
        }
        
        /* Style for the contenteditable editor */
        [contenteditable="true"] ul,
        [contenteditable="true"] ol {
          padding-left: 1.5rem;
        }
        
        [contenteditable="true"] ul {
          list-style-type: disc;
        }
        
        [contenteditable="true"] ol {
          list-style-type: decimal;
        }
        
        /* History view list styles */
        .history-list ul,
        .history-list ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
        }
        
        .history-list ul {
          list-style-type: disc;
        }
        
        .history-list ol {
          list-style-type: decimal;
        }
        
        .history-list li {
          margin-bottom: 0.25rem;
        }
      `}</style>
      
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

                <div className="p-5 flex flex-wrap items-center gap-3 bg-white border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedTab('consultation')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedTab === 'consultation' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Consultation
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTab('history')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedTab === 'history' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    History
                  </button>
                </div>

                {selectedTab === 'consultation' ? (
                  <>
                    {/* 1. Clinical Consultation Notes */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" /> 1. Clinical Consultation Notes
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Notes</label>
                        <RichTextEditor 
                          editorRef={consultationEditorRef}
                          content={consultationNotes}
                          setContent={setConsultationNotes}
                          placeholder="Enter consultation notes here..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Medical History</label>
                        <RichTextEditor 
                          editorRef={medicalHistoryEditorRef}
                          content={medicalHistory}
                          setContent={setMedicalHistory}
                          placeholder="Enter patient medical history..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Detox Procedure Note</label>
                        <RichTextEditor 
                          editorRef={detoxProcedureEditorRef}
                          content={detoxProcedure}
                          setContent={setDetoxProcedure}
                          placeholder="Enter detox procedure notes..."
                        />
                      </div>
                    </div>

                    {/* 2. Diet Plan Note */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-600" /> 2. Diet Plan Note
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Diet Plan Note</label>
                        <RichTextEditor 
                          editorRef={dietPlanEditorRef}
                          content={dietPlanNote}
                          setContent={setDietPlanNote}
                          placeholder="Enter diet plan notes..."
                        />
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
                        <label htmlFor="detoxCheck" className="font-bold text-slate-800 text-sm">Recommend Detox Doctor</label>
                      </div>
                      {detoxRecommended && (
                        <div className="mt-3 ml-8 space-y-3">
                          
                          <div className="space-y-2">
                          
                            <select value={detoxDoctorId} onChange={e => setDetoxDoctorId(e.target.value)} className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                              {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name} — {doc.designation}</option>
                              ))}
                            </select>
                          </div>
                          <p className="text-xs text-emerald-700 mt-1.5 font-medium">This will save the recommended detox provider and add it to your consultation history.</p>
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
                  </>
                ) : (
                  <div className="p-5 space-y-4 consultation-history">
                    <h3 className="text-lg font-bold text-slate-800">Patient Consultation History</h3>
                    <p className="text-sm text-slate-500">{activePt ? `Showing history for ${activePt.name}.` : 'Showing all completed consultations.'}</p>
                    <div className="space-y-4">
                      {consultations.filter(c => !activePt || c.patient_id === activePt.id).sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
                        const pt = patients.find(p => p.id === record.patient_id) || {};
                        const detoxDoc = doctors.find(d => d.id === record.detox_doctor_id);
                        const linkedDiet = dietCharts.find(d => d.consultation_id === record.id);
                        return (
                          <div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                              <div>
                                <div className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">{record.date}</div>
                                <h4 className="text-xl font-bold text-slate-900 mt-1">{pt.name || 'Unknown Patient'}</h4>
                                <div className="text-sm text-slate-600">Patient ID: {pt.id || 'N/A'} • {pt.age || '--'} yrs • {pt.gender || '--'}</div>
                              </div>
                              <div className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                Provider: {record.doctor_name || 'Dr. Evelyn Carter'}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">Consultation Notes</div>
                                  <div
                                    className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                    dangerouslySetInnerHTML={{ __html: record.consultation_notes || '<p class="text-slate-500">No notes recorded.</p>' }}
                                  />
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">Medical History</div>
                                  <div
                                    className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                    dangerouslySetInnerHTML={{ __html: record.medical_history || '<p class="text-slate-500">No history recorded.</p>' }}
                                  />
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">Diet Plan Note</div>
                                  <div
                                    className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                    dangerouslySetInnerHTML={{ __html: record.diet_plan_note || '<p class="text-slate-500">No diet plan note.</p>' }}
                                  />
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">Detox Recommendation</div>
                                  <div className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800">
                                    {record.detox_recommended ? (
                                      <>
                                        <div className="font-semibold">Type: {record.detox_type}</div>
                                        <div>Doctor: {detoxDoc ? detoxDoc.name : record.detox_doctor_name || 'Not assigned'}</div>
                                      </>
                                    ) : (
                                      <div className="text-slate-500">No detox recommended.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {linkedDiet && (
                              <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800">
                                <div className="font-semibold mb-2">Diet Chart from Consultation</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                                  <div><span className="font-semibold">Morning:</span> {linkedDiet.meals.morning}</div>
                                  <div><span className="font-semibold">Breakfast:</span> {linkedDiet.meals.breakfast}</div>
                                  <div><span className="font-semibold">Lunch:</span> {linkedDiet.meals.lunch}</div>
                                  <div><span className="font-semibold">Evening:</span> {linkedDiet.meals.evening}</div>
                                  <div><span className="font-semibold">Dinner:</span> {linkedDiet.meals.dinner}</div>
                                  <div className="md:col-span-2"><span className="font-semibold">Remarks:</span> {linkedDiet.remarks}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {consultations.filter(c => !activePt || c.patient_id === activePt.id).length === 0 && (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 text-center text-slate-500">
                          No consultation history found yet. Complete a consultation to see it here.
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
    </>
  );
}