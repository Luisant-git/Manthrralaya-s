import React, { useState, useRef, useEffect } from 'react';
import { Droplets, Activity, ClipboardList, Save, CheckCircle, Calendar, User, Stethoscope, MessageSquare, Clock, FileText, Sun, Moon, SunMoon, TrendingUp } from 'lucide-react';
import { createDetoxSession, getAllDetoxSessions } from '../api/detoxSessionApi';
import { getAllConsultations } from '../api/consultationApi';
import { toast } from 'react-toastify';
import { generateDetoxPDF } from '../utils/pdfGenerator';

export default function DetoxView({ 
  appointments = [], 
  patients = [], 
  doctors = [], 
  consultations = [], 
  onAddConsultation, 
  onAddDetoxSession,
  detoxSessions = [],
  activeRole,
  currentUser 
}) {
  const [selectedApptId, setSelectedApptId] = useState('');
  const [selectedTab, setSelectedTab] = useState('detox');
  const [historySubTab, setHistorySubTab] = useState('detox');
  const [historyPage, setHistoryPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [localDetoxSessions, setLocalDetoxSessions] = useState([]);
  const [localConsultations, setLocalConsultations] = useState([]);
  
  // Detox Notes state
  const [detoxNotes, setDetoxNotes] = useState('');
  
  // Session Type state
  const [sessionType, setSessionType] = useState('morning');
  
  // Followup state
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [followupRemarks, setFollowupRemarks] = useState('Call patient later to confirm detox preparation and next steps.');
  
  const detoxEditorRef = useRef(null);
  const todayDate = new Date().toLocaleDateString('en-CA');

  // Function to get session count for a patient
  const getPatientSessionCount = (patientId) => {
    const sessions = localDetoxSessions.filter(d => String(d.patientId || d.patient_id) === String(patientId));
    return {
      completed: sessions.length,
      total: 3,
      remaining: 3 - sessions.length
    };
  };

  // Editor functions
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

  const fontSizeOptions = [
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '32px', value: '32px' },
  ];

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
        
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            tabIndex={0}
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={e => setContent(e.currentTarget.innerHTML)}
            className="editor-content min-h-[200px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          <div ref={placeholderRef} className="absolute top-3 left-3 text-slate-400 text-sm pointer-events-none" style={{ display: 'none' }}>
            {placeholder}
          </div>
        </div>
      </div>
    );
  };

  // Fetch detox sessions and consultations directly from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const detoxResponse = await getAllDetoxSessions();
        let sessionsData = [];
        if (detoxResponse && detoxResponse.data) {
          sessionsData = detoxResponse.data;
        } else if (detoxResponse && Array.isArray(detoxResponse)) {
          sessionsData = detoxResponse;
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
        
        setLocalDetoxSessions(normalizedSessions);
        
        const consResponse = await getAllConsultations();
        let consultationsData = [];
        if (consResponse && consResponse.data) {
          consultationsData = consResponse.data;
        } else if (consResponse && Array.isArray(consResponse)) {
          consultationsData = consResponse;
        }
        
        const normalizedConsultations = consultationsData.map(cons => ({
          id: cons.id,
          patient_id: cons.patientId,
          doctor_id: cons.doctorId,
          doctor_name: cons.doctor?.user?.fullName || cons.doctor?.name,
          date: cons.consultationDate ? new Date(cons.consultationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          consultation_notes: cons.consultationNotes,
          medical_history: cons.medicalHistoryNotes,
          detox_procedure: cons.detoxProcedureNotes,
          diet_plan_note: cons.dietPlanNotes,
          home_care: cons.homecareGuideliness,
          detox_recommended: cons.detoxRecommended,
          detox_type: cons.detoxType,
          detox_doctor_id: cons.detoxDoctorId,
          detox_doctor_name: cons.detoxDoctor?.user?.fullName || cons.detoxDoctor?.name,
          followup_date: cons.followupDate,
          followup_remarks: cons.followupRemarks,
          consultation_notes_html: cons.consultationNotes,
          medical_history_html: cons.medicalHistoryNotes
        }));
        
        setLocalConsultations(normalizedConsultations);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Check if appointment is detox type
  const isDetoxAppointment = (appt) => {
    return String(appt?.appointmentType || '').toLowerCase().includes('detox');
  };

  // Find current doctor
  const isDoctorView = activeRole === 'doctor' || activeRole === 'therapist';
  let currentDoctorId = null;
  
  if (isDoctorView && doctors.length > 0) {
    const currentUserLower = String(currentUser || '').toLowerCase();
    const currentDoctor = doctors.find(d => {
      const doctorEmail = (d.user?.email || d.email || '').toLowerCase();
      const doctorName = (d.user?.fullName || d.name || '').toLowerCase();
      return doctorEmail === currentUserLower || doctorName === currentUserLower;
    });
    currentDoctorId = currentDoctor?.id ? Number(currentDoctor.id) : null;
  }

  // FALLBACK: Extract doctor ID from appointments
  if (isDoctorView && !currentDoctorId && appointments.length > 0) {
    const aptWithDoctor = appointments.find(a => {
      const dEmail = (a.doctor?.user?.email || '').toLowerCase();
      const dName = (a.doctor?.user?.fullName || a.doctor?.name || '').toLowerCase();
      const currentUserLower = String(currentUser || '').toLowerCase();
      return dEmail === currentUserLower || dName === currentUserLower;
    });
    if (aptWithDoctor && aptWithDoctor.doctor) {
      currentDoctorId = aptWithDoctor.doctor.id;
    }
  }

  // Filter appointments
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
    
    const isToday = apptDateStr === todayDate;
    const isCheckedIn = a.status === 'Checked-in';
    const isDetox = isDetoxAppointment(a);
    
    const hasConsultation = localConsultations.some(c => 
      c.appointment_id === a.id || 
      String(c.appointment_id) === String(a.id) ||
      (c.appointment_id && Number(c.appointment_id) === Number(a.id))
    );
    
    const shouldShow = isToday && isCheckedIn && isDetox && !hasConsultation;
    
    if (shouldShow && isDoctorView && currentDoctorId) {
      const appointmentDoctorId = Number(a.doctor_id ?? a.doctorId ?? a.doctor?.id);
      return appointmentDoctorId === currentDoctorId;
    }
    
    return shouldShow;
  });

  const activeAppt = pendingConsults.find(a => String(a.id) === String(selectedApptId)) || pendingConsults[0];
  const activePt = activeAppt 
    ? (patients.find(p => String(p.id) === String(activeAppt.patient_id || activeAppt.patientId)) || 
       activeAppt.patient || 
       activeAppt.Patient) 
    : null;

  const appointmentHasAnyConsultation = activeAppt 
    ? localConsultations.some(c => c.appointment_id === activeAppt.id || String(c.appointment_id) === String(activeAppt.id))
    : false;

  const canAddSession = !appointmentHasAnyConsultation;

  // Get consultation history for this patient
  const consHistory = activePt 
    ? localConsultations.filter(c => String(c.patient_id) === String(activePt.id))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  // Get detox session history for this patient
  const detoxHistory = activePt 
    ? localDetoxSessions.filter(d => String(d.patientId || d.patient_id) === String(activePt.id))
        .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))
    : [];

  useEffect(() => {
    if (!selectedApptId && pendingConsults.length > 0) {
      setSelectedApptId(String(pendingConsults[0].id));
    }
  }, [pendingConsults, selectedApptId]);

  useEffect(() => {
    setHistoryPage(1);
  }, [activePt?.id, selectedTab, historySubTab]);

  const getSessionTypeDisplay = (type) => {
    switch(type) {
      case 'morning': return 'Morning Session';
      case 'evening': return 'Evening Session';
      case 'fullDay': return 'Full Day Session';
      default: return 'Morning Session';
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

  const handleSaveDetoxSession = async () => {
    if (!activeAppt || !activePt) {
      toast.error('No active appointment selected');
      return;
    }
    
    if (!canAddSession) {
      toast.warning('This appointment already has a completed session.');
      return;
    }
    
    if (!detoxNotes.trim()) {
      toast.warning('Please enter detox procedure notes');
      return;
    }
    
    setIsSaving(true);
    const currentApptId = activeAppt.id;
    
    try {
      const doctorName = activeAppt.doctor_name || doctors.find(d => d.id === currentDoctorId)?.name || 'Assigned Provider';
      const doctorId = Number(activeAppt.doctor_id || activeAppt.doctorId || currentDoctorId || 0);
      const sessionTypeDisplay = getSessionTypeDisplay(sessionType);
      
      const detoxData = {
        patientId: activePt.id,
        doctorId: doctorId || null,
        appointmentId: activeAppt.id ? parseInt(String(activeAppt.id).replace(/^\D+/g, ''), 10) : null,
        sessionNumber: detoxHistory.length + 1, // Increment session number
        sessionType: sessionType,
        sessionDate: new Date().toISOString(),
        detoxNotes: detoxNotes,
        followupDate: followupDate,
        followupRemarks: followupRemarks
      };
      
      console.log('💾 Saving detox session:', detoxData);
      const savedSession = await createDetoxSession(detoxData);
      console.log('✅ Detox session saved:', savedSession);
      
      try {
        const pdfData = {
          ...detoxData,
          patient_name: activePt.name,
          doctorName: doctorName
        };
        generateDetoxPDF(pdfData);
        toast.success("Detox session PDF generated successfully");
      } catch (pdfError) {
        console.error("PDF Generation error", pdfError);
        toast.error("Failed to generate PDF, but session was saved.");
      }
      
      if (onAddConsultation) {
        await onAddConsultation(null, currentApptId);
      }
      
      if (onAddDetoxSession) {
        onAddDetoxSession(savedSession, activePt);
      }
      
      // Refresh local data
      const [detoxResponse] = await Promise.all([
        getAllDetoxSessions()
      ]);
      
      let sessionsData = [];
      if (detoxResponse && detoxResponse.data) {
        sessionsData = detoxResponse.data;
      } else if (detoxResponse && Array.isArray(detoxResponse)) {
        sessionsData = detoxResponse;
      }
      setLocalDetoxSessions(sessionsData.map(session => ({
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
      })));
      
      setSelectedApptId('');
      setDetoxNotes('');
      setSessionType('morning');
      setFollowupDate(new Date().toISOString().split('T')[0]);
      setFollowupRemarks('Call patient later to confirm detox preparation and next steps.');
      
      toast.success(`Detox ${sessionTypeDisplay} (Session ${detoxHistory.length + 1}/3) completed successfully!`);
    } catch (error) {
      console.error('❌ Error saving detox session:', error);
      toast.error(error.message || 'Failed to save detox session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Pagination
  const historyPageSize = 3;
  const totalDetoxPages = Math.max(1, Math.ceil(detoxHistory.length / historyPageSize));
  const pagedDetoxHistory = detoxHistory.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);
  const totalConsultationPages = Math.max(1, Math.ceil(consHistory.length / historyPageSize));
  const pagedConsultationHistory = consHistory.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

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
              Detox Therapy Sessions
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage detox procedures for patients. Each patient can complete up to 3 sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Waiting Queue */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Detox Queue ({pendingConsults.length})
            </h3>
            <p className="text-sm text-slate-500 mb-4">Checked-in patients ready for detox session.</p>
            <div className="space-y-3">
              {pendingConsults.length > 0 ? (
                pendingConsults.map(appt => {
                  const pt = patients?.find(p => String(p.id) === String(appt.patient_id || appt.patientId)) || 
                             appt.patient || 
                             appt.Patient || 
                             {};
                  const sessionCount = getPatientSessionCount(pt.id);
                  const progressPercentage = (sessionCount.completed / sessionCount.total) * 100;
                  
                  return (
                    <button
                      key={appt.id}
                      onClick={() => setSelectedApptId(String(appt.id))}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                        String(selectedApptId) === String(appt.id)
                          ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{pt.name ?? pt.fullName ?? 'Unknown Patient'}</div>
                          <div className="text-xs text-slate-500 mt-1">{pt.age ?? '--'} yrs, {pt.gender ?? '--'}</div>
                        </div>
                        {/* Session Progress Capsule - Same location as Detox badge */}
<div className={`text-[13px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
  sessionCount.completed === 3 
    ? 'bg-emerald-100 text-emerald-700'
    : sessionCount.completed === 2
    ? 'bg-amber-100 text-amber-700'
    : 'bg-blue-100 text-blue-700'
}`}>
  {sessionCount.completed === 3 ? (
    <CheckCircle className="w-3 h-3" />
  ) : (
    <Activity className="w-3 h-3" />
  )}
  <span>{sessionCount.completed}/{sessionCount.total}</span>
</div>
                      </div>
                      
                      {/* Session Progress Indicator */}
                      
                      
                      <div className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-wider">
                        Assigned to: {appt.doctor_name || 'Assigned Provider'}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm italic">
                  No patients currently checked-in for detox.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Detox Form */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {activeAppt && activePt ? (
              <div className="divide-y divide-slate-100">
                
                {/* Header Info with Session Progress */}
                <div className="p-5 bg-slate-50 flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" />
                      {activePt.name}
                    </h2>
                    <div className="text-sm text-slate-500 mt-1">
                      <span className="inline-flex items-center gap-1 mr-3">
                        <Calendar className="w-3 h-3" /> ID: {activePt.id}
                      </span>
                      <span>Conditions: {activePt.medical_conditions || 'None'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold border border-emerald-200">
                      Detox Session
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-xs">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        <span className="text-slate-600">Progress:</span>
                        <span className="font-bold text-emerald-700">
                          {getPatientSessionCount(activePt.id).completed}/3 Sessions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

               

                <div className="p-5 flex flex-wrap items-center gap-3 bg-white border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedTab('detox')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                      selectedTab === 'detox' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Droplets className="w-4 h-4" />
                    Detox Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTab('history')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                      selectedTab === 'history' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    History
                  </button>
                </div>

                {selectedTab === 'detox' ? (
                  <>
                    {/* Show current session info */}
                    <div className="px-5 pt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">Current Session</span>
                          </div>
                          <span className="text-sm font-bold text-blue-800">
                            Session {getPatientSessionCount(activePt.id).completed + 1}/3
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Session Type Selection */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" /> 
                        Select Session Type
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setSessionType('morning')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            sessionType === 'morning'
                              ? 'border-emerald-500 bg-emerald-50 shadow-md'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <Sun className={`w-6 h-6 ${sessionType === 'morning' ? 'text-emerald-600' : 'text-amber-500'}`} />
                          <span className={`font-semibold text-sm ${sessionType === 'morning' ? 'text-emerald-700' : 'text-slate-700'}`}>
                            Morning Session
                          </span>
                          <span className="text-xs text-slate-500">8:00 AM - 12:00 PM</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSessionType('evening')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            sessionType === 'evening'
                              ? 'border-emerald-500 bg-emerald-50 shadow-md'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <Moon className={`w-6 h-6 ${sessionType === 'evening' ? 'text-emerald-600' : 'text-indigo-500'}`} />
                          <span className={`font-semibold text-sm ${sessionType === 'evening' ? 'text-emerald-700' : 'text-slate-700'}`}>
                            Evening Session
                          </span>
                          <span className="text-xs text-slate-500">4:00 PM - 8:00 PM</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSessionType('fullDay')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            sessionType === 'fullDay'
                              ? 'border-emerald-500 bg-emerald-50 shadow-md'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <SunMoon className={`w-6 h-6 ${sessionType === 'fullDay' ? 'text-emerald-600' : 'text-purple-500'}`} />
                          <span className={`font-semibold text-sm ${sessionType === 'fullDay' ? 'text-emerald-700' : 'text-slate-700'}`}>
                            Full Day Session
                          </span>
                          <span className="text-xs text-slate-500">8:00 AM - 8:00 PM</span>
                        </button>
                      </div>
                    </div>

                    {/* Detox Notes Section */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" /> 
                        Detox Session Notes
                      </h3>
                      
                      {getPatientSessionCount(activePt.id).completed >= 3 ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                          <div className="text-green-700 font-semibold mb-2">
                            Treatment Complete!
                          </div>
                          <p className="text-sm text-green-600">
                            This patient has completed all 3 detox sessions. No more sessions can be added.
                          </p>
                        </div>
                      ) : !canAddSession ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                          <div className="text-amber-700 font-semibold mb-2">
                            This appointment already has a completed session.
                          </div>
                          <p className="text-sm text-amber-600">
                            No additional session can be added for this appointment.
                          </p>
                        </div>
                      ) : (
                        <RichTextEditor 
                          editorRef={detoxEditorRef}
                          content={detoxNotes}
                          setContent={setDetoxNotes}
                          placeholder={`Enter detox procedure notes for Session ${getPatientSessionCount(activePt.id).completed + 1}/3...`}
                        />
                      )}
                    </div>

                    {/* Followup Section */}
                    {canAddSession && getPatientSessionCount(activePt.id).completed < 3 && (
                      <div className="p-5 bg-emerald-50 border-y border-emerald-100">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <h3 className="font-bold text-slate-800 text-sm">Follow-up Details</h3>
                        </div>
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Follow-up Date
                              </label>
                              <input
                                type="date"
                                value={followupDate}
                                onChange={e => setFollowupDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Remarks for Receptionist
                            </label>
                            <textarea
                              value={followupRemarks}
                              onChange={e => setFollowupRemarks(e.target.value)}
                              rows={3}
                              placeholder="Enter follow-up instructions for the receptionist..."
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <p className="text-xs text-emerald-700 mt-1.5 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            These follow-up details will be sent to reception so they can call the patient later.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="p-5 bg-slate-50 flex justify-end">
                      <button
                        onClick={handleSaveDetoxSession}
                        disabled={!canAddSession || !detoxNotes.trim() || isSaving || getPatientSessionCount(activePt.id).completed >= 3}
                        className={`bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm ${
                          (!canAddSession || !detoxNotes.trim() || isSaving || getPatientSessionCount(activePt.id).completed >= 3) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-emerald-700'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> 
                            Save Session {getPatientSessionCount(activePt.id).completed + 1}/3
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-5 space-y-4 consultation-history">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Patient History - {activePt.name}
                    </h3>
                    
                    {/* History Sub Tabs */}
                    <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-3">
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
                        Detox Sessions ({detoxHistory.length}/3)
                      </button>
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
                        Medical Consultations ({consHistory.length})
                      </button>
                    </div>

                {/* Detox Sessions History with Progress */}
{historySubTab === 'detox' && (
  <div className="space-y-4">
    {pagedDetoxHistory.length > 0 ? (
      pagedDetoxHistory.map((session) => (
        <div key={session.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA')}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <h4 className="text-xl font-bold text-slate-900">Detox Session {session.sessionNumber}</h4>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-semibold flex items-center gap-1">
                  {getSessionTypeIcon(session.sessionType)}
                  {getSessionTypeDisplay(session.sessionType)}
                </span>
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Patient: {activePt.name} • ID: {activePt.id}
              </div>
            </div>
            <div className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Provider: {session.doctorName || 'Assigned Provider'}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Detox Procedure Notes
            </div>
            <div
              className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
              dangerouslySetInnerHTML={{ 
                __html: session.detoxNotes || '<p class="text-slate-500">No detox notes recorded.</p>' 
              }}
            />
          </div>

          {session.followupDate && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-sm">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
                    Follow-up Date
                  </span>
                  <div className="text-slate-700 font-medium mt-1">
                    {new Date(session.followupDate).toLocaleDateString('en-CA')}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Remarks</span>
                  <div className="text-slate-700 mt-1">{session.followupRemarks || 'No specific follow-up instructions.'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-400">
              Session #{session.sessionNumber} • Record ID: {session.id}
            </div>
          </div>

          
        </div>
      ))
    ) : (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 text-center text-slate-500">
        <Droplets className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        No detox session history found for this patient.
      </div>
    )}
    
    {/* Pagination */}
    {detoxHistory.length > 0 && totalDetoxPages > 1 && (
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-slate-500">
          Showing {Math.min(detoxHistory.length, historyPageSize)} of {detoxHistory.length} records
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
            Page {historyPage} of {totalDetoxPages}
          </span>
          <button
            onClick={() => setHistoryPage(prev => Math.min(totalDetoxPages, prev + 1))}
            disabled={historyPage >= totalDetoxPages}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
              historyPage >= totalDetoxPages 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    )}

    {/* Overall Progress Summary - at the bottom after pagination */}
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200 mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-emerald-800">Overall Detox Progress</span>
        <span className="text-sm font-bold text-emerald-800">{detoxHistory.length}/3 Sessions</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div 
          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${(detoxHistory.length / 3) * 100}%` }}
        />
      </div>
      {detoxHistory.length === 3 && (
        <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Patient has completed all 3 detox sessions!
        </div>
      )}
    </div>
  </div>
)}

                    {/* Medical Consultations History */}
                    {historySubTab === 'consultations' && (
                      <div className="space-y-4">
                        {pagedConsultationHistory.length > 0 ? (
                          pagedConsultationHistory.map((record) => (
                            <div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                                <div>
                                  <div className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">{record.date}</div>
                                  <h4 className="text-xl font-bold text-slate-900 mt-1">{activePt.name}</h4>
                                  <div className="text-sm text-slate-600">Patient ID: P-{activePt.id}</div>
                                </div>
                                <div className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                  Provider: {record.doctor_name || 'Assigned Provider'}
                                </div>
                              </div>

                              {/* Row 1: Consultation Notes & Medical History */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Consultation Notes
                                  </div>
                                  <div 
                                    className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list min-h-[120px]" 
                                    dangerouslySetInnerHTML={{ 
                                      __html: record.consultation_notes || '<p class="text-slate-500 italic">No notes recorded.</p>' 
                                    }} 
                                  />
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Medical History
                                  </div>
                                  <div 
                                    className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list min-h-[120px]" 
                                    dangerouslySetInnerHTML={{ 
                                      __html: record.medical_history || '<p class="text-slate-500 italic">No medical history recorded.</p>' 
                                    }} 
                                  />
                                </div>
                              </div>

                              {/* Row 2: Detox Procedure Note & Diet Plan Note */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                                    <Droplets className="w-3 h-3" /> Detox Procedure Note
                                  </div>
                                  <div 
                                    className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list min-h-[100px]" 
                                    dangerouslySetInnerHTML={{ 
                                      __html: record.detox_procedure || '<p class="text-slate-500 italic">No detox procedure notes recorded.</p>' 
                                    }} 
                                  />
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                                    <ClipboardList className="w-3 h-3" /> Diet Plan Note
                                  </div>
                                  <div 
                                    className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list min-h-[100px]" 
                                    dangerouslySetInnerHTML={{ 
                                      __html: record.diet_plan_note || '<p class="text-slate-500 italic">No diet plan note recorded.</p>' 
                                    }} 
                                  />
                                </div>
                              </div>

                              {/* Row 3: Home Care Guidelines & Detox Recommendation */}
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
                            <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            No medical consultation history found for this patient.
                          </div>
                        )}
                        
                        {consHistory.length > 0 && totalConsultationPages > 1 && (
                          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-sm text-slate-500">
                              Showing {Math.min(consHistory.length, historyPageSize)} of {consHistory.length} records
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
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Droplets className="w-12 h-12 text-slate-300" />
                <p className="text-base font-medium">Select a patient from the detox queue to begin session.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}