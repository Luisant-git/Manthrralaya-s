import React, { useState, useRef, useEffect } from 'react';
import { Stethoscope, Activity, ClipboardList, Save, CheckCircle, Droplets, FileText, Calendar, User, Clock, MessageSquare, Sun, Moon, SunMoon, Download, Phone, Mail, ImagePlus, Eye, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAllDetoxSessions } from '../api/detoxSessionApi';
import { generateConsultationPDF, generateDetoxPDF, generateSingleTopicPDF, buildConsultationPdfBlob } from '../utils/pdfGenerator';
import { uploadConsultationPdf, uploadReportImages } from '../api/consultationApi';
import config from '../config.js';
import PatientHistoryModal from './PatientHistoryModal';

const toAbsoluteUrl = (src) => {
  if (!src) return '';
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  return `${config.API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
};

export default function ConsultationsView({ appointments, patients, doctors, consultations, dietCharts, onAddConsultation, onAddDietChart, activeRole, currentUser }) {
  const [selectedApptId, setSelectedApptId] = useState('');
  const [selectedTab, setSelectedTab] = useState('consultation');
  const [historySubTab, setHistorySubTab] = useState('consultations');
  const [historyPage, setHistoryPage] = useState(1);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [historyAppended, setHistoryAppended] = useState(false);
  const [detoxSessions, setDetoxSessions] = useState([]);
  const [lastSavedConsultation, setLastSavedConsultation] = useState(null);
  const [savedActivePt, setSavedActivePt] = useState(null);
  const [isSendingWA, setIsSendingWA] = useState(false);
  
  // Forms states
  const [consultationNotes, setConsultationNotes] = useState('');
  const [reviewRecommended, setReviewRecommended] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState('');
  const [medicalReports, setMedicalReports] = useState('');
  const [detoxProcedure, setDetoxProcedure] = useState('');
  const [dietPlanNote, setDietPlanNote] = useState('');
  const [homeCare, setHomeCare] = useState('');
  const [uploadingEditor, setUploadingEditor] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const previewZoomRef = useRef(null);
  const [uploadedBySection, setUploadedBySection] = useState({ medicalHistory: [], consultationNotes: [], medicalReports: [], detoxProcedure: [], dietPlan: [] });
  
  const consultationEditorRef = useRef(null);
  const medicalHistoryEditorRef = useRef(null);
  const medicalReportsEditorRef = useRef(null);
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

      setter(editor.innerHTML);
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded.`);
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(err.message || 'Failed to upload images.');
    } finally {
      setUploadingEditor('');
      if (e.target) e.target.value = '';
    }
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <ImageCardGrid images={imgSrcs.map(url => ({ url, name: url.split('/').pop() || 'image.jpg' }))} allowRemove={false} />
        )}
      </div>
    );
  };

  const sectionEditorMap = {
    medicalHistory: { ref: medicalHistoryEditorRef, setter: setMedicalHistory },
    consultationNotes: { ref: consultationEditorRef, setter: setConsultationNotes },
    medicalReports: { ref: medicalReportsEditorRef, setter: setMedicalReports },
    detoxProcedure: { ref: detoxProcedureEditorRef, setter: setDetoxProcedure },
    dietPlan: { ref: dietPlanEditorRef, setter: setDietPlanNote }
  };

  const handleRemoveGridImage = (sectionKey, url) => {
    const entry = sectionEditorMap[sectionKey];
    const editor = entry?.ref?.current;
    if (!editor) return;
    editor.querySelectorAll('img').forEach(img => {
      if (img.src === url) {
        const wrap = img.closest('.img-wrap');
        (wrap || img).remove();
      }
    });
    entry.setter(editor.innerHTML);
  };

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

  useEffect(() => {
    const next = {};
    Object.keys(sectionEditorMap).forEach(key => {
      const el = sectionEditorMap[key].ref.current;
      const seen = [];
      if (el) {
        el.querySelectorAll('img').forEach(img => {
          if (img.src && !seen.some(x => x.url === img.src)) {
            const rawName = decodeURIComponent((img.src.split('/').pop() || 'image').replace(/^\d+-\d+-/, ''));
            seen.push({ url: img.src, name: rawName || 'uploaded image', size: 0 });
          }
        });
      }
      next[key] = seen;
    });
    setUploadedBySection(next);
  }, [medicalReports, consultationNotes, medicalHistory, detoxProcedure, dietPlanNote]);

  // Diet Chart sub-form
  const [diet, setDiet] = useState({ morning: '', breakfast: '', lunch: '', evening: '', dinner: '', remarks: '' });
  
  // Detox Recommended flag
  const [detoxRecommended, setDetoxRecommended] = useState(false);
  const [detoxDoctorId, setDetoxDoctorId] = useState('');
  const [detoxFollowupDate, setDetoxFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [detoxFollowupRemarks, setDetoxFollowupRemarks] = useState('');
  const [detoxMorningSessions, setDetoxMorningSessions] = useState('');
  const [detoxEveningSessions, setDetoxEveningSessions] = useState('');
  const todayDate = new Date().toLocaleDateString('en-CA');

  // Admission Recommended flag
  const [admissionRecommended, setAdmissionRecommended] = useState(false);
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [admissionDoctorId, setAdmissionDoctorId] = useState('');
  const [admissionDoctorName, setAdmissionDoctorName] = useState('');
  const [admissionRemarks, setAdmissionRemarks] = useState('');

  const sessionCountOptions = ['', ...Array.from({ length: 10 }, (_, i) => i + 1)];

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
    return type.includes('detox') || type.includes('admission');
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
  const historyPageSize = 1;
  
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
    setMedicalReports(prev => `${prev || ''}${prev ? '<br/><br/>' : ''}${latestHistory.medical_reports || ''}`);
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
      const selectedAdmissionDoctor = availableDoctors.find(d => String(d.id) === String(admissionDoctorId));
      
      const newCons = {
        patient_id: Number(activePt.id),
        patient_name: activePt.name,
        doctor_id: doctorId ? Number(doctorId) : null,
        doctor_name: doctorName,
        date: new Date().toISOString().split('T')[0],
        consultation_notes: consultationNotes,
        medical_history: medicalHistory,
        medical_reports: medicalReports,
        detox_procedure: detoxProcedure,
        diet_plan_note: dietPlanNote,
        home_care: homeCare,
        detox_recommended: detoxRecommended,
        detox_doctor_id: detoxRecommended && detoxDoctorId ? parseInt(detoxDoctorId) : null,
        detox_doctor_name: detoxRecommended && selectedDetoxDoctor ? selectedDetoxDoctor.name : null,
        detox_morning_sessions: detoxRecommended && detoxMorningSessions ? parseInt(detoxMorningSessions) : 0,
        detox_evening_sessions: detoxRecommended && detoxEveningSessions ? parseInt(detoxEveningSessions) : 0,
        followup_date: (detoxRecommended || reviewRecommended) ? detoxFollowupDate : null,
        followup_remarks: (detoxRecommended || reviewRecommended) ? detoxFollowupRemarks : null,
        admission_recommended: admissionRecommended,
        admission_date: admissionRecommended ? admissionDate : null,
        admission_doctor_id: admissionRecommended && admissionDoctorId ? parseInt(admissionDoctorId) : null,
        admission_doctor_name: admissionRecommended && selectedAdmissionDoctor ? selectedAdmissionDoctor.name : null,
        admission_remarks: admissionRecommended ? admissionRemarks : null
      };

      const savedConsultation = await onAddConsultation(newCons, activeAppt.id);
      
      // Store the saved consultation data and patient info for optional WhatsApp sending
      setLastSavedConsultation({ ...newCons, id: savedConsultation?.id });
      setSavedActivePt({ ...activePt });

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
      
      setIsSaved(true);
     
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast.error('Failed to save consultation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToWhatsApp = async () => {
    if (!lastSavedConsultation) {
      toast.warn('Please save the consultation first before sending to WhatsApp.');
      return;
    }
    const patientPhone = activePt?.phone || savedActivePt?.phone;
    if (!patientPhone) {
      toast.error('Patient has no phone number on record.');
      return;
    }

    setIsSendingWA(true);
    try {
      const { blob, fileName } = await buildConsultationPdfBlob(lastSavedConsultation, null, ['Medical History', 'Detox Procedure']);
      const formData = new FormData();
      formData.append('file', blob, fileName);
      if (lastSavedConsultation.id) {
        await uploadConsultationPdf(lastSavedConsultation.id, formData);
        toast.success('Consultation PDF sent via WhatsApp successfully!');
      } else {
        toast.error('Consultation record ID not found.');
      }
    } catch (waError) {
      console.error('WhatsApp send error:', waError);
      toast.error('Failed to send PDF via WhatsApp. Please try again.');
    } finally {
      setIsSendingWA(false);
    }
  };

  const handleHistorySendToWhatsApp = async (record) => {
    if (!activePt?.phone) {
      toast.error('Patient has no phone number on record.');
      return;
    }

    setIsSendingWA(true);
    try {
      const consData = { ...record, patient_name: activePt.name };
      const { blob, fileName } = await buildConsultationPdfBlob(consData, null, ['Medical History', 'Detox Procedure']);
      const formData = new FormData();
      formData.append('file', blob, fileName);
      if (record.id) {
        await uploadConsultationPdf(record.id, formData);
        toast.success('Consultation PDF sent via WhatsApp successfully!');
      } else {
        toast.error('Consultation record ID not found.');
      }
    } catch (waError) {
      console.error('WhatsApp send error:', waError);
      toast.error('Failed to send PDF via WhatsApp. Please try again.');
    } finally {
      setIsSendingWA(false);
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

  const handlePreviewImage = (e) => {
    const target = e.target;
    if (!target || !target.closest) return;
    if (target.closest('[contenteditable="true"]')) return;
    const img = target.tagName === 'IMG' ? target : target.closest('img');
    if (img && img.src) {
      const container = e.currentTarget;
      const allImgs = Array.from(container.querySelectorAll('img')).map(i => i.src);
      const uniqueImgs = [...new Set(allImgs)];
      let index = uniqueImgs.indexOf(img.src);
      if (index === -1) index = 0;
      setPreviewImages(uniqueImgs.map(url => ({ url })));
      setPreviewImageIndex(index);
      setPreviewZoom(1);
    }
  };

  // Reusable Editor Component
  const RichTextEditor = ({ editorRef, content, setContent, placeholder, extraTools, grid }) => {
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

    const handleEditorClick = (e) => {
      const target = e.target;
      if (!target || !target.closest) return;

      const removeBtn = target.closest('.img-remove-btn');
      if (removeBtn) {
        const wrap = removeBtn.closest('.img-wrap');
        if (wrap) {
          wrap.remove();
          if (editorRef.current) setContent(editorRef.current.innerHTML);
        }
        return;
      }

      const img = target.tagName === 'IMG' ? target : target.closest('img');
      if (img) {
        const container = e.currentTarget;
        const allImgs = Array.from(container.querySelectorAll('img')).map(i => i.src);
        const uniqueImgs = [...new Set(allImgs)];
        let index = uniqueImgs.indexOf(img.src);
        if (index === -1) index = 0;
        setPreviewImages(uniqueImgs.map(url => ({ url })));
        setPreviewImageIndex(index);
        setPreviewZoom(1);
      }
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
          <div className="flex gap-1 ml-1 border-l border-slate-200 pl-2">
            <button type="button" onClick={() => applyEditorCommand('justifyLeft', null, editorRef, setContent)} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Left">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <button type="button" onClick={() => applyEditorCommand('justifyCenter', null, editorRef, setContent)} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Center">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <button type="button" onClick={() => applyEditorCommand('justifyRight', null, editorRef, setContent)} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Right">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="9" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
          {extraTools}
        </div>
        <div className="relative">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div ref={editorRef} contentEditable tabIndex={0} suppressContentEditableWarning onInput={handleInput} onClick={handleEditorClick} onBlur={e => setContent(e.currentTarget.innerHTML)} className={`editor-content ${hasImages ? 'min-h-[60px]' : 'min-h-[140px]'} text-sm leading-6 text-slate-800 focus:outline-none`} dangerouslySetInnerHTML={{ __html: content }} />
            <div ref={placeholderRef} className="absolute top-3 left-3 text-slate-400 text-sm pointer-events-none" style={{ display: 'none' }}>{placeholder}</div>
            {grid}
          </div>
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
        .editor-content img, .history-list img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; border: 1px solid #e2e8f0; }
        .editor-content .img-wrap { display: none; }
        .editor-content .img-wrap img { margin: 0; display: block; cursor: zoom-in; }
        .editor-content .img-remove-btn { position: absolute; top: -7px; right: -7px; width: 22px; height: 22px; border-radius: 9999px; background: #ef4444; color: #fff; border: 2px solid #fff; font-weight: 700; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.35); opacity: 0; transition: opacity .2s; }
        .editor-content .img-wrap:hover .img-remove-btn { opacity: 1; }
        [contenteditable="true"] ul, [contenteditable="true"] ol { padding-left: 1.5rem; }
        [contenteditable="true"] ul { list-style-type: disc; }
        [contenteditable="true"] ol { list-style-type: decimal; }
        .history-list ul, .history-list ol { margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; }
        .history-list ul { list-style-type: disc; }
        .history-list ol { list-style-type: decimal; }
        .history-list li { margin-bottom: 0.25rem; }
        .history-list { font-size: 0.875rem; }
        .history-list img { cursor: zoom-in; }
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
                  <button type="button" onClick={() => setShowHistoryModal(true)} className="rounded-full px-4 py-2 text-sm font-semibold transition bg-slate-100 text-slate-600 hover:bg-slate-200">History</button>
                </div>

                {showHistoryModal && (
                  <PatientHistoryModal
                    patient={activePt}
                    consultations={consultations}
                    detoxSessions={detoxSessions}
                    appointments={appointments}
                    doctors={doctors}
                    onClose={() => setShowHistoryModal(false)}
                    activeRole={activeRole}
                    currentUser={currentUser}
                  />
                )}

                {selectedTab === 'consultation' && (
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
                        <RichTextEditor editorRef={medicalHistoryEditorRef} content={medicalHistory} setContent={setMedicalHistory} placeholder="Enter patient medical history..." extraTools={uploadTool('medicalHistory', medicalHistoryEditorRef, setMedicalHistory)} grid={<ImageCardGrid images={uploadedBySection['medicalHistory']} allowRemove onRemove={(url) => handleRemoveGridImage('medicalHistory', url)} />} />
                      </div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Notes  [Prescription]</label><RichTextEditor editorRef={consultationEditorRef} content={consultationNotes} setContent={setConsultationNotes} placeholder="Enter consultation notes here..." extraTools={uploadTool('consultationNotes', consultationEditorRef, setConsultationNotes)} grid={<ImageCardGrid images={uploadedBySection['consultationNotes']} allowRemove onRemove={(url) => handleRemoveGridImage('consultationNotes', url)} />} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Medical Reports</label>
                        <RichTextEditor
                          editorRef={medicalReportsEditorRef}
                          content={medicalReports}
                          setContent={setMedicalReports}
                          placeholder="Enter medical reports or upload images (reports, scans, lab results)..."
                          extraTools={uploadTool('medicalReports', medicalReportsEditorRef, setMedicalReports)}
                          grid={<ImageCardGrid images={uploadedBySection['medicalReports']} allowRemove onRemove={(url) => handleRemoveGridImage('medicalReports', url)} />}
                        />
                        <p className="text-xs text-slate-400 mt-1.5">You can upload multiple images. They will be embedded into the report and included in the PDF.</p>
                      </div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Detox Procedure Note</label><RichTextEditor editorRef={detoxProcedureEditorRef} content={detoxProcedure} setContent={setDetoxProcedure} placeholder="Enter detox procedure notes..." extraTools={uploadTool('detoxProcedure', detoxProcedureEditorRef, setDetoxProcedure)} grid={<ImageCardGrid images={uploadedBySection['detoxProcedure'] || []} allowRemove onRemove={(url) => handleRemoveGridImage('detoxProcedure', url)} />} /></div>
                    </div>

                    {/* 2. Diet Plan Note */}
                    <div className="p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-emerald-600" /> 2. Diet Plan Note</h3>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Diet Plan Note</label><RichTextEditor editorRef={dietPlanEditorRef} content={dietPlanNote} setContent={setDietPlanNote} placeholder="Enter diet plan notes..." extraTools={uploadTool('dietPlan', dietPlanEditorRef, setDietPlanNote)} grid={<ImageCardGrid images={uploadedBySection['dietPlan'] || []} allowRemove onRemove={(url) => handleRemoveGridImage('dietPlan', url)} />} /></div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Home Care Guidelines</label><input type="text" value={homeCare} onChange={e => setHomeCare(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" /></div>
                    </div>

                    {/* 3. Detox Recommendation */}
                    <div className={`p-5 border-y ${detoxRecommended ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
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
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[170px] space-y-2">
                              <label className="block text-xs font-semibold text-slate-600 whitespace-nowrap">Assign Detox Doctor</label>
                              <select value={detoxDoctorId} onChange={e => setDetoxDoctorId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                                <option value="">Select Detox Doctor</option>
                                {availableDoctors.length > 0 ? (availableDoctors.map(doc => (<option key={doc.id} value={doc.id}>Dr. {doc.name || doc.user?.fullName} — {doc.specialization || 'General'}</option>))) : (<option disabled>No doctors available</option>)}
                              </select>
                            </div>
                            <div className="w-28 space-y-2">
                              <label className="block text-xs font-semibold text-slate-600 whitespace-nowrap"><Sun className="inline w-3.5 h-3.5 mr-1 text-amber-500" />Morning</label>
                              <select value={detoxMorningSessions} onChange={e => setDetoxMorningSessions(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                                <option value="">Select</option>
                                {sessionCountOptions.filter(v => v !== '').map(n => (<option key={n} value={n}>{n}</option>))}
                              </select>
                            </div>
                            <div className="w-28 space-y-2">
                              <label className="block text-xs font-semibold text-slate-600 whitespace-nowrap"><Moon className="inline w-3.5 h-3.5 mr-1 text-indigo-500" />Evening</label>
                              <select value={detoxEveningSessions} onChange={e => setDetoxEveningSessions(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                                <option value="">Select</option>
                                {sessionCountOptions.filter(v => v !== '').map(n => (<option key={n} value={n}>{n}</option>))}
                              </select>
                            </div>
                            <div className="flex-1 min-w-[170px] space-y-2">
                              <label className="block text-xs font-semibold text-slate-600 whitespace-nowrap">Follow-up Date</label>
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

                    {/* Admission Recommendation */}
                    <div className={`p-5 border-b ${admissionRecommended ? 'bg-sky-50 border-sky-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="admissionCheck"
                          checked={admissionRecommended}
                          onChange={e => setAdmissionRecommended(e.target.checked)}
                          className="w-5 h-5 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                        />
                        <label htmlFor="admissionCheck" className="font-bold text-slate-800 text-sm">Recommend for Admission</label>
                      </div>
                      {admissionRecommended && (
                        <div className="mt-3 ml-8 space-y-3">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600"><User className="inline w-3.5 h-3.5 mr-1 text-sky-600" />Admission Doctor</label>
                              <select value={admissionDoctorId} onChange={e => setAdmissionDoctorId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                                <option value="">Select Admission Doctor</option>
                                {availableDoctors.length > 0 ? (availableDoctors.map(doc => (<option key={doc.id} value={doc.id}>Dr. {doc.name || doc.user?.fullName} — {doc.specialization || 'General'}</option>))) : (<option disabled>No doctors available</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600"><Calendar className="inline w-3.5 h-3.5 mr-1 text-sky-600" />Admission Date</label>
                              <input type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-600">Remarks for Receptionist</label>
                            <textarea
                              value={admissionRemarks}
                              onChange={e => setAdmissionRemarks(e.target.value)}
                              rows={2}
                              placeholder="e.g. Arrange bed on arrival, notify billing desk, patient needs assistance..."
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <p className="text-xs text-sky-700 mt-1.5 font-medium">The patient will be scheduled for admission under the selected doctor.</p>
                        </div>
                      )}
                    </div>

                    {/* 4. Review Recommendation (Conditional) */}
                    {!detoxRecommended && (
                      <div className={`p-5 border-b ${reviewRecommended ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
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

                    {/* Save & WhatsApp Actions */}
                    <div className="p-5 bg-slate-50 flex flex-wrap justify-end gap-3">

                     
                      <button onClick={handleCompleteConsultation} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Saving...</>) : (<><Save className="w-4 h-4" /> Save & Finalize Consultation</>)}
                      </button>
                    </div>
              </>
                )}
              </div>
            ) : isSaved && lastSavedConsultation && savedActivePt ? (
              <div className="divide-y divide-slate-100">
                {/* Saved Consultation Summary Header */}
                <div className="p-5 bg-emerald-50 flex justify-between items-center border-b border-emerald-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{savedActivePt.name}</h2>
                    <span className="text-sm text-slate-500">ID: P-{savedActivePt.id} • Phone: {savedActivePt.phone?.replace(/\D/g, '').slice(-10)}</span>
                  </div>
                  <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm">✓ Consultation Saved</div>
                </div>

                {/* WhatsApp Action Card */}
                <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[300px]">
                  <div className="bg-green-50 p-6 rounded-full">
                    <MessageSquare className="w-12 h-12 text-green-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-800">Consultation Saved Successfully</h3>
                    <p className="text-sm text-slate-500 mt-1">Send the PDF to the patient's WhatsApp or select a new patient.</p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handleSendToWhatsApp}
                      disabled={isSendingWA}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-base flex items-center gap-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingWA ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>Sending...</>
                      ) : (
                        <><MessageSquare className="w-5 h-5" /> Send to WhatsApp</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => generateConsultationPDF(lastSavedConsultation)}
                      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 px-8 rounded-lg text-base flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Download className="w-5 h-5" /> Download PDF
                    </button>
                  </div>
<p className="text-xs text-slate-400 mt-2">Patient: {savedActivePt.name} | Phone: {savedActivePt.phone || 'No phone'}</p>
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

      {/* Image Zoom Preview Modal */}
      {previewImages.length > 0 && (
        <div className="fixed inset-0 z-[999] bg-black/85 flex items-center justify-center p-6" onClick={() => { setPreviewImages([]); setPreviewImageIndex(0); setPreviewZoom(1); }}>
          
          {previewImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(i => (i > 0 ? i - 1 : previewImages.length - 1)); setPreviewZoom(1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-50 backdrop-blur"
              title="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}

          <div ref={previewZoomRef} className="flex items-center justify-center w-full h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImages[previewImageIndex]?.url}
              alt={`Zoomed preview ${previewImageIndex + 1} of ${previewImages.length}`}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain select-none"
              style={{ transform: `scale(${previewZoom})`, transition: 'transform 0.2s ease' }}
            />
          </div>

          {previewImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(i => (i < previewImages.length - 1 ? i + 1 : 0)); setPreviewZoom(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-50 backdrop-blur"
              title="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => { setPreviewImages([]); setPreviewImageIndex(0); setPreviewZoom(1); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white text-xl font-bold flex items-center justify-center transition-colors z-50"
            title="Close"
          >
            ✕
          </button>
          
          {previewImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide backdrop-blur z-50">
              {previewImageIndex + 1} / {previewImages.length}
            </div>
          )}

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-4 py-2 z-50" onClick={(e) => e.stopPropagation()}>
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
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 mb-14 text-white/50 text-xs z-50">Scroll (mouse wheel) to zoom · Click outside or ✕ to close</span>
        </div>
      )}
    </>
  );
}
