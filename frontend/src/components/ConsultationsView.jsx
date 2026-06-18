import React, { useState, useRef, useEffect } from 'react';
import { Stethoscope, Activity, ClipboardList, Save, CheckCircle, Droplets, FileText, Calendar, User, Clock, MessageSquare, Sun, Moon, SunMoon, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAllDetoxSessions } from '../api/detoxSessionApi';
import { generateConsultationPDF, generateDetoxPDF, generateSingleTopicPDF, buildConsultationPdfBlob } from '../utils/pdfGenerator';
import { uploadConsultationPdf } from '../api/consultationApi';

export default function ConsultationsView({ appointments, patients, doctors, consultations, dietCharts, onAddConsultation, onAddDietChart, activeRole, currentUser }) {
  const [selectedApptId, setSelectedApptId] = useState('');
  const [selectedTab, setSelectedTab] = useState('consultation');
  const [historySubTab, setHistorySubTab] = useState('consultations');
  const [historyPage, setHistoryPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [historyAppended, setHistoryAppended] = useState(false);
  const [detoxSessions, setDetoxSessions] = useState([]);
  
  // Forms states
  const [consultationNotes, setConsultationNotes] = useState('');
  const [reviewRecommended, setReviewRecommended] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [detoxProcedure, setDetoxProcedure] = useState('');
  const [dietPlanNote, setDietPlanNote] = useState('');
  const [homeCare, setHomeCare] = useState('');
  
  const consultationEditorRef = useRef(null);
  const medicalHistoryEditorRef = useRef(null);
  const detoxProcedureEditorRef = useRef(null);
  const dietPlanEditorRef = useRef(null);

  // Fetch detox sessions directly from API
  useEffect(() => {
    const fetchDetoxSessions = async () => {
      try {
        const response = await getAllDetoxSessions();
        let sessionsData = [];
        if (response && response.data) {
          sessionsData = response.data;
        } else if (response && Array.isArray(response)) {
          sessionsData = response;
        }
        
        const normalizedSessions = sessionsData.map(session => ({
          id: session.id,
          patientId: session.patientId || session.patient_id,
          patient_id: session.patientId || session.patient_id,
          doctorId: session.doctorId || session.doctor_id,
          doctorName: session.doctor?.user?.fullName || session.doctor?.name,
          sessionNumber: session.sessionNumber,
          sessionType: session.sessionType,
          sessionDate: session.sessionDate,
          detoxNotes: session.detoxNotes,
          followupDate: session.followupDate,
          followupRemarks: session.followupRemarks,
          doctor: session.doctor
        }));
        
        setDetoxSessions(normalizedSessions);
      } catch (error) {
        console.error('Error fetching detox sessions:', error);
      }
    };
    
    fetchDetoxSessions();
  }, []);

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
  const todayDate = new Date().toLocaleDateString('en-CA');

  const fontSizeOptions = [
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '32px', value: '32px' },
  ];

  const isDetoxAppointment = (appt) => {
    const type = String(appt?.appointmentType || appt?.appointment_type || '').toLowerCase();
    return type.includes('detox');
  };

  const isDoctorView = activeRole === 'doctor';
  const currentUserEmail = (currentUser?.email || (typeof currentUser === 'string' ? currentUser : '')).toLowerCase();
  const currentUserId = currentUser?.userId || currentUser?.id;

  // Find current doctor
  let currentDoctor = isDoctorView
    ? doctors.find(d => {
        const doctorEmail = (d.user?.email || d.email || '').toLowerCase();
        const doctorName = (d.user?.fullName || d.name || '').toLowerCase();
        const dUserId = d.user?.id || d.userId;
        return doctorEmail === currentUserEmail || 
               (doctorName && currentUserEmail.includes(doctorName)) ||
               doctorName === currentUserEmail || 
               (currentUserId && Number(dUserId) === Number(currentUserId));
      })
    : null;

  // FALLBACK: Identify doctor from appointments
  if (isDoctorView && !currentDoctor && appointments && appointments.length > 0) {
    const aptWithDoctor = appointments.find(a => {
      const doc = a.doctor || a.Doctor || {};
      if (!doc) return false;
      const dEmail = (doc.user?.email || doc.email || '').toLowerCase();
      const dName = (doc.user?.fullName || doc.name || '').toLowerCase();
      const dUserId = doc.user?.id || doc.userId;
      return dEmail === currentUserEmail || 
             (dName && currentUserEmail.includes(dName)) || 
             (currentUserId && Number(dUserId) === Number(currentUserId));
    });
    const foundDoc = aptWithDoctor?.doctor || aptWithDoctor?.Doctor;
    if (foundDoc) {
      currentDoctor = { ...foundDoc, name: foundDoc.user?.fullName || foundDoc.name };
    }
  }

  const currentDoctorId = currentDoctor && currentDoctor.id ? Number(currentDoctor.id) : null;

  // Create a robust list of doctors for assignment
  let availableDoctors = doctors ? doctors.filter(d => d.status === 'Available') : [];
  
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

  if (currentDoctor && !availableDoctors.some(d => String(d.id) === String(currentDoctor.id))) {
    availableDoctors.push(currentDoctor);
  }

  useEffect(() => {
    if (detoxRecommended && !detoxDoctorId && currentDoctorId) {
      setDetoxDoctorId(String(currentDoctorId));
    }
  }, [detoxRecommended, currentDoctorId]);

  // Get today's appointments that are checked-in
  const pendingConsults = appointments.filter(a => {
    const rawDate = a.appointmentDate || a.date;
    let apptDateStr = '';
    if (rawDate) {
      if (typeof rawDate === 'string') {
        apptDateStr = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
      } else {
        apptDateStr = new Date(rawDate).toLocaleDateString('en-CA');
      }
    }
    const isReady = isDoctorView ? a.status === 'Checked-in' : (a.status === 'Checked-in' || a.status === 'Arrived');
    const isToday = apptDateStr === todayDate;
    const isNotDetox = !isDetoxAppointment(a);
    
    if (!isReady || !isToday || !isNotDetox) return false;

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
  
  // Filter histories for current patient
  const patientConsultations = activePt ? consultations.filter(c => String(c.patient_id) === String(activePt.id)).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
  const patientDetoxSessions = activePt ? detoxSessions.filter(d => String(d.patientId || d.patient_id) === String(activePt.id)).sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate)) : [];
  
  const latestHistory = patientConsultations[0] || null;
  const historyPageSize = 3;
  
  // Pagination for consultations
  const totalConsultationPages = Math.max(1, Math.ceil(patientConsultations.length / historyPageSize));
  const pagedConsultations = patientConsultations.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);
  
  // Pagination for detox sessions
  const totalDetoxPages = Math.max(1, Math.ceil(patientDetoxSessions.length / historyPageSize));
  const pagedDetoxSessions = patientDetoxSessions.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  useEffect(() => {
    if (!selectedApptId && pendingConsults.length > 0) {
      setSelectedApptId(pendingConsults[0].id);
    }
  }, [pendingConsults, selectedApptId]);
  
  useEffect(() => {
    setHistoryPage(1);
  }, [activePt?.id, selectedTab, historySubTab]);

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

    if (!detoxRecommended && !reviewRecommended) {
      toast.warn('Please select either "Recommend Detox" or "Recommend Review" before finalizing.');
      return;
    }

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
        followup_date: (detoxRecommended || reviewRecommended) ? detoxFollowupDate : null,
        followup_remarks: (detoxRecommended || reviewRecommended) ? detoxFollowupRemarks : null
      };

      const savedConsultation = await onAddConsultation(newCons, activeAppt.id);
      
      try {
        // Build PDF blob (omit sensitive sections for WhatsApp) and upload to backend to trigger WhatsApp send
        const { blob, fileName } = await buildConsultationPdfBlob(newCons, null, ['Medical History', 'Detox Procedure']);
        const formData = new FormData();
        formData.append('file', blob, fileName);
        if (savedConsultation?.id) {
          await uploadConsultationPdf(savedConsultation.id, formData);
          toast.success('Consultation PDF sent via WhatsApp');
        } else {
          // Fallback: save locally
          generateConsultationPDF(newCons);
          toast.success('Consultation saved; PDF generated locally');
        }
      } catch (pdfError) {
        console.error('PDF Generation/Upload error', pdfError);
        toast.error('Failed to generate or send PDF, but consultation was saved.');
      }

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
      
      setSelectedApptId('');
      setConsultationNotes('');
      setMedicalHistory('');
      setDetoxProcedure('');
      setDietPlanNote('');
      setHomeCare('');
      setDiet({ morning: '', breakfast: '', lunch: '', evening: '', dinner: '', remarks: '' });
      setDetoxRecommended(false);
      setReviewRecommended(false);
      setDetoxDoctorId('');
      setDetoxFollowupDate(new Date().toISOString().split('T')[0]);
      setDetoxFollowupRemarks('');
    } catch (error) {
      console.error('Error saving consultation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getSessionTypeIcon = (type) => {
    switch(type) {
      case 'morning': return <Sun className="w-4 h-4" />;
      case 'evening': return <Moon className="w-4 h-4" />;
      case 'fullDay': return <SunMoon className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  const getSessionTypeDisplay = (type) => {
    switch(type) {
      case 'morning': return 'Morning Session';
      case 'evening': return 'Evening Session';
      case 'fullDay': return 'Full Day Session';
      default: return 'Morning Session';
    }
  };

  // Reusable Editor Component
  const RichTextEditor = ({ editorRef, content, setContent, placeholder }) => {
    const placeholderRef = useRef(null);

    useEffect(() => {
      if (!editorRef.current || !placeholderRef.current) return;
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText.trim();
      const empty = !html || html === '<br>' || html === '<p><br></p>' || text === '';
      placeholderRef.current.style.display = empty ? 'block' : 'none';
    }, [content, editorRef]);

    const handleInput = (e) => {
      if (!placeholderRef.current) return;
      const html = e.currentTarget.innerHTML;
      const text = e.currentTarget.innerText.trim();
      const empty = !html || html === '<br>' || html === '<p><br></p>' || text === '';
      placeholderRef.current.style.display = empty ? 'block' : 'none';
    };

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => applyEditorCommand('bold', null, editorRef, setContent)} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Bold</button>
          <button type="button" onClick={() => applyEditorCommand('italic', null, editorRef, setContent)} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Italic</button>
          <button type="button" onClick={() => applyEditorCommand('underline', null, editorRef, setContent)} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Underline</button>
          <select onChange={(e) => handleFontSizeChange(e, editorRef, setContent)} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer" defaultValue="">
            <option value="" disabled>Font Size</option>
            {fontSizeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          <button type="button" onClick={() => applyEditorCommand('insertUnorderedList', null, editorRef, setContent)} className="rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Bullet List"><span className="text-base">•</span> Bullets</button>
          <button type="button" onClick={() => applyEditorCommand('insertOrderedList', null, editorRef, setContent)} className="rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Numbered List"><span className="text-xs font-bold">1.</span> Numbers</button>
        </div>
        <div className="relative">
          <div ref={editorRef} contentEditable tabIndex={0} suppressContentEditableWarning onInput={handleInput} onBlur={e => setContent(e.currentTarget.innerHTML)} className="editor-content min-h-[140px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200" dangerouslySetInnerHTML={{ __html: content }} />
          <div ref={placeholderRef} className="absolute top-3 left-3 text-slate-400 text-sm pointer-events-none" style={{ display: 'none' }}>{placeholder}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .editor-content ul, .editor-content ol { margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; }
        .editor-content ul { list-style-type: disc; }
        .editor-content ol { list-style-type: decimal; }
        .editor-content li { margin-bottom: 0.25rem; }
        [contenteditable="true"] ul, [contenteditable="true"] ol { padding-left: 1.5rem; }
        [contenteditable="true"] ul { list-style-type: disc; }
        [contenteditable="true"] ol { list-style-type: decimal; }
        .history-list ul, .history-list ol { margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; }
        .history-list ul { list-style-type: disc; }
        .history-list ol { list-style-type: decimal; }
        .history-list li { margin-bottom: 0.25rem; }
      `}</style>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">Clinical Consultations</h1>
            <p className="text-slate-500 text-sm mt-1">Doctor workspace for logging vitals, prescriptions, and detox therapy assignments.</p>
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
                const pt = patients.find(p => String(p.id) === String(appt.patient_id || appt.patientId)) || appt.patient || appt.Patient || {};
                return (
                  <button key={appt.id} onClick={() => setSelectedApptId(appt.id)} className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${String(selectedApptId) === String(appt.id) ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-emerald-200'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{pt.name || pt.fullName || 'Unknown Patient'}</div>
                        <div className="text-xs text-slate-500 mt-1">{pt.age} yrs, {pt.gender}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-wider">Assigned to: {appt.doctor_name || 'Assigned Provider'}</div>
                  </button>
                );
              })}
              {pendingConsults.length === 0 && (<div className="text-center py-6 text-slate-400 text-sm italic">No patients currently checked-in.</div>)}
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
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold border border-emerald-200">Consultation in Progress</div>
                </div>

                <div className="p-5 flex flex-wrap items-center gap-3 bg-white border-b border-slate-100">
                  <button type="button" onClick={() => setSelectedTab('consultation')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedTab === 'consultation' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Consultation</button>
                  <button type="button" onClick={() => setSelectedTab('history')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedTab === 'history' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>History</button>
                </div>

                {selectedTab === 'consultation' ? (
                  <>
                    {/* 1. Clinical Consultation Notes */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> 1. Clinical Consultation Notes </h3>
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <label className="block text-xs font-semibold text-slate-600">Patient Medical History</label>
                          <button type="button" onClick={appendLatestHistoryToCurrent} disabled={!latestHistory} className={`text-xs font-semibold ${historyAppended ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'} disabled:text-slate-400`}>
                            {latestHistory ? (historyAppended ? 'Latest history already added' : 'Add latest history notes') : 'No previous history available'}
                          </button>
                        </div>
                        <RichTextEditor editorRef={medicalHistoryEditorRef} content={medicalHistory} setContent={setMedicalHistory} placeholder="Enter patient medical history..." />
                      </div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Notes  [Prescription]</label><RichTextEditor editorRef={consultationEditorRef} content={consultationNotes} setContent={setConsultationNotes} placeholder="Enter consultation notes here..." /></div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Detox Procedure Note</label><RichTextEditor editorRef={detoxProcedureEditorRef} content={detoxProcedure} setContent={setDetoxProcedure} placeholder="Enter detox procedure notes..." /></div>
                    </div>

                    {/* 2. Diet Plan Note */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-emerald-600" /> 2. Diet Plan Note</h3>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Diet Plan Note</label><RichTextEditor editorRef={dietPlanEditorRef} content={dietPlanNote} setContent={setDietPlanNote} placeholder="Enter diet plan notes..." /></div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Home Care Guidelines</label><input type="text" value={homeCare} onChange={e => setHomeCare(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" /></div>
                    </div>

                    {/* 3. Detox Recommendation */}
                    <div className="p-5 bg-emerald-50 border-y border-emerald-100">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="detoxCheck" 
                          checked={detoxRecommended} 
                          onChange={e => {
                            setDetoxRecommended(e.target.checked);
                            if (e.target.checked) setReviewRecommended(false);
                          }} 
                          className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500" 
                        />
                        <label htmlFor="detoxCheck" className="font-bold text-slate-800 text-sm">Recommend Detox Program</label>
                      </div>
                      {detoxRecommended && (
                        <div className="mt-3 ml-8 space-y-3">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600">Assign Detox Doctor</label>
                              <select value={detoxDoctorId} onChange={e => setDetoxDoctorId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                                <option value="">Select Detox Doctor</option>
                                {availableDoctors.length > 0 ? (availableDoctors.map(doc => (<option key={doc.id} value={doc.id}>Dr. {doc.name || doc.user?.fullName} — {doc.specialization || 'General'}</option>))) : (<option disabled>No doctors available</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600">Follow-up Date</label>
                              <input type="date" value={detoxFollowupDate} onChange={e => setDetoxFollowupDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-slate-600">Remarks for Receptionist</label>
                            <textarea value={detoxFollowupRemarks} onChange={e => setDetoxFollowupRemarks(e.target.value)} rows={3} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Enter any special instructions for the receptionist..." />
                          </div>
                          <p className="text-xs text-emerald-700 mt-1.5 font-medium">These follow-up details will be sent to reception so they can call the patient later.</p>
                        </div>
                      )}
                    </div>

                    {/* 4. Review Recommendation (Conditional) */}
                    {!detoxRecommended && (
                      <div className="p-5 bg-amber-50 border-b border-amber-100">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="reviewCheck" 
                            checked={reviewRecommended} 
                            onChange={e => {
                              setReviewRecommended(e.target.checked);
                              if (e.target.checked) setDetoxRecommended(false);
                            }} 
                            className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500" 
                          />
                          <label htmlFor="reviewCheck" className="font-bold text-slate-800 text-sm">Recommend Review / Follow-up</label>
                        </div>
                        {reviewRecommended && (
                          <div className="mt-3 ml-8 space-y-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-600">Follow-up Date</label>
                                <input type="date" value={detoxFollowupDate} onChange={e => setDetoxFollowupDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="block text-xs font-semibold text-slate-600">Remarks for Receptionist</label>
                              <textarea value={detoxFollowupRemarks} onChange={e => setDetoxFollowupRemarks(e.target.value)} rows={3} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500" placeholder="Enter review/follow-up instructions..." />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="p-5 bg-slate-50 flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          const draftCons = {
                            patient_name: activePt.name,
                            doctor_name: activeAppt?.doctor_name || currentUser?.fullName || 'Assigned Provider',
                            date: new Date().toISOString().split('T')[0],
                            consultation_notes: consultationNotes,
                            medical_history: medicalHistory,
                            detox_procedure: detoxProcedure,
                            diet_plan_note: dietPlanNote,
                            home_care: homeCare
                          };
                          generateConsultationPDF(draftCons);
                        }}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
                        title="Download current input as PDF without saving"
                      >
                        <Download className="w-4 h-4 text-emerald-600" /> Export Draft PDF
                      </button>
                      <button onClick={handleCompleteConsultation} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Saving...</>) : (<><Save className="w-4 h-4" /> Save & Finalize Consultation</>)}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-5 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">{activePt.name} - Patient History</h3>
                    
                    {/* History Sub Tabs */}
                    <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-3">
                      <button
                        type="button"
                        onClick={() => { setHistorySubTab('consultations'); setHistoryPage(1); }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                          historySubTab === 'consultations' 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Stethoscope className="w-4 h-4" />
                        Consultations ({patientConsultations.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => { setHistorySubTab('detox'); setHistoryPage(1); }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                          historySubTab === 'detox' 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Droplets className="w-4 h-4" />
                        Detox Sessions ({patientDetoxSessions.length})
                      </button>
                    </div>

                 {/* Consultation History - Show ALL Notes in Grid Layout */}
{historySubTab === 'consultations' && (
  <div className="space-y-4">
    {pagedConsultations.length > 0 ? (
      pagedConsultations.map(record => (
        <div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">{record.date}</div>
              <h4 className="text-xl font-bold text-slate-900 mt-1">{activePt.name}</h4>
              <div className="text-sm text-slate-600">Patient ID: P-{activePt.id}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Provider: {record.doctor_name || 'Assigned Provider'}
              </div>
              <button 
                type="button"
                onClick={() => generateConsultationPDF({ ...record, patient_name: activePt.name })}
                className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center hover:scale-105"
                title="Download Full PDF Report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 1: Consultation Notes & Medical History - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="group">
              <div className="flex items-center justify-between mb-2 h-6">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-600" /> Consultation Notes
                </div>
                <button 
                  type="button" 
                  onClick={() => generateSingleTopicPDF({ ...record, patient_name: activePt.name }, 'Consultation Notes', record.consultation_notes)}
                  className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white shadow-sm translate-y-1 group-hover:translate-y-0"
                  title="Download Consultation Notes">
                  <Download className="w-3 h-3" /> Export PDF
                </button>
              </div>
              <div 
                className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list min-h-[120px] transition-all duration-300 group-hover:shadow-md group-hover:border-emerald-200" 
                dangerouslySetInnerHTML={{ 
                  __html: record.consultation_notes || '<p class="text-slate-500 italic">No notes recorded.</p>' 
                }} 
              />
            </div>
            <div className="group">
              <div className="flex items-center justify-between mb-2 h-6">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold flex items-center gap-2">
                  <FileText className="w-3 h-3 text-emerald-600" /> Medical History
                </div>
                <button 
                  type="button" 
                  onClick={() => generateSingleTopicPDF({ ...record, patient_name: activePt.name }, 'Medical History', record.medical_history)}
                  className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white shadow-sm translate-y-1 group-hover:translate-y-0"
                  title="Download Medical History">
                  <Download className="w-3 h-3" /> Export PDF
                </button>
              </div>
              <div 
                className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list min-h-[120px] transition-all duration-300 group-hover:shadow-md group-hover:border-emerald-200" 
                dangerouslySetInnerHTML={{ 
                  __html: record.medical_history || '<p class="text-slate-500 italic">No medical history recorded.</p>' 
                }} 
              />
            </div>
          </div>

          {/* Row 2: Detox Procedure Note & Diet Plan Note - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="group">
              <div className="flex items-center justify-between mb-2 h-6">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold flex items-center gap-2">
                  <Droplets className="w-3 h-3 text-emerald-600" /> Detox Procedure Note
                </div>
                <button 
                  type="button" 
                  onClick={() => generateSingleTopicPDF({ ...record, patient_name: activePt.name }, 'Detox Procedure Note', record.detox_procedure)}
                  className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white shadow-sm translate-y-1 group-hover:translate-y-0"
                  title="Download Detox Procedure Notes">
                  <Download className="w-3 h-3" /> Export PDF
                </button>
              </div>
              <div 
                className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list min-h-[100px] transition-all duration-300 group-hover:shadow-md group-hover:border-emerald-200" 
                dangerouslySetInnerHTML={{ 
                  __html: record.detox_procedure || '<p class="text-slate-500 italic">No detox procedure notes recorded.</p>' 
                }} 
              />
            </div>
            <div className="group">
              <div className="flex items-center justify-between mb-2 h-6">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold flex items-center gap-2">
                  <ClipboardList className="w-3 h-3 text-emerald-600" /> Diet Plan Note
                </div>
                <button 
                  type="button" 
                  onClick={() => generateSingleTopicPDF({ ...record, patient_name: activePt.name }, 'Diet Plan Note', record.diet_plan_note)}
                  className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white shadow-sm translate-y-1 group-hover:translate-y-0"
                  title="Download Diet Plan Notes">
                  <Download className="w-3 h-3" /> Export PDF
                </button>
              </div>
              <div 
                className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list min-h-[100px] transition-all duration-300 group-hover:shadow-md group-hover:border-emerald-200" 
                dangerouslySetInnerHTML={{ 
                  __html: record.diet_plan_note || '<p class="text-slate-500 italic">No diet plan note recorded.</p>' 
                }} 
              />
            </div>
          </div>

          {/* Row 3: Home Care Guidelines & Detox Recommendation - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Home Care Guidelines
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-4 text-sm text-slate-700 min-h-[100px]">
                {record.home_care || <span className="text-slate-500 italic">No home care guidelines recorded.</span>}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Recommendation
              </div>
                              <div className={`rounded-2xl border p-4 text-sm min-h-[100px] ${record.detox_recommended ? 'bg-white border-slate-200' : 'bg-amber-50/50 border-amber-100'}`}>
                                {record.detox_recommended ? (
                                  <div className="space-y-2">
                                    <div className="text-emerald-700 font-bold text-xs uppercase mb-1">Detox Program</div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-semibold text-slate-700 min-w-[100px]">Doctor:</span>
                                      <span className="text-slate-600">{record.detox_doctor_name || 'Not assigned'}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-semibold text-slate-700 min-w-[100px]">Date:</span>
                                      <span className="text-slate-600">{record.followup_date || 'Not scheduled'}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-semibold text-slate-700 min-w-[100px]">Remarks:</span>
                                      <span className="text-slate-600">{record.followup_remarks || 'No remarks'}</span>
                                    </div>
                                  </div>
                                ) : (record.followup_date || record.followupDate) ? (
                                  <div className="space-y-2">
                                    <div className="text-amber-700 font-bold text-xs uppercase mb-1">Follow-up Review</div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-semibold text-slate-700 min-w-[100px]">Date:</span>
                                      <span className="text-slate-600">{record.followup_date || record.followupDate}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="font-semibold text-slate-700 min-w-[100px]">Remarks:</span>
                                      <span className="text-slate-600">{record.followup_remarks || record.followupRemarks || 'No remarks'}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic">No recommendation recorded.</span>
                                )}
                              </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 text-center text-slate-500">
        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        No consultation history found for this patient.
      </div>
    )}
    
    {/* Pagination */}
    {patientConsultations.length > 0 && totalConsultationPages > 1 && (
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-slate-500">
          Showing {Math.min(patientConsultations.length, historyPageSize)} of {patientConsultations.length} records
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
            disabled={historyPage <= 1}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
              historyPage <= 1 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-slate-600">
            Page {historyPage} of {totalConsultationPages}
          </span>
          <button
            onClick={() => setHistoryPage(prev => Math.min(totalConsultationPages, prev + 1))}
            disabled={historyPage >= totalConsultationPages}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
              historyPage >= totalConsultationPages 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    )}
  </div>
)}

                    {/* Detox Sessions History */}
                    {historySubTab === 'detox' && (
                      <div className="space-y-4">
                        {pagedDetoxSessions.length > 0 ? (
                          pagedDetoxSessions.map(session => (
                            <div key={session.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                                <div>
                                  <div className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(session.sessionDate).toLocaleDateString('en-CA')}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <h4 className="text-xl font-bold text-slate-900">Detox Session</h4>
                                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-semibold flex items-center gap-1">
                                      {getSessionTypeIcon(session.sessionType)}
                                      {getSessionTypeDisplay(session.sessionType)}
                                    </span>
                                  </div>
                                  <div className="text-sm text-slate-600 mt-1">Patient: {activePt.name} • ID: {activePt.id}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                    Provider: {session.doctor?.user?.fullName || session.doctorName || 'Assigned Provider'}
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => generateDetoxPDF({ ...session, patient_name: activePt.name })}
                                    className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center hover:scale-105"
                                    title="Download Full PDF Report"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                                  <Activity className="w-3 h-3" />
                                  Detox Procedure Notes
                                </div>
                                <div
                                  className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                  dangerouslySetInnerHTML={{ __html: session.detoxNotes || '<p class="text-slate-500">No detox notes recorded.</p>' }}
                                />
                              </div>

                              {session.followupDate && (
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="text-sm">
                                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Follow-up Date</span>
                                      <div className="text-slate-700 font-medium mt-1">{new Date(session.followupDate).toLocaleDateString('en-CA')}</div>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Remarks</span>
                                      <div className="text-slate-700 mt-1">{session.followupRemarks || 'No specific follow-up instructions.'}</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 pt-3 border-t border-slate-200">
                                <div className="text-xs text-slate-400">Session #{session.sessionNumber} • Record ID: {session.id}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 text-center text-slate-500">
                            <Droplets className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            No detox session history found for this patient.
                            <div className="text-sm mt-1">Complete a detox session to see it here.</div>
                          </div>
                        )}
                        
                        {patientDetoxSessions.length > 0 && totalDetoxPages > 1 && (
                          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-sm text-slate-500">Showing {Math.min(patientDetoxSessions.length, historyPageSize)} of {patientDetoxSessions.length} records</div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))} disabled={historyPage <= 1} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${historyPage <= 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>← Previous</button>
                              <span className="text-sm font-medium text-slate-600">Page {historyPage} of {totalDetoxPages}</span>
                              <button onClick={() => setHistoryPage(prev => Math.min(totalDetoxPages, prev + 1))} disabled={historyPage >= totalDetoxPages} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${historyPage >= totalDetoxPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Next →</button>
                            </div>
                          </div>
                        )}
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