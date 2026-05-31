import React, { useState, useRef, useEffect } from 'react';
import { Stethoscope, Activity, ClipboardList, Save, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ConsultationsView({ appointments, patients, doctors, consultations, dietCharts, onAddConsultation, onAddDietChart, activeRole, currentUser }) {
  const [selectedApptId, setSelectedApptId] = useState('');
  const [selectedTab, setSelectedTab] = useState('consultation');
  const [historyPage, setHistoryPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [historyAppended, setHistoryAppended] = useState(false);
  
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
  const [detoxDoctorId, setDetoxDoctorId] = useState('');
  const [detoxFollowupDate, setDetoxFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [detoxFollowupRemarks, setDetoxFollowupRemarks] = useState('');
  const todayDate = new Date().toISOString().split('T')[0];

  const isDetoxAppointment = (appt) => {
    return String(appt?.appointmentType || '').toLowerCase().includes('detox');
  };

  const isDoctorView = activeRole === 'doctor';

  // Find current doctor - Match from doctors list or fallback to appointments data
  let currentDoctor = isDoctorView
    ? doctors.find(d => {
        const doctorEmail = (d.user?.email || d.email || '').toLowerCase();
        const doctorName = (d.user?.fullName || d.name || '').toLowerCase();
        const currentUserLower = String(currentUser || '').toLowerCase();
        return doctorEmail === currentUserLower || doctorName === currentUserLower;
      })
    : null;

  // FALLBACK: Identify doctor from appointments if doctors list is empty
  if (isDoctorView && !currentDoctor && appointments && appointments.length > 0) {
    const aptWithDoctor = appointments.find(a => {
      const dEmail = (a.doctor?.user?.email || '').toLowerCase();
      const dName = (a.doctor?.user?.fullName || a.doctor?.name || '').toLowerCase();
      const currentUserLower = String(currentUser || '').toLowerCase();
      return dEmail === currentUserLower || dName === currentUserLower;
    });
    if (aptWithDoctor && aptWithDoctor.doctor) {
      currentDoctor = { ...aptWithDoctor.doctor, name: aptWithDoctor.doctor.user?.fullName || aptWithDoctor.doctor.name };
    }
  }

  const currentDoctorId = currentDoctor && currentDoctor.id ? Number(currentDoctor.id) : null;

  // Create a robust list of doctors for assignment (Master list + Extraction from Appointments)
  // Filter to show only 'Available' doctors
  let availableDoctors = doctors ? doctors.filter(d => d.status === 'Available') : [];
  
  // FALLBACK: If master list is empty (403 error) or incomplete,
  // extract all unique available doctors from the appointments data.
  if (appointments && appointments.length > 0) {
    appointments.forEach(a => {
      const doc = a.doctor;
      if (doc && doc.id && doc.status === 'Available') {
        if (!availableDoctors.some(d => String(d.id) === String(doc.id))) {
          availableDoctors.push({
            ...doc,
            name: doc.user?.fullName || doc.name || `Doctor ${doc.id}`
          });
        }
      }
    });
  }

  // Ensure current doctor is included if not found yet
  if (currentDoctor && !availableDoctors.some(d => String(d.id) === String(currentDoctor.id))) {
    availableDoctors.push(currentDoctor);
  }

  // Automatically default the detox doctor to the current doctor if nothing is selected
  useEffect(() => {
    if (detoxRecommended && !detoxDoctorId && currentDoctorId) {
      setDetoxDoctorId(String(currentDoctorId));
    }
  }, [detoxRecommended, currentDoctorId]);

  // Get today's appointments that are checked-in and ready for consultation
  const pendingConsults = appointments.filter(a => {
    const apptDate = a.date || (a.appointmentDate ? new Date(a.appointmentDate).toISOString().split('T')[0] : '');
    const isReady = isDoctorView ? a.status === 'Checked-in' : (a.status === 'Checked-in' || a.status === 'Arrived');
    const isToday = apptDate === todayDate;
    const isNotDetox = !isDetoxAppointment(a);
    
    if (!isReady || !isToday || !isNotDetox) return false;

    // Strict doctor filtering for doctor role
    if (isDoctorView) {
      if (!currentDoctorId) return false;
      const appointmentDoctorIdNum = Number(a.doctor_id ?? a.doctorId ?? a.doctor?.id);
      return appointmentDoctorIdNum === currentDoctorId;
    }

    return true;
  });
  
  const activeAppt = pendingConsults.find(a => String(a.id) === String(selectedApptId)) || pendingConsults[0];
  const activePt = activeAppt 
    ? (patients.find(p => String(p.id) === String(activeAppt.patient_id || activeAppt.patientId)) || 
       activeAppt.patient || 
       activeAppt.Patient) 
    : null;
  const patientHistory = activePt ? consultations.filter(c => c.patient_id === activePt.id).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];

  useEffect(() => {
    if (!selectedApptId && pendingConsults.length > 0) {
      setSelectedApptId(pendingConsults[0].id);
    }
  }, [pendingConsults, selectedApptId]);
  
  const latestHistory = patientHistory[0] || null;
  const historyPageSize = 1;
  const historyRecords = consultations.filter(c => !activePt || String(c.patient_id) === String(activePt.id)).sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalHistoryPages = Math.max(1, Math.ceil(historyRecords.length / historyPageSize));
  const pagedHistory = historyRecords.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  useEffect(() => {
    setHistoryPage(1);
  }, [activePt?.id, selectedTab]);

  useEffect(() => {
    setHistoryAppended(false);
  }, [activeAppt?.id]);

  const appendLatestHistoryToCurrent = () => {
    if (!latestHistory) return;
    if (historyAppended) {
      toast.info('Latest history notes have already been added to this form.');
      return;
    }
    setConsultationNotes(prev => `${prev || ''}${prev ? '<br/><br/>' : ''}${latestHistory.consultation_notes || ''}`);
    setMedicalHistory(prev => `${prev || ''}${prev ? '<br/><br/>' : ''}${latestHistory.medical_history || ''}`);
    setDietPlanNote(prev => `${prev || ''}${prev ? '<br/><br/>' : ''}${latestHistory.diet_plan_note || ''}`);
    setDetoxProcedure(prev => `${prev || ''}${prev ? '<br/><br/>' : ''}${latestHistory.detox_procedure || ''}`);
    setHistoryAppended(true);
    toast.success('Previous history notes appended.');
  };

  const handleCompleteConsultation = async () => {
    if (!activeAppt || !activePt) return;
    setIsSaving(true);
    
    try {
      const doctorName = activeAppt.doctor_name || currentDoctor?.name || activeAppt.doctor?.user?.fullName || activeAppt.doctor?.name || 'Assigned Provider';
      const doctorId = activeAppt.doctor_id || activeAppt.doctorId || currentDoctorId;
      const selectedDetoxDoctor = availableDoctors.find(d => String(d.id) === String(detoxDoctorId));
      
      const newCons = {
        patient_id: Number(activePt.id),
        patient_name: activePt.name,
        doctor_id: doctorId ? Number(doctorId) : null,
        doctor_name: doctorName,
        date: new Date().toISOString().split('T')[0],
        consultation_notes: consultationNotes,
        medical_history: medicalHistory,
        detox_procedure: detoxProcedure,
        diet_plan_note: dietPlanNote,
        home_care: homeCare,
        detox_recommended: detoxRecommended,
        detox_doctor_id: detoxRecommended && detoxDoctorId ? parseInt(detoxDoctorId) : null,
        detox_doctor_name: detoxRecommended && selectedDetoxDoctor ? selectedDetoxDoctor.name : null,
        followup_date: detoxRecommended ? detoxFollowupDate : null,
        followup_remarks: detoxRecommended ? detoxFollowupRemarks : null
      };

      // Update parent state
      const savedConsultation = await onAddConsultation(newCons, activeAppt.id);

      if (diet.breakfast !== '') {
        onAddDietChart({
          id: `DC-${Date.now()}`,
          consultation_id: savedConsultation?.id,
          patient_id: activePt.id,
          date: new Date().toISOString().split('T')[0],
          doctor_name: doctorName,
          meals: diet,
          remarks: diet.remarks
        });
      }
      
      // Reset form
      setSelectedApptId('');
      setConsultationNotes('');
      setMedicalHistory('');
      setDetoxProcedure('');
      setDietPlanNote('');
      setHomeCare('');
      setDiet({ morning: '', breakfast: '', lunch: '', evening: '', dinner: '', remarks: '' });
      setDetoxRecommended(false);
      setDetoxDoctorId('');
      setDetoxFollowupDate(new Date().toISOString().split('T')[0]);
      setDetoxFollowupRemarks('');
    } catch (error) {
      console.error('Error saving consultation:', error);
    } finally {
      setIsSaving(false);
    }
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
        .editor-content ul, .editor-content ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
        }
        .editor-content ul { list-style-type: disc; }
        .editor-content ol { list-style-type: decimal; }
        .editor-content li { margin-bottom: 0.25rem; }
        [contenteditable="true"] ul, [contenteditable="true"] ol { padding-left: 1.5rem; }
        [contenteditable="true"] ul { list-style-type: disc; }
        [contenteditable="true"] ol { list-style-type: decimal; }
        .history-list ul, .history-list ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
        }
        .history-list ul { list-style-type: disc; }
        .history-list ol { list-style-type: decimal; }
        .history-list li { margin-bottom: 0.25rem; }
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
            <p className="text-sm text-slate-500 mb-4">These patients are checked in and ready for consultation.</p>
            <div className="space-y-3">
              {pendingConsults.map(appt => {
                const pt = patients.find(p => String(p.id) === String(appt.patient_id || appt.patientId)) || 
                           appt.patient || 
                           appt.Patient || 
                           {};
                return (
                  <button
                    key={appt.id}
                    onClick={() => setSelectedApptId(appt.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                      String(selectedApptId) === String(appt.id)
                        ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{pt.name || pt.fullName || 'Unknown Patient'}</div>
                        <div className="text-xs text-slate-500 mt-1">{pt.age} yrs, {pt.gender}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-wider">
                      Assigned to: {appt.doctor_name || 'Assigned Provider'}
                    </div>
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
                    <span className="text-sm text-slate-500">ID: P-{activePt.id} • Phone: {activePt.phone?.replace(/\D/g, '').slice(-10)}</span>
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
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <label className="block text-xs font-semibold text-slate-600">Consultation Notes</label>
                          <button
                            type="button"
                            onClick={appendLatestHistoryToCurrent}
                            disabled={!latestHistory}
                            className={`text-xs font-semibold ${historyAppended ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'} disabled:text-slate-400`}
                          >
                            {latestHistory ? (historyAppended ? 'Latest history already added' : 'Add latest history notes') : 'No previous history available'}
                          </button>
                        </div>
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
                        <label htmlFor="detoxCheck" className="font-bold text-slate-800 text-sm">Recommend Detox Program</label>
                      </div>
                      {detoxRecommended && (
                        <div className="mt-3 ml-8 space-y-3">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {/* Detox Doctor Dropdown - From Master */}
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600">Assign Detox Doctor</label>
                              <select 
                                value={detoxDoctorId} 
                                onChange={e => setDetoxDoctorId(e.target.value)} 
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="">Select Detox Doctor</option>
                                {availableDoctors.length > 0 ? (
                                  availableDoctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                      Dr. {doc.name || doc.user?.fullName} — {doc.specialization || 'General'}
                                    </option>
                                  ))
                                ) : (
                                  <option disabled>No doctors available</option>
                                )}
                              </select>
                            </div>
                            
                            {/* Follow-up Date */}
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600">Follow-up Date</label>
                              <input
                                type="date"
                                value={detoxFollowupDate}
                                onChange={e => setDetoxFollowupDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-slate-600">Remarks for Receptionist</label>
                            <textarea
                              value={detoxFollowupRemarks}
                              onChange={e => setDetoxFollowupRemarks(e.target.value)}
                              rows={3}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              placeholder="Enter any special instructions for the receptionist..."
                            />
                          </div>
                          <p className="text-xs text-emerald-700 mt-1.5 font-medium">These follow-up details will be sent to reception so they can call the patient later.</p>
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    <div className="p-5 bg-slate-50 flex justify-end">
                      <button
                        onClick={handleCompleteConsultation}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Save & Finalize Consultation
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-5 space-y-4 consultation-history">
                    <h3 className="text-lg font-bold text-slate-800">Patient Consultation History</h3>
                    <p className="text-sm text-slate-500">{activePt ? `Showing history for ${activePt.name}.` : 'Showing all completed consultations.'}</p>
                    <div className="space-y-4">
                      {pagedHistory.map(record => {
                        const pt = (activePt && String(activePt.id) === String(record.patient_id)) ? activePt : (patients.find(p => String(p.id) === String(record.patient_id)) || {});
                        return (
                          <div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                              <div>
                                <div className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">{record.date}</div>
                                <h4 className="text-xl font-bold text-slate-900 mt-1">{pt.name || pt.fullName || 'Unknown Patient'}</h4>
                                <div className="text-sm text-slate-600">Patient ID: P-{pt.id || record.patient_id || 'N/A'} • {pt.age || '--'} yrs • {pt.gender || '--'}</div>
                              </div>
                              <div className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                Provider: {record.doctor_name || 'Assigned Provider'}
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
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">Detox Procedure Note</div>
                                  <div
                                    className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                    dangerouslySetInnerHTML={{ __html: record.detox_procedure || '<p class="text-slate-500">No detox procedure notes recorded.</p>' }}
                                  />
                                </div>
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
                                        <div>
                                          Detox Doctor: {
                                            record.detox_doctor_name || 
                                            record.detoxDoctorName ||
                                            availableDoctors.find(d => Number(d.id) === Number(record.detox_doctor_id ?? record.detoxDoctorId))?.name ||
                                            doctors.find(d => Number(d.id) === Number(record.detox_doctor_id ?? record.detoxDoctorId))?.name ||
                                            'Not assigned'
                                          }
                                        </div>
                                        <div className="mt-1">Follow-up Date: {record.followup_date ? record.followup_date.split('T')[0] : 'Not scheduled'}</div>
                                        <div className="mt-1">Remarks: {record.followup_remarks || 'No remarks'}</div>
                                      </>
                                    ) : (
                                      <div className="text-slate-500">No detox recommended.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {historyRecords.length === 0 && (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 text-center text-slate-500">
                          No consultation history found yet. Complete a consultation to see it here.
                        </div>
                      )}
                    </div>

                    {historyRecords.length > 0 && (
                      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-sm text-slate-500">
                          Showing {Math.min(historyRecords.length, historyPageSize)} of {historyRecords.length} records
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                            disabled={historyPage <= 1}
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${historyPage <= 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                          >
                            ← Previous
                          </button>
                          <span className="text-sm font-medium text-slate-600">Page {historyPage} of {totalHistoryPages}</span>
                          <button
                            type="button"
                            onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                            disabled={historyPage >= totalHistoryPages}
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${historyPage >= totalHistoryPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
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