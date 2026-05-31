import React, { useState, useRef, useEffect } from 'react';
import { Droplets, Activity, ClipboardList, Save, CheckCircle, Calendar, User, Stethoscope, MessageSquare, Clock, FileText, Sun, Moon, SunMoon } from 'lucide-react';

export default function DetoxView({ appointments = [], patients = [], doctors = [], consultations = [], onAddConsultation, activeRole }) {
  const [selectedApptId, setSelectedApptId] = useState('');
  const [selectedTab, setSelectedTab] = useState('detox');
  const [historyPage, setHistoryPage] = useState(1);
  
  // Detox Notes state
  const [detoxNotes, setDetoxNotes] = useState('');
  
  // Session Type state
  const [sessionType, setSessionType] = useState('morning'); // 'morning', 'evening', 'fullDay'
  
  // Followup state
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [followupRemarks, setFollowupRemarks] = useState('Call patient later to confirm detox preparation and next steps.');
  
  const detoxEditorRef = useRef(null);
  const todayDate = new Date().toISOString().split('T')[0];

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
        className="editor-content min-h-[200px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {(!content || content === '<br>') && (
        <div className="text-slate-400 text-sm -mt-8 ml-3 pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );

  // Filter only "Checked-in" appointments for today that are Detox type
  const isDetoxAppointment = (appt) => {
    return String(appt?.appointmentType || '').toLowerCase().includes('detox');
  };

  const pendingConsults = appointments.filter(a => a.status === 'Checked-in' && a.date === todayDate && isDetoxAppointment(a));
  const activeAppt = pendingConsults.find(a => a.id === selectedApptId);
  const activePt = activeAppt ? patients.find(p => p.id === activeAppt.patient_id) : null;
  
  // Get all consultations for this patient (both detox and regular)
  const allPatientConsultations = activePt && consultations 
    ? consultations.filter(c => c.patient_id === activePt.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];
  
  // Separate detox sessions and regular consultations
  const detoxSessions = allPatientConsultations.filter(c => c.detox_recommended === true);
  
  const sessionCount = detoxSessions.length;
  const canAddMoreSessions = sessionCount < 3;

  // Get session type display name
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

  useEffect(() => {
    if (!selectedApptId && pendingConsults.length > 0) {
      setSelectedApptId(pendingConsults[0].id);
    }
  }, [pendingConsults, selectedApptId]);

  useEffect(() => {
    setHistoryPage(1);
  }, [activePt?.id, selectedTab]);

  const handleSaveDetoxSession = () => {
    if (!activeAppt || !activePt) return;
    
    const doctorName = activeAppt.doctor_name || 'Assigned Provider';
    const sessionNumber = sessionCount + 1;
    const sessionTypeDisplay = getSessionTypeDisplay(sessionType);
    
    const newDetoxConsultation = {
      id: `DETOX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patient_id: activePt.id,
      doctor_name: doctorName,
      date: new Date().toISOString().split('T')[0],
      consultation_notes: '',
      medical_history: '',
      detox_procedure: detoxNotes,
      diet_plan_note: '',
      home_care: '',
      detox_recommended: true,
      detox_type: sessionTypeDisplay,
      detox_session_type: sessionType, // Store the raw type for filtering
      detox_doctor_id: null,
      detox_doctor_name: null,
      followup_date: followupDate,
      followup_remarks: followupRemarks,
      session_number: sessionNumber
    };

    if (onAddConsultation) {
      onAddConsultation(newDetoxConsultation, activeAppt.id);
    }
    
    setDetoxNotes('');
    setSessionType('morning');
    setFollowupDate(new Date().toISOString().split('T')[0]);
    setFollowupRemarks('Call patient later to confirm detox preparation and next steps.');
    setSelectedApptId('');
    
    alert(`Detox ${sessionTypeDisplay} ${sessionNumber} saved successfully!`);
  };

  // Pagination for history
  const historyPageSize = 3;
  const totalHistoryPages = Math.max(1, Math.ceil(allPatientConsultations.length / historyPageSize));
  const pagedHistory = allPatientConsultations.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  const getConsultationTypeBadge = (consultation) => {
    if (consultation.detox_recommended) {
      const sessionType = consultation.detox_session_type || 
        (consultation.detox_type?.toLowerCase().includes('morning') ? 'morning' :
         consultation.detox_type?.toLowerCase().includes('evening') ? 'evening' : 'fullDay');
      return (
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-semibold flex items-center gap-1">
            {getSessionTypeIcon(sessionType)}
            Detox Session
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
            {consultation.detox_type || getSessionTypeDisplay(sessionType)}
          </span>
        </div>
      );
    }
    return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold">Regular Consultation</span>;
  };

  return (
    <>
      <style>{`
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
              Detox Therapy Sessions
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage detox procedures for patients. Each patient can have up to 3 detox sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Waiting Queue */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Detox Queue
            </h3>
            <p className="text-sm text-slate-500 mb-4">Checked-in patients ready for detox session.</p>
            <div className="space-y-3">
              {pendingConsults.length > 0 ? (
                pendingConsults.map(appt => {
                  const pt = patients?.find(p => p.id === appt.patient_id) || {};
                  const existingDetoxSessions = consultations 
                    ? consultations.filter(c => c.patient_id === pt.id && c.detox_recommended === true)
                    : [];
                  const sessionsDone = existingDetoxSessions.length;
                  const canStartSession = sessionsDone < 3;
                  
                  return (
                    <button
                      key={appt.id}
                      onClick={() => canStartSession && setSelectedApptId(appt.id)}
                      disabled={!canStartSession}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                        !canStartSession 
                          ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          : selectedApptId === appt.id
                            ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{pt.name || 'Unknown Patient'}</div>
                          <div className="text-xs text-slate-500 mt-1">{appt.session === 'FN' ? 'Forenoon' : 'Afternoon'} • {pt.age || '--'} yrs, {pt.gender || '--'}</div>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                          sessionsDone === 0 ? 'bg-emerald-100 text-emerald-700' :
                          sessionsDone === 1 ? 'bg-blue-100 text-blue-700' :
                          sessionsDone === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {sessionsDone}/3 Sessions
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-wider">
                        Assigned to: {appt.doctor_name || 'Assigned Provider'}
                      </div>
                      {!canStartSession && (
                        <div className="text-[10px] text-amber-600 font-bold mt-1">
                          Max 3 sessions completed
                        </div>
                      )}
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
                
                {/* Header Info */}
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
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold border border-emerald-200">
                    Session {sessionCount + 1}/3
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
                    Complete History ({allPatientConsultations.length})
                  </button>
                </div>

                {selectedTab === 'detox' ? (
                  <>
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
                        Detox Session #{sessionCount + 1} Notes ({getSessionTypeDisplay(sessionType)})
                      </h3>
                      
                      {!canAddMoreSessions ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                          <div className="text-amber-700 font-semibold mb-2">
                            Maximum 3 detox sessions completed for this patient.
                          </div>
                          <p className="text-sm text-amber-600">
                            No additional detox sessions can be added.
                          </p>
                        </div>
                      ) : (
                        <>
                          <RichTextEditor 
                            editorRef={detoxEditorRef}
                            content={detoxNotes}
                            setContent={setDetoxNotes}
                            placeholder={`Enter ${getSessionTypeDisplay(sessionType)} detox procedure notes, observations, recommendations...`}
                          />
                          
                          
                        </>
                      )}
                    </div>

                    {/* Followup Section */}
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

                    {/* Save Button */}
                    <div className="p-5 bg-slate-50 flex justify-end">
                      <button
                        onClick={handleSaveDetoxSession}
                        disabled={!canAddMoreSessions || !detoxNotes.trim()}
                        className={`bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm ${
                          (!canAddMoreSessions || !detoxNotes.trim()) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-emerald-700'
                        }`}
                      >
                        <Save className="w-4 h-4" /> 
                        Save {getSessionTypeDisplay(sessionType)} {sessionCount + 1}/3
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-5 space-y-4 consultation-history">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Complete Patient History
                    </h3>
                    <p className="text-sm text-slate-500">
                      Showing all consultations for {activePt.name} ({allPatientConsultations.length} total records)
                    </p>
                    
                    <div className="space-y-4">
                      {pagedHistory.length > 0 ? (
                        pagedHistory.map((record) => {
                          const isDetox = record.detox_recommended === true;
                          return (
                            <div key={record.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                                <div>
                                  <div className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {record.date}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <h4 className="text-xl font-bold text-slate-900">
                                      {isDetox ? 'Detox Session' : 'Medical Consultation'}
                                    </h4>
                                    {getConsultationTypeBadge(record)}
                                  </div>
                                  <div className="text-sm text-slate-600 mt-1">
                                    Patient: {activePt.name} • ID: {activePt.id}
                                  </div>
                                </div>
                                <div className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                  Provider: {record.doctor_name || 'Assigned Provider'}
                                </div>
                              </div>

                              {isDetox ? (
                                <>
                                  <div className="mt-3">
                                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2 flex items-center gap-2">
                                      <Activity className="w-3 h-3" />
                                      Detox Procedure Notes
                                    </div>
                                    <div
                                      className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                      dangerouslySetInnerHTML={{ 
                                        __html: record.detox_procedure || '<p class="text-slate-500">No detox notes recorded for this session.</p>' 
                                      }}
                                    />
                                  </div>

                                  {record.followup_date && (
                                    <div className="mt-4 pt-3 border-t border-slate-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="text-sm">
                                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
                                            Follow-up Date
                                          </span>
                                          <div className="text-slate-700 font-medium mt-1">
                                            {record.followup_date ? record.followup_date.split('T')[0] : 'Not scheduled'}
                                          </div>
                                        </div>
                                        <div className="text-sm">
                                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Remarks</span>
                                          <div className="text-slate-700 mt-1">{record.followup_remarks || 'No remarks'}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">Consultation Notes</div>
                                      <div
                                        className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                        dangerouslySetInnerHTML={{ 
                                          __html: record.consultation_notes || '<p class="text-slate-500">No notes recorded.</p>' 
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">Medical History</div>
                                      <div
                                        className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                        dangerouslySetInnerHTML={{ 
                                          __html: record.medical_history || '<p class="text-slate-500">No history recorded.</p>' 
                                        }}
                                      />
                                    </div>
                                  </div>
                                  
                                  {record.diet_plan_note && (
                                    <div className="mt-4">
                                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">Diet Plan Note</div>
                                      <div
                                        className="rounded-2xl bg-white border border-slate-200 p-4 text-sm leading-6 text-slate-800 history-list"
                                        dangerouslySetInnerHTML={{ __html: record.diet_plan_note }}
                                      />
                                    </div>
                                  )}
                                </>
                              )}

                              <div className="mt-4 pt-3 border-t border-slate-200">
                                <div className="text-xs text-slate-400">
                                  Record ID: {record.id}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 text-center text-slate-500">
                          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          No consultation history found for this patient.
                          <div className="text-sm mt-1">Complete a consultation to see it here.</div>
                        </div>
                      )}
                    </div>

                    {allPatientConsultations.length > 0 && (
                      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-sm text-slate-500">
                          Showing {Math.min(allPatientConsultations.length, historyPageSize)} of {allPatientConsultations.length} records
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
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
                            Page {historyPage} of {totalHistoryPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                            disabled={historyPage >= totalHistoryPages}
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                              historyPage >= totalHistoryPages 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Session Progress Indicator */}
                    {detoxSessions.length > 0 && detoxSessions.length < 3 && (
                      <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-emerald-800">Detox Progress</span>
                          <span className="text-emerald-700">{detoxSessions.length}/3 sessions completed</span>
                        </div>
                        <div className="w-full bg-emerald-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(detoxSessions.length / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    {allPatientConsultations.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-blue-800">Summary</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-700">{allPatientConsultations.length}</div>
                            <div className="text-xs text-blue-600">Total Visits</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-teal-700">{detoxSessions.length}</div>
                            <div className="text-xs text-teal-600">Detox Sessions</div>
                          </div>
                        </div>
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