import React, { useState, useRef, useEffect } from 'react';
import { Droplets, Activity, ClipboardList, Save, CheckCircle, Calendar, User, Stethoscope, MessageSquare, Clock, FileText, Sun, Moon, SunMoon, TrendingUp, Download, ImagePlus, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { createDetoxSession, getAllDetoxSessions } from '../api/detoxSessionApi';
import { getAllConsultations, uploadReportImages } from '../api/consultationApi';
import { toast } from 'react-toastify';
import { generateDetoxPDF, generateConsultationPDF, generateSingleTopicPDF } from '../utils/pdfGenerator';
import PatientHistoryModal from './PatientHistoryModal';
import config from '../config.js';

const toAbsoluteUrl = (src) => {
  if (!src) return '';
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  return `${config.API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
};

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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localDetoxSessions, setLocalDetoxSessions] = useState([]);
  const [localConsultations, setLocalConsultations] = useState([]);
  const [uploadingEditor, setUploadingEditor] = useState('');

  // Admission Recommended flag
  const [admissionRecommended, setAdmissionRecommended] = useState(false);
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [admissionDoctorId, setAdmissionDoctorId] = useState('');
  const [admissionDoctorName, setAdmissionDoctorName] = useState('');
  const [admissionRemarks, setAdmissionRemarks] = useState('');
  
  // Image Preview Modal State
  const [previewImages, setPreviewImages] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const previewZoomRef = useRef(null);

  useEffect(() => {
    const el = previewZoomRef.current;
    if (!el || previewImages.length === 0) return;
    const onWheel = (e) => {
      e.preventDefault();
      setPreviewZoom(z => Math.min(5, Math.max(0.5, +(z + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [previewImages]);
  
  // Detox Notes state
  const [detoxNotes, setDetoxNotes] = useState('');
  const [uploadedDetoxImages, setUploadedDetoxImages] = useState([]);
  
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
      completed: sessions.length
    };
  };

  const getCompletedSessionTypes = (patientId) => {
    const sessions = localDetoxSessions.filter(d => String(d.patientId || d.patient_id) === String(patientId));
    return sessions.map(d => String(d.sessionType || '').toLowerCase());
  };

  const wrapImgHtml = (url) => `
    <span class="img-wrap" contenteditable="false">
      <img src="${url}" alt="Uploaded Image"/>
      <button type="button" class="img-remove-btn" onmousedown="event.preventDefault()" title="Remove image">&times;</button>
    </span>`;

  const handleUploadImages = async (e, editorKey, editorRef, setter) => {
    const files = Array.from(e.target.files || [])
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    if (!files.length) return;
    if (!editorRef.current) return;

    setUploadingEditor(editorKey);
    try {
      const res = await uploadReportImages(files);
      const urls = (res && res.urls) || [];
      if (!urls.length) throw new Error('No image URLs returned');

      const editor = editorRef.current;
      editor.focus();

      const imgs = urls.map(u => wrapImgHtml(toAbsoluteUrl(u))).join('');
      editor.innerHTML = `${editor.innerHTML}${imgs}`;

      if (setter) {
        setter(editor.innerHTML);
      }

      const newImgs = urls.map(u => ({ url: toAbsoluteUrl(u), name: u.split('/').pop() || 'image.jpg' }));
      setUploadedDetoxImages(prev => [...prev, ...newImgs]);

      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded.`);
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(err.message || 'Failed to upload images.');
    } finally {
      setUploadingEditor('');
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveGridImage = (urlToRemove) => {
    setUploadedDetoxImages(prev => prev.filter(img => img.url !== urlToRemove));
  };

  const uploadTool = (editorKey, editorRef, setter) => {
    const isUploading = uploadingEditor === editorKey;
    return (
      <label className={`cursor-pointer rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
        {isUploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><ImagePlus className="w-3.5 h-3.5 text-emerald-600" /> Upload Images</>}
        <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleUploadImages(e, editorKey, editorRef, setter)} disabled={isUploading} />
      </label>
    );
  };

  const ImageCardGrid = ({ images, allowRemove, onRemove }) => {
    if (!images || images.length === 0) return null;
    return (
      <div className="mt-3">
        <div className="flex items-center gap-2 mb-2">
          <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded Images ({images.length})</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={`${img.url}-${idx}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group/upload relative">
              {allowRemove && (
                <button
                  type="button"
                  onClick={() => onRemove && onRemove(img.url)}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity hover:bg-rose-600 z-10"
                  title="Remove"
                >
                  &times;
                </button>
              )}
              <div className="relative aspect-square bg-slate-100">
                <img src={img.url} alt={img.name || 'Uploaded image'} className="w-full h-full object-contain p-1" />
              </div>
              <div className="px-2 pt-1.5 pb-2 flex items-center justify-between gap-1">
                <p className="text-[11px] font-semibold text-slate-700 truncate" title={img.name}>{img.name}</p>
                <button type="button" onClick={() => { setPreviewImages(images.map(i => ({url: i.url}))); setPreviewImageIndex(idx); setPreviewZoom(1); }} className="shrink-0 w-6 h-6 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-500 flex items-center justify-center transition" title="View">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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

  const RichTextEditor = ({ editorKey = 'default', editorRef, content, setContent, placeholder }) => {
    const placeholderRef = useRef(null);
    const hasImages = /<img[^>]*>/i.test(content || '');

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
            </button>
          </div>
          {uploadTool(editorKey, editorRef, setContent)}
        </div> 
        
        <div className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div
              ref={editorRef}
              contentEditable
              tabIndex={0}
              suppressContentEditableWarning
              onInput={handleInput}
              onBlur={e => setContent(e.currentTarget.innerHTML)}
              className={`editor-content ${hasImages ? 'min-h-[60px]' : 'min-h-[200px]'} text-sm leading-6 text-slate-800 focus:outline-none`}
              dangerouslySetInnerHTML={{ __html: content }}
            />
            <div ref={placeholderRef} className="absolute top-3 left-3 text-slate-400 text-sm pointer-events-none" style={{ display: 'none' }}>
              {placeholder}
            </div>
            <ImageCardGrid images={uploadedDetoxImages} allowRemove onRemove={handleRemoveGridImage} />
          </div>
        </div>
      </div>
    );
  };

  const HistoryRecordContent = ({ html, emptyText }) => {
    if (!html || html === '<br>') return <p className="text-slate-500 italic">{emptyText}</p>;
    
    // Extract images
    const div = document.createElement('div');
    div.innerHTML = html;
    const imgSrcs = Array.from(div.querySelectorAll('img')).map(img => img.src).filter(Boolean);
    
    // Strip images and img-wrap (which includes the X button) from HTML
    const textOnlyHtml = html
      .replace(/<span class="img-wrap"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<img[^>]*>/gi, '')
      .replace(/(<br\s*\/?>\s*){2,}/gi, '')
      .replace(/^(\s*<br\s*\/?>\s*)+|(\s*<br\s*\/?>\s*)+$/gi, '')
      .trim();

    return (
      <div>
        {textOnlyHtml && textOnlyHtml !== '<br>' && (
          <div className="mb-3" dangerouslySetInnerHTML={{ __html: textOnlyHtml }} />
        )}
        {imgSrcs.length > 0 && (
          <div className="mt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {imgSrcs.map((src, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={() => {
                    setPreviewImages(imgSrcs.map(url => ({ url })));
                    setPreviewImageIndex(idx);
                    setPreviewZoom(1);
                  }}
                  className="block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative aspect-square bg-slate-100 hover:ring-2 hover:ring-emerald-400 transition-all cursor-zoom-in w-full text-left"
                >
                  <img src={src} alt="Uploaded image" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          </div>
        )}
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
    const isCheckedIn = a.status === 'Checked-in' || a.status === 'Started Detox';
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

  useEffect(() => {
    if (activePt) {
      const completedTypes = getCompletedSessionTypes(activePt.id);
      if (!completedTypes.includes('morning')) {
        setSessionType('morning');
      } else if (!completedTypes.includes('evening')) {
        setSessionType('evening');
      } else {
        setSessionType('fullDay');
      }
    }
  }, [activePt?.id, localDetoxSessions]);

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

  const hasCompletedThreeDetoxSessions = (patientId) => {
    // We no longer limit to 3 sessions per appointment
    return false;
  };

  const getConsultationFollowupRecommendation = (record, patientId) => {
    const followupDateValue = record.followup_date || record.followupDate;
    const followupRemarksValue = record.followup_remarks || record.followupRemarks;
    const forceReview = hasCompletedThreeDetoxSessions(patientId) && Boolean(followupDateValue);

    if (forceReview) {
      return {
        type: 'review',
        date: followupDateValue,
        remarks: followupRemarksValue
      };
    }

    if (record.detox_recommended) {
      return {
        type: 'detox',
        doctorName: record.detox_doctor_name,
        date: followupDateValue,
        remarks: followupRemarksValue
      };
    }

    if (followupDateValue) {
      return {
        type: 'review',
        date: followupDateValue,
        remarks: followupRemarksValue
      };
    }

    return { type: null };
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
      
      const selectedAdmissionDoctor = doctors.find(d => String(d.id) === String(admissionDoctorId));

      const detoxData = {
        patientId: activePt.id,
        doctorId: doctorId || null,
        appointmentId: activeAppt.id ? parseInt(String(activeAppt.id).replace(/^\D+/g, ''), 10) : null,
        sessionNumber: detoxHistory.length + 1, // Increment session number
        sessionType: sessionType,
        sessionDate: new Date().toISOString(),
        detoxNotes: detoxNotes || '',
        followupDate: followupDate,
        followupRemarks: followupRemarks,
        admission_recommended: admissionRecommended,
        admission_date: admissionRecommended ? admissionDate : null,
        admission_doctor_id: admissionRecommended && admissionDoctorId ? parseInt(admissionDoctorId) : null,
        admission_doctor_name: admissionRecommended && selectedAdmissionDoctor ? selectedAdmissionDoctor.name : null,
        admission_remarks: admissionRecommended ? admissionRemarks : null
      };
      
      console.log('💾 Saving detox session:', detoxData);
      const savedSession = await createDetoxSession(detoxData);
      console.log('✅ Detox session saved:', savedSession);
      
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
      setUploadedDetoxImages([]);
      setSessionType('morning');
      setFollowupDate(new Date().toISOString().split('T')[0]);
      setFollowupRemarks('Call patient later to confirm detox preparation and next steps.');
      if (detoxEditorRef.current) {
        detoxEditorRef.current.innerHTML = '';
      }
      
      toast.success(`Detox ${sessionTypeDisplay} (Session ${detoxHistory.length + 1}) completed successfully!`);
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
        .editor-content img, .history-list img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; border: 1px solid #e2e8f0; }
        .editor-content .img-wrap { display: none; }
        .editor-content .img-wrap img { margin: 0; display: block; cursor: zoom-in; }
        .editor-content .img-remove-btn { position: absolute; top: -7px; right: -7px; width: 22px; height: 22px; border-radius: 9999px; background: #ef4444; color: #fff; border: 2px solid #fff; font-weight: 700; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.35); opacity: 0; transition: opacity .2s; }
        .editor-content .img-wrap:hover .img-remove-btn { opacity: 1; }
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
              Manage detox procedures for patients. Add and track detox sessions.
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
<div className={`text-[13px] font-bold px-2 py-1 rounded-full flex items-center gap-1 bg-emerald-100 text-emerald-700`}>
  <Activity className="w-3 h-3" />
  <span>{sessionCount.completed} Sessions</span>
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
                          {getPatientSessionCount(activePt.id).completed} Sessions Completed
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
                    onClick={() => setShowHistoryModal(true)}
                    className="rounded-full px-4 py-2 text-sm font-semibold transition flex items-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <ClipboardList className="w-4 h-4" />
                    History
                  </button>
                </div>

                {showHistoryModal && (
                  <PatientHistoryModal
                    patient={activePt}
                    consultations={localConsultations}
                    detoxSessions={localDetoxSessions}
                    appointments={appointments}
                    doctors={doctors}
                    onClose={() => setShowHistoryModal(false)}
                    activeRole={activeRole}
                    currentUser={currentUser}
                  />
                )}

                {selectedTab === 'detox' && (
                  <>
                    {/* Show current session info */}
                    <div className="px-5 pt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">Current Session</span>
                          </div>
                            Session {getPatientSessionCount(activePt.id).completed + 1}
                        </div>
                      </div>
                    </div>

                    {/* Session Type Selection */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" /> 
                        Select Session Type
                      </h3>
                      
                      {(() => {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => setSessionType('morning')}
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
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
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
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
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
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
                        );
                      })()}
                    </div>

                    {/* Detox Notes Section */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" /> 
                        Detox Session Notes
                      </h3>
                      
                      {!canAddSession ? (
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
                          placeholder={`Enter detox procedure notes for Session ${getPatientSessionCount(activePt.id).completed + 1}...`}
                          extraTools={uploadTool('detoxNotes', detoxEditorRef, setDetoxNotes)}
                          grid={<ImageCardGrid images={uploadedDetoxImages} allowRemove onRemove={handleRemoveGridImage} />}
                        />
                      )}
                    </div>

                    {/* Followup Section */}
                    {canAddSession && (
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

                    {/* Admission Recommendation */}
                    {canAddSession && (
                      <div className={`p-5 border-b ${admissionRecommended ? 'bg-sky-50 border-sky-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <input 
                            type="checkbox" 
                            id="admissionCheckDetox" 
                            checked={admissionRecommended}
                            onChange={e => setAdmissionRecommended(e.target.checked)}
                            className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                          />
                          <label htmlFor="admissionCheckDetox" className="font-bold text-slate-800 text-sm">Recommend for Admission</label>
                        </div>
                        {admissionRecommended && (
                          <div className="ml-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <label className="block text-xs font-semibold text-slate-600"><User className="inline w-3.5 h-3.5 mr-1 text-sky-600" />Admission Doctor</label>
                                <select value={admissionDoctorId} onChange={e => setAdmissionDoctorId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                                  <option value="">Select Admission Doctor</option>
                                  {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-600"><Calendar className="inline w-3.5 h-3.5 mr-1 text-sky-600" />Admission Date</label>
                                <input type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600"><MessageSquare className="inline w-3.5 h-3.5 mr-1 text-sky-600" />Remarks for Receptionist</label>
                              <textarea 
                                rows={2} 
                                placeholder="Enter remarks for admission..." 
                                value={admissionRemarks}
                                onChange={e => setAdmissionRemarks(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                            <p className="text-xs text-sky-700 mt-1.5 font-medium">The patient will be scheduled for admission under the selected doctor.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="p-5 bg-slate-50 flex justify-end gap-3">

                      <button
                        onClick={handleSaveDetoxSession}
                        disabled={!canAddSession || !detoxNotes.trim() || isSaving}
                        className={`font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${
                          (!canAddSession || !detoxNotes.trim() || isSaving) 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" /> 
                            Save Session {getPatientSessionCount(activePt.id).completed + 1}
                          </>
                        )}
                      </button>
                    </div>
                  </>
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

      {/* Image Zoom Preview Modal */}
      {previewImages.length > 0 && (
        <div className="fixed inset-0 z-[999] bg-black/85 flex items-center justify-center p-6" onClick={() => { setPreviewImages([]); setPreviewImageIndex(0); setPreviewZoom(1); }}>
          {previewImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(i => (i > 0 ? i - 1 : previewImages.length - 1)); setPreviewZoom(1); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10"
              title="Previous Image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          <div ref={previewZoomRef} className="flex items-center justify-center w-full h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImages[previewImageIndex]?.url}
              alt="Zoomed preview"
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain select-none"
              style={{ transform: `scale(${previewZoom})`, transition: 'transform 0.2s ease' }}
            />
          </div>
          {previewImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(i => (i < previewImages.length - 1 ? i + 1 : 0)); setPreviewZoom(1); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10"
              title="Next Image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          <button
            type="button"
            onClick={() => { setPreviewImages([]); setPreviewImageIndex(0); setPreviewZoom(1); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white text-xl font-bold flex items-center justify-center transition-colors"
            title="Close"
          >
            ✕
          </button>
          {previewImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-semibold text-sm bg-black/40 px-3 py-1 rounded-full">
              {previewImageIndex + 1} of {previewImages.length}
            </div>
          )}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-4 py-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewZoom(z => Math.max(0.5, +(z - 0.2).toFixed(2)))}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white text-lg font-bold flex items-center justify-center transition-colors"
              title="Zoom out"
            >
              −
            </button>
            <span className="text-white text-xs font-medium min-w-[48px] text-center">{Math.round(previewZoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setPreviewZoom(z => Math.min(5, +(z + 0.2).toFixed(2)))}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white text-lg font-bold flex items-center justify-center transition-colors"
              title="Zoom in"
            >
              ＋
            </button>
            <button
              type="button"
              onClick={() => setPreviewZoom(1)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors"
              title="Reset zoom to 100%"
            >
              1:1
            </button>
          </div>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 mb-14 text-white/50 text-xs">Scroll (mouse wheel) to zoom · Click outside or ✕ to close</span>
        </div>
      )}
    </>
  );
}