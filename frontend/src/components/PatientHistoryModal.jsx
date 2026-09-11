import React, { useState, useRef, useEffect } from 'react';
import { Stethoscope, Activity, Bed, RefreshCw, ClipboardList, ChevronLeft, ChevronRight, Star, FileText, X, User, Phone, Mail, Calendar as CalendarIcon, Droplets, Download, MessageSquare, Share2, Edit3, Save, Plus, ImagePlus, Loader2 } from 'lucide-react';
import { Sun, Moon, SunMoon } from 'lucide-react';
import { toast } from 'react-toastify';
import { generateConsultationPDF, generateDetoxPDF, buildConsultationPdfBlob } from '../utils/pdfGenerator';
import { uploadConsultationPdf, updateConsultation, createConsultation, uploadReportImages, toAbsoluteUrl } from '../api/consultationApi';
import { createAppointment, updateAppointment, updateAppointmentStatus } from '../api/appointmentApi';
import { createShare } from '../api/shareApi';

const wrapNewImgHtml = (url) =>
  `<span class="img-wrap" contenteditable="false"><img src="${url}" alt="Uploaded Image"/></span>`;
export default function PatientHistoryModal({
  patient,
  consultations = [],
  detoxSessions = [],
  appointments = [],
  doctors = [],
  onClose,
  onShare,
  onRefresh,
  fromDoctorId,
  currentUser,
  activeRole
}) {
  const [historyPage, setHistoryPage] = useState(1);
  const [historySubTab, setHistorySubTab] = useState('consultations');
  const [isSendingWA, setIsSendingWA] = useState(false);
  const [showWhatsappConfirmModal, setShowWhatsappConfirmModal] = useState(false);
  const [whatsappConsultationToSend, setWhatsappConsultationToSend] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareDoctor, setSelectedShareDoctor] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareQuery, setShareQuery] = useState('');
  const [isShareFocused, setIsShareFocused] = useState(false);
  const [showAddCons, setShowAddCons] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState('');
  const [previewZoom, setPreviewZoom] = useState(1);
  const previewZoomRef = useRef(null);
  const [isSavingNewCons, setIsSavingNewCons] = useState(false);
  const [isUploadingNewImg, setIsUploadingNewImg] = useState('');
  const [consForm, setConsForm] = useState({ doctorId: '', date: '' });
  const [newConsNotes, setNewConsNotes] = useState('');
  const [newConsMedHistory, setNewConsMedHistory] = useState('');
  const [newConsReports, setNewConsReports] = useState('');
  const [detoxProcedureNote, setDetoxProcedureNote] = useState('');
  const [dietPlanNote, setDietPlanNote] = useState('');
  const [homeCare, setHomeCare] = useState('');
  const [detoxRecommended, setDetoxRecommended] = useState(false);
  const [detoxDoctorId, setDetoxDoctorId] = useState('');
  const [detoxFollowupDate, setDetoxFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [detoxFollowupRemarks, setDetoxFollowupRemarks] = useState('');
  const [detoxMorningSessions, setDetoxMorningSessions] = useState('');
  const [detoxEveningSessions, setDetoxEveningSessions] = useState('');
  const [reviewRecommended, setReviewRecommended] = useState(false);
  const [admissionRecommended, setAdmissionRecommended] = useState(false);
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [admissionDoctorId, setAdmissionDoctorId] = useState('');
  const [admissionRemarks, setAdmissionRemarks] = useState('');
  const [addedConsultations, setAddedConsultations] = useState([]);
  const newConsNotesRef = useRef(null);
  const newConsMedHistoryRef = useRef(null);
  const newConsReportsRef = useRef(null);
  const detoxProcedureEditorRef = useRef(null);
  const dietPlanEditorRef = useRef(null);
  const newConsSessionCountOptions = ['', ...Array.from({ length: 10 }, (_, i) => i + 1)];
  const newConsFontSizeOptions = [
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '32px', value: '32px' },
  ];
  const handleShareToDoctor = async () => {
    if (!selectedShareDoctor) {
      toast.error('Please select a doctor to share with.');
      return;
    }
    setIsSharing(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const patientIdStr = String(patient.id || patient.patientId);

      const activeAppt = appointments.find(a => {
         const ptMatch = String(a.patient_id || a.patientId) === patientIdStr;
         const d = new Date(a.date || a.appointmentDate || 0);
         d.setHours(0, 0, 0, 0);
         const isToday = d.getTime() === today.getTime();
         const isActive = ['Scheduled', 'Arrived', 'Checked-in'].includes(a.status);
         return ptMatch && isToday && isActive;
      });

      if (!activeAppt) {
         // No active appointment today — create a Share record so the receiving doctor sees it
         const resolvedPatientId = Number(patient.id ?? patient.patientId ?? patient.patient_id ?? patient.patient?.id ?? patient.patient?.patientId);
         if (isNaN(resolvedPatientId)) {
           toast.error('Unable to resolve patient id for sharing');
           setIsSharing(false);
           return;
         }
         const payload = { patientId: resolvedPatientId, toDoctorId: parseInt(selectedShareDoctor), notes: 'Shared patient record' };
         console.debug('Creating share with payload', payload);
         try {
           await createShare(payload);
           toast.success('Patient record shared successfully!');
           try { onShare && onShare(); } catch (e) {}
         } catch (err) {
           console.error('Share API error:', err);
           toast.error('Failed to share patient record');
         }
         setShowShareModal(false);
         setSelectedShareDoctor('');
         setShareQuery('');
         setIsSharing(false);
         return;
      } else {

        await updateAppointment(activeAppt.id, {
          doctorId: parseInt(selectedShareDoctor),
          notes: (activeAppt.notes ? activeAppt.notes + " | " : "") + "Shared to another doctor."
        });
        // Ensure backend status is updated via dedicated endpoint
        try { await updateAppointmentStatus(activeAppt.id, 'Arrived'); } catch (e) { console.error('Failed to update appointment status:', e); }

        // Update local state to immediately reflect change
        activeAppt.doctorId = parseInt(selectedShareDoctor);
        activeAppt.doctor_id = parseInt(selectedShareDoctor);
        if (activeAppt.doctor) activeAppt.doctor.id = parseInt(selectedShareDoctor);
        activeAppt.status = "Arrived";
        activeAppt.notes = (activeAppt.notes ? activeAppt.notes + " | " : "") + "Shared to another doctor.";
      }

      toast.success('Patient record shared successfully!');
      // notify parent views to refresh data (e.g., doctor's dashboard)
      try { onShare && onShare(); } catch (e) { /* ignore */ }
      setShowShareModal(false);
      setSelectedShareDoctor('');
      setShareQuery('');
    } catch (error) {
      console.error('Error sharing record:', error);
      toast.error(error.message || 'Failed to share patient record');
    } finally {
      setIsSharing(false);
    }
  };
  const effectiveRole = (activeRole || currentUser?.role || '').toString().toUpperCase();
  const canCreateConsultation = !effectiveRole || effectiveRole === 'DOCTOR' || effectiveRole === 'ADMIN';

  const prepareAddCons = () => {
    const fromId = Number(fromDoctorId);
    let defaultDoctorId = '';
    if (fromId && doctorSelectOptions.some(d => Number(d.id) === fromId)) {
      defaultDoctorId = String(fromId);
    } else if (matchedCurrentDoctor) {
      defaultDoctorId = String(matchedCurrentDoctor.id);
    }
    setConsForm({ doctorId: defaultDoctorId, date: new Date().toISOString().split('T')[0] });
    setNewConsNotes('');
    setNewConsMedHistory('');
    setNewConsReports('');
    setDetoxProcedureNote('');
    setDietPlanNote('');
    setHomeCare('');
    setDetoxRecommended(false);
    setDetoxDoctorId('');
    setDetoxFollowupDate(new Date().toISOString().split('T')[0]);
    setDetoxFollowupRemarks('');
    setDetoxMorningSessions('');
    setDetoxEveningSessions('');
    setReviewRecommended(false);
    setAdmissionRecommended(false);
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setAdmissionDoctorId('');
    setAdmissionRemarks('');
    setShowAddCons(true);
  };

  const execOnEditor = (ref, setter, command, value = null) => {
    if (!ref?.current) return;
    ref.current.focus();
    document.execCommand(command, false, value);
    setter(ref.current.innerHTML);
  };

  const handleNewFontSizeChange = (e, ref, setter) => {
    if (!ref?.current) return;
    const fontSize = e.target.value;
    if (!fontSize) return;
    ref.current.focus();
    document.execCommand('styleWithCSS', false, true);
    let fontSizeValue = '3';
    switch (fontSize) {
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
    const fontElements = ref.current.querySelectorAll('font[size]');
    fontElements.forEach(el => {
      const span = document.createElement('span');
      let size = el.getAttribute('size');
      let pxValue = '16px';
      switch (size) {
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
    setter(ref.current.innerHTML);
    e.target.value = '';
  };

  const handleNewConsImageUpload = async (e, ref, setter) => {
    const files = Array.from(e.target.files || [])
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    if (!files.length || !ref.current) return;
    setIsUploadingNewImg('uploading');
    try {
      const res = await uploadReportImages(files);
      const urls = (res && res.urls) || [];
      if (!urls.length) throw new Error('No image URLs returned');
      const editor = ref.current;
      editor.focus();
      const imgs = urls.map(u => wrapNewImgHtml(toAbsoluteUrl(u))).join('<br/>');
      editor.innerHTML = `${editor.innerHTML}<br/>${imgs}`;
      setter(editor.innerHTML);
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded.`);
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(err.message || 'Failed to upload images.');
    } finally {
      setIsUploadingNewImg('');
      if (e.target) e.target.value = '';
    }
  };

  const NewConsToolbar = ({ refEl, setter }) => (
    <div className="mb-2 flex flex-wrap gap-2">
      <button type="button" onClick={() => execOnEditor(refEl, setter, 'bold')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Bold</button>
      <button type="button" onClick={() => execOnEditor(refEl, setter, 'italic')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Italic</button>
      <button type="button" onClick={() => execOnEditor(refEl, setter, 'underline')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Underline</button>
      <select onChange={(e) => handleNewFontSizeChange(e, refEl, setter)} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer" defaultValue="">
        <option value="" disabled>Font Size</option>
        {newConsFontSizeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
      <button type="button" onClick={() => execOnEditor(refEl, setter, 'insertUnorderedList')} className="rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Bullet List"><span className="text-base">•</span> Bullets</button>
      <button type="button" onClick={() => execOnEditor(refEl, setter, 'insertOrderedList')} className="rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Numbered List"><span className="text-xs font-bold">1.</span> Numbers</button>
      <div className="flex gap-1 ml-1 border-l border-slate-200 pl-2">
        <button type="button" onClick={() => execOnEditor(refEl, setter, 'justifyLeft')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Left">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <button type="button" onClick={() => execOnEditor(refEl, setter, 'justifyCenter')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Center">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <button type="button" onClick={() => execOnEditor(refEl, setter, 'justifyRight')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Right">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
      </div>
      <label className={`cursor-pointer rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 ${isUploadingNewImg ? 'opacity-50 pointer-events-none' : ''}`}>
        {isUploadingNewImg ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><ImagePlus className="w-3.5 h-3.5 text-emerald-600" /> Upload Images</>}
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleNewConsImageUpload(e, refEl, setter)} disabled={!!isUploadingNewImg} />
      </label>
    </div>
  );

  const handleCreateConsultation = async () => {
    if (!consForm.doctorId) {
      toast.error('Please select the assigned doctor.');
      return;
    }
    const notes = (newConsNotesRef.current?.innerHTML || '').trim();
    const medHistory = (newConsMedHistoryRef.current?.innerHTML || '').trim();
    const reports = (newConsReportsRef.current?.innerHTML || '').trim();
    const detoxText = (detoxProcedureEditorRef.current?.innerHTML || '').trim();
    const dietText = (dietPlanEditorRef.current?.innerHTML || '').trim();

    if (!detoxRecommended && !reviewRecommended && !admissionRecommended) {
      toast.warn('Please select either "Recommend Detox", "Recommend Review" or "Recommend for Admission" before finalizing.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const chosenDate = consForm.date || todayStr;
    const consultationDateTs = chosenDate === todayStr
      ? new Date()
      : new Date(`${chosenDate}T00:00:00`);

    const selectedDetoxDoctor = effectiveDoctors.find(d => String(d.id) === String(detoxDoctorId));
    const selectedAdmissionDoctor = effectiveDoctors.find(d => String(d.id) === String(admissionDoctorId));

    const payload = {
      patientId: Number(patient.id ?? patient.patientId),
      doctorId: parseInt(consForm.doctorId),
      consultationDate: consultationDateTs.toISOString(),
      consultationNotes: notes || '',
      medicalHistoryNotes: medHistory || '',
      medicalReports: reports || '',
      detoxProcedureNotes: detoxText || '',
      dietPlanNotes: dietText || '',
      homecareGuideliness: homeCare || '',
      detoxRecommended: detoxRecommended || false,
      detoxDoctorId: detoxRecommended && detoxDoctorId ? parseInt(detoxDoctorId) : null,
      detoxMorningSessions: detoxRecommended && detoxMorningSessions ? parseInt(detoxMorningSessions) : 0,
      detoxEveningSessions: detoxRecommended && detoxEveningSessions ? parseInt(detoxEveningSessions) : 0,
      followupDate: (detoxRecommended || reviewRecommended) && detoxFollowupDate ? detoxFollowupDate : null,
      followupRemarks: (detoxRecommended || reviewRecommended) ? detoxFollowupRemarks : null,
      admissionRecommended: admissionRecommended || false,
      admissionDate: admissionRecommended && admissionDate ? admissionDate : null,
      admissionDoctorId: admissionRecommended && admissionDoctorId ? parseInt(admissionDoctorId) : null,
        admissionRemarks: admissionRecommended ? admissionRemarks : null,
    };

    setIsSavingNewCons(true);
    try {
      const created = await createConsultation(payload);
      const doctorName = created.doctor?.user?.fullName || created.doctor?.fullName || created.doctor?.name || 'Assigned Doctor';
      const normalized = {
        id: created.id,
        patient_id: created.patientId,
        patientId: created.patientId,
        doctor_id: created.doctorId,
        doctorId: created.doctorId,
        doctor_name: doctorName,
        date: created.consultationDate ? new Date(created.consultationDate).toISOString().split('T')[0] : chosenDate,
        consultationDate: created.consultationDate,
        consultation_notes: created.consultationNotes || '',
        consultationNotes: created.consultationNotes || '',
        medical_history: created.medicalHistoryNotes || '',
        medicalHistoryNotes: created.medicalHistoryNotes || '',
        medical_reports: created.medicalReports || '',
        medicalReports: created.medicalReports || '',
        detox_procedure: created.detoxProcedureNotes || '',
        detoxProcedureNotes: created.detoxProcedureNotes || '',
        diet_plan_note: created.dietPlanNotes || '',
        dietPlanNote: created.dietPlanNotes || '',
        home_care: created.homecareGuideliness || '',
        homeCare: created.homecareGuideliness || '',
        detox_recommended: created.detoxRecommended,
        detox_doctor_id: created.detoxDoctorId,
        detox_doctor_name: selectedDetoxDoctor?.name || created.detoxDoctor?.user?.fullName,
        detox_morning_sessions: created.detoxMorningSessions || 0,
        detox_evening_sessions: created.detoxEveningSessions || 0,
        followup_date: created.followupDate,
        followup_remarks: created.followupRemarks,
        admission_recommended: created.admissionRecommended,
        admission_date: created.admissionDate,
        admission_doctor_id: created.admissionDoctorId,
        admission_doctor_name: selectedAdmissionDoctor?.name || created.admissionDoctor?.user?.fullName,
        admission_remarks: created.admissionRemarks,
      };
      setAddedConsultations(prev => [normalized, ...prev]);
      setShowAddCons(false);
      setHistorySubTab('consultations');
      setHistoryPage(1);
      toast.success('Consultation saved successfully.');
      try { onRefresh && onRefresh(); } catch (e) { /* ignore */ }
    } catch (error) {
      console.error('Error creating consultation:', error);
      toast.error(error.message || 'Failed to save consultation.');
    } finally {
      setIsSavingNewCons(false);
    }
  };

  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const historyItemsPerPage = 1;

  if (!patient) return null;

  // Prefer doctors with explicit Available status; if none, fall back to full list
  const availableDoctors = (doctors || []).filter(d => d.status === 'Available');
  const effectiveDoctors = availableDoctors.length > 0 ? availableDoctors : (doctors || []);

  const currentUserEmail = (currentUser?.email || (typeof currentUser === 'string' ? currentUser : '')).toLowerCase();
  const matchedCurrentDoctor = (doctors || []).find(d => {
    const dEmail = (d.user?.email || d.email || '').toLowerCase();
    const dName = (d.user?.fullName || d.name || '').toLowerCase();
    const dUsername = (d.user?.username || d.username || '').toLowerCase();
    return (dEmail && dEmail === currentUserEmail) || (dName && dName === currentUserEmail) || (dUsername && dUsername === currentUserEmail);
  }) || null;

  const doctorSelectOptions = (matchedCurrentDoctor && !effectiveDoctors.some(d => String(d.id) === String(matchedCurrentDoctor.id)))
    ? [...effectiveDoctors, matchedCurrentDoctor]
    : effectiveDoctors;

  const patientId = String(patient.id ?? patient.patientId);

  const patientConsultations = [...addedConsultations, ...consultations]
    .filter(c => String(c.patient_id || c.patientId) === patientId)
    .filter((c, i, arr) => arr.findIndex(x => String(x.id) === String(c.id)) === i)
    .sort((a, b) => new Date(b.date || b.consultationDate) - new Date(a.date || a.consultationDate));

  const patientDetoxSessions = detoxSessions
    .filter(d => String(d.patientId || d.patient_id) === patientId)
    .sort((a, b) => new Date(b.sessionDate || b.scheduled_date) - new Date(a.sessionDate || a.scheduled_date));

  const totalHistoryPages = historySubTab === 'consultations'
    ? Math.max(1, Math.ceil(patientConsultations.length / historyItemsPerPage))
    : Math.max(1, Math.ceil(patientDetoxSessions.length / historyItemsPerPage));

  const historyStartIndex = (historyPage - 1) * historyItemsPerPage;
  const currentConsultation = patientConsultations[historyStartIndex];
  const currentDetoxSession = patientDetoxSessions[historyStartIndex];

  const closeModal = () => {
    setHistoryPage(1);
    setShowWhatsappConfirmModal(false);
    
    setWhatsappConsultationToSend(null);
    setEditingSection(null);
    onClose && onClose();
  };

  const goToHistoryPage = (page) => {
    if (page >= 1 && page <= totalHistoryPages) {
      setHistoryPage(page);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toISOString().split('T')[0];
  };

  const getSessionTypeDisplay = (type) => {
    if (!type) return 'Session';
    const lowerType = type.toLowerCase();
    if (lowerType === 'morning') return 'Morning Session';
    if (lowerType === 'evening') return 'Evening Session';
    if (lowerType === 'fullday') return 'Full Day Session';
    return 'Session';
  };

  

  const startEditing = (section, content) => {
    setEditingSection(section);
    setEditContent(content || '');
  };

  const saveEdit = async (consultation, dbField) => {
    setIsSavingEdit(true);
    try {
      await updateConsultation(consultation.id, { [dbField]: editContent });
      // Update locally
      consultation[dbField] = editContent;
      // Some fields have dual naming in frontend, update both for safety
      if (dbField === 'consultationNotes') consultation.consultation_notes = editContent;
      if (dbField === 'medicalHistoryNotes') consultation.medical_history = editContent;
      if (dbField === 'dietPlanNotes') consultation.diet_plan_note = editContent;
      if (dbField === 'detoxProcedureNotes') consultation.detox_procedure = editContent;
      if (dbField === 'homecareGuideliness') consultation.home_care = editContent;
      if (dbField === 'medicalReports') consultation.medical_reports = editContent;

      toast.success('Notes updated successfully');
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error(error.message || 'Failed to update notes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const editEditorRef = useRef(null);

  const fontSizeOptions = [
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '32px', value: '32px' }
  ];

  const applyEditorCommand = (command, value = null) => {
    if (!editEditorRef?.current) return;
    editEditorRef.current.focus();
    document.execCommand(command, false, value);
    setEditContent(editEditorRef.current.innerHTML);
  };

  const handleFontSizeChange = (e) => {
    if (!editEditorRef?.current) return;
    const fontSize = e.target.value;
    if (!fontSize) return;

    editEditorRef.current.focus();
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

    const fontElements = editEditorRef.current.querySelectorAll('font[size]');
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

    setEditContent(editEditorRef.current.innerHTML);
    e.target.value = '';
  };

  const RichTextToolbar = () => (
    <div className="mb-2 flex flex-wrap gap-2">
      <button type="button" onClick={() => applyEditorCommand('bold')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Bold</button>
      <button type="button" onClick={() => applyEditorCommand('italic')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Italic</button>
      <button type="button" onClick={() => applyEditorCommand('underline')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Underline</button>
      <select onChange={handleFontSizeChange} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer" defaultValue="">
        <option value="" disabled>Font Size</option>
        {fontSizeOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
      <button type="button" onClick={() => applyEditorCommand('insertUnorderedList')} className="rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Bullet List"><span className="text-base">•</span> Bullets</button>
      <button type="button" onClick={() => applyEditorCommand('insertOrderedList')} className="rounded px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Numbered List"><span className="text-xs font-bold">1.</span> Numbers</button>
      <div className="flex gap-1 ml-1 border-l border-slate-200 pl-2">
        <button type="button" onClick={() => applyEditorCommand('justifyLeft')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Left">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <button type="button" onClick={() => applyEditorCommand('justifyCenter')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Center">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="6" y1="12" x2="18" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <button type="button" onClick={() => applyEditorCommand('justifyRight')} className="rounded px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1" title="Align Right">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="9" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );

  const confirmAndSendToWhatsApp = async () => {
    if (!whatsappConsultationToSend) {
      toast.error('No consultation selected to send.');
      return;
    }
    if (!patient?.phone) {
      toast.error('Patient has no phone number on record.');
      return;
    }
    setShowWhatsappConfirmModal(false);
    setIsSendingWA(true);
    try {
      const consData = { ...whatsappConsultationToSend, patient_name: patient.name };
      const { blob, fileName } = await buildConsultationPdfBlob(consData, null, ['Medical History', 'Detox Procedure']);
      const formData = new FormData();
      formData.append('file', blob, fileName);
      if (whatsappConsultationToSend.id) {
        await uploadConsultationPdf(whatsappConsultationToSend.id, formData);
        toast.success('Consultation PDF sent via WhatsApp successfully!');
      } else {
        toast.error('Consultation record ID not found.');
      }
    } catch (waError) {
      console.error('WhatsApp send error:', waError);
      toast.error('Failed to send PDF via WhatsApp. Please try again. ' + (waError.message || ''));
    } finally {
      setIsSendingWA(false);
    }
  };

  const handlePreviewImage = (e) => {
    const target = e.target;
    if (!target || !target.closest) return;
    if (target.closest('[contenteditable="true"]')) return;
    const img = target.tagName === 'IMG' ? target : target.closest('img');
    if (img && img.src) {
      setPreviewImageSrc(img.src);
      setPreviewZoom(1);
    }
  };

  useEffect(() => {
    const el = previewZoomRef.current;
    if (!el || !previewImageSrc) return;
    const onWheel = (e) => {
      e.preventDefault();
      setPreviewZoom(z => Math.min(5, Math.max(0.5, +(z + (e.deltaY < 0 ? 0.2 : -0.2)).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [previewImageSrc]);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeModal}>
          <style>{`
        .consultation-notes-content .img-remove-btn, .history-list .img-remove-btn { display: none !important; }
        .consultation-notes-content .img-wrap, .history-list .img-wrap { display: inline-block; max-width: 100%; }
        .consultation-notes-content .img-wrap img, .history-list .img-wrap img { cursor: zoom-in; }
        .consultation-notes-content img, .history-list img { cursor: zoom-in; }
      `}</style>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>

        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-5xl w-full modal-animate overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="sticky top-0 z-10">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{patient.name}</h2>
                    <p className="text-xs text-emerald-100">P-{patient.id || patient.patientId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button onClick={closeModal} className="p-2 rounded-full hover:bg-white/10 transition text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Patient Quick Info */}
              <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span className="text-slate-700">{patient.phone?.replace(/\D/g, '').slice(-10) || 'No phone'}</span>
                    </div>
                    {patient.email && patient.email.toLowerCase() !== 'n/a' && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        <span className="text-slate-700 truncate max-w-[200px]">{patient.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700">{patient.age || '--'} yrs, {patient.gender || '--'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="border-b border-slate-200 px-6 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                <button
                  onClick={() => { setHistorySubTab('consultations'); setHistoryPage(1); }}
                  className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${
                    historySubTab === 'consultations'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Consultations ({patientConsultations.length})
                  </span>
                </button>
                <button
                  onClick={() => { setHistorySubTab('detox'); setHistoryPage(1); }}
                  className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${
                    historySubTab === 'detox'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Detox Sessions ({patientDetoxSessions.length})
                  </span>
                </button>
                </div>
                {historySubTab === 'consultations' && canCreateConsultation && (
                  <button
                    onClick={prepareAddCons}
                    className="pb-3 flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <Plus className="w-4 h-4" />
                    </span>
                    Add Consultation
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="modal-content-scroll overflow-y-auto" style={{ maxHeight: 'calc(92vh - 200px)' }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    {historySubTab === 'consultations' ? (
                      <>
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-base font-bold text-slate-800">Consultation Notes</h3>
                      </>
                    ) : (
                      <>
                        <Droplets className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-base font-bold text-slate-800">Detox Session Details</h3>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {historySubTab === 'consultations' && currentConsultation && (
                      <>
                        <button
                          onClick={() => {
                            setWhatsappConsultationToSend(currentConsultation);
                            setShowWhatsappConfirmModal(true);
                          }}
                          disabled={isSendingWA}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <button
                          onClick={() => generateConsultationPDF(currentConsultation, null, [])}
                          className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Full PDF
                        </button>
                      </>
                    )}
                    {historySubTab === 'detox' && currentDetoxSession && (
                      <button
                        onClick={() => generateDetoxPDF(currentDetoxSession)}
                        className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" /> Full PDF
                      </button>
                    )}
                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                      {historySubTab === 'consultations' ? `${patientConsultations.length} total` : `${patientDetoxSessions.length} total`}
                    </div>
                  </div>
                </div>

                {/* Consultation History */}
                {historySubTab === 'consultations' && (
                  <>
                    {currentConsultation ? (
                      <div className="space-y-5" onClick={handlePreviewImage}>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Stethoscope className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{currentConsultation.doctor_name || 'Assigned Doctor'}</div>
                              <div className="text-xs text-emerald-600 font-medium">Clinical Consultant</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                              {currentConsultation.date}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">Visit Date</div>
                          </div>
                        </div>

                        {(currentConsultation.consultation_notes || currentConsultation.consultationNotes) && (currentConsultation.consultation_notes || currentConsultation.consultationNotes) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" /> Consultation Notes
                              </div>
                              <div className="flex items-center gap-2">
                                {editingSection === 'consultationNotes' ? (
                                  <>
                                    <button onClick={() => saveEdit(currentConsultation, 'consultationNotes')} disabled={isSavingEdit} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Save className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => setEditingSection(null)} className="text-slate-500 hover:text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <X className="w-3 h-3" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing('consultationNotes', currentConsultation.consultation_notes || currentConsultation.consultationNotes)} className="text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => generateConsultationPDF(currentConsultation, 'Consultation Notes')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Download className="w-3 h-3" /> Download
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {editingSection === 'consultationNotes' ? (
                              <>
                                <RichTextToolbar />
                                <div
                                  ref={editEditorRef}
                                  className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none consultation-notes-content"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => setEditContent(e.target.innerHTML)}
                                  dangerouslySetInnerHTML={{ __html: editContent }}
                                />
                              </>
                            ) : (
                              <div
                                className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100"
                                dangerouslySetInnerHTML={{ __html: currentConsultation.consultation_notes || currentConsultation.consultationNotes }}
                              />
                            )}
                          </div>
                        )}

                        {(currentConsultation.medical_history || currentConsultation.medicalHistoryNotes) && (currentConsultation.medical_history || currentConsultation.medicalHistoryNotes) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5" /> Medical History
                              </div>
                              <div className="flex items-center gap-2">
                                {editingSection === 'medicalHistoryNotes' ? (
                                  <>
                                    <button onClick={() => saveEdit(currentConsultation, 'medicalHistoryNotes')} disabled={isSavingEdit} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Save className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => setEditingSection(null)} className="text-slate-500 hover:text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <X className="w-3 h-3" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing('medicalHistoryNotes', currentConsultation.medical_history || currentConsultation.medicalHistoryNotes)} className="text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => generateConsultationPDF(currentConsultation, 'Medical History')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Download className="w-3 h-3" /> Download
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {editingSection === 'medicalHistoryNotes' ? (
                              <>
                                <RichTextToolbar />
                                <div
                                  ref={editEditorRef}
                                  className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none consultation-notes-content"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => setEditContent(e.target.innerHTML)}
                                  dangerouslySetInnerHTML={{ __html: editContent }}
                                />
                              </>
                            ) : (
                              <div
                                className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100"
                                dangerouslySetInnerHTML={{ __html: currentConsultation.medical_history || currentConsultation.medicalHistoryNotes }}
                              />
                            )}
                          </div>
                        )}

                        {(currentConsultation.diet_plan_note || currentConsultation.dietPlanNotes) && (currentConsultation.diet_plan_note || currentConsultation.dietPlanNotes) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5" /> Diet Plan
                              </div>
                              <div className="flex items-center gap-2">
                                {editingSection === 'dietPlanNotes' ? (
                                  <>
                                    <button onClick={() => saveEdit(currentConsultation, 'dietPlanNotes')} disabled={isSavingEdit} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Save className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => setEditingSection(null)} className="text-slate-500 hover:text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <X className="w-3 h-3" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing('dietPlanNotes', currentConsultation.diet_plan_note || currentConsultation.dietPlanNotes)} className="text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => generateConsultationPDF(currentConsultation, 'Diet Plan')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Download className="w-3 h-3" /> Download
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {editingSection === 'dietPlanNotes' ? (
                              <>
                                <RichTextToolbar />
                                <div
                                  ref={editEditorRef}
                                  className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none consultation-notes-content"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => setEditContent(e.target.innerHTML)}
                                  dangerouslySetInnerHTML={{ __html: editContent }}
                                />
                              </>
                            ) : (
                              <div
                                className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100"
                                dangerouslySetInnerHTML={{ __html: currentConsultation.diet_plan_note || currentConsultation.dietPlanNotes }}
                              />
                            )}
                          </div>
                        )}

                        {(currentConsultation.detox_procedure || currentConsultation.detoxProcedureNotes) && (currentConsultation.detox_procedure || currentConsultation.detoxProcedureNotes) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <RefreshCw className="w-3.5 h-3.5" /> Detox Procedure
                              </div>
                              <div className="flex items-center gap-2">
                                {editingSection === 'detoxProcedureNotes' ? (
                                  <>
                                    <button onClick={() => saveEdit(currentConsultation, 'detoxProcedureNotes')} disabled={isSavingEdit} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Save className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => setEditingSection(null)} className="text-slate-500 hover:text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <X className="w-3 h-3" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing('detoxProcedureNotes', currentConsultation.detox_procedure || currentConsultation.detoxProcedureNotes)} className="text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => generateConsultationPDF(currentConsultation, 'Detox Procedure')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Download className="w-3 h-3" /> Download
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {editingSection === 'detoxProcedureNotes' ? (
                              <>
                                <RichTextToolbar />
                                <div
                                  ref={editEditorRef}
                                  className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none consultation-notes-content"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => setEditContent(e.target.innerHTML)}
                                  dangerouslySetInnerHTML={{ __html: editContent }}
                                />
                              </>
                            ) : (
                              <div
                                className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100"
                                dangerouslySetInnerHTML={{ __html: currentConsultation.detox_procedure || currentConsultation.detoxProcedureNotes }}
                              />
                            )}
                          </div>
                        )}

                        {(currentConsultation.medical_reports || currentConsultation.medicalReports) && (currentConsultation.medical_reports || currentConsultation.medicalReports) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <ImagePlus className="w-3.5 h-3.5" /> Medical Reports
                              </div>
                              <div className="flex items-center gap-2">
                                {editingSection === 'medicalReports' ? (
                                  <>
                                    <button onClick={() => saveEdit(currentConsultation, 'medicalReports')} disabled={isSavingEdit} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Save className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => setEditingSection(null)} className="text-slate-500 hover:text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <X className="w-3 h-3" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing('medicalReports', currentConsultation.medical_reports || currentConsultation.medicalReports)} className="text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => generateConsultationPDF(currentConsultation, 'Medical Reports')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Download className="w-3 h-3" /> Download
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {editingSection === 'medicalReports' ? (
                              <>
                                <RichTextToolbar />
                                <div
                                  ref={editEditorRef}
                                  className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none consultation-notes-content"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => setEditContent(e.target.innerHTML)}
                                  dangerouslySetInnerHTML={{ __html: editContent }}
                                />
                              </>
                            ) : (
                              <div
                                className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100"
                                dangerouslySetInnerHTML={{ __html: currentConsultation.medical_reports || currentConsultation.medicalReports }}
                              />
                            )}
                          </div>
                        )}

                        {(currentConsultation.home_care || currentConsultation.homecareGuideliness) && (currentConsultation.home_care || currentConsultation.homecareGuideliness) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Bed className="w-3.5 h-3.5" /> Home Care Guidelines
                              </div>
                              <div className="flex items-center gap-2">
                                {editingSection === 'homecareGuideliness' ? (
                                  <>
                                    <button onClick={() => saveEdit(currentConsultation, 'homecareGuideliness')} disabled={isSavingEdit} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Save className="w-3 h-3" /> Save
                                    </button>
                                    <button onClick={() => setEditingSection(null)} className="text-slate-500 hover:text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <X className="w-3 h-3" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => startEditing('homecareGuideliness', currentConsultation.home_care || currentConsultation.homecareGuideliness)} className="text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Edit3 className="w-3 h-3" /> Edit
                                  </button>
                                )}
                              </div>
                            </div>
                            {editingSection === 'homecareGuideliness' ? (
                              <textarea
                                className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                              />
                            ) : (
                              <div className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                                {currentConsultation.home_care || currentConsultation.homecareGuideliness}
                              </div>
                            )}
                          </div>
                        )}

                        {(currentConsultation.detox_recommended || currentConsultation.detoxRecommended || currentConsultation.followup_date || currentConsultation.followupDate) && (
                          <div className={`rounded-xl p-4 border ${currentConsultation.detox_recommended || currentConsultation.detoxRecommended ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-2 mb-3">
                              {currentConsultation.detox_recommended || currentConsultation.detoxRecommended ? (
                                <>
                                  <Star className="w-4 h-4 text-emerald-600" />
                                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Detox Recommended</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 text-amber-600" />
                                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Follow-up Review</span>
                                </>
                              )}
                            </div>
                            <div className="space-y-2 text-sm text-slate-700">
                              {(currentConsultation.detox_recommended || currentConsultation.detoxRecommended) && (
                                <div>
                                  <span className="font-semibold text-slate-800">Doctor:</span> {currentConsultation.detox_doctor_name ||
                                    currentConsultation.detoxDoctorName ||
                                    currentConsultation.doctor_name ||
                                    currentConsultation.doctor?.user?.fullName ||
                                    availableDoctors.find(d => Number(d.id) === Number(currentConsultation.detox_doctor_id ?? currentConsultation.detoxDoctorId))?.name ||
                                    'Assigned Provider'}
                                </div>
                              )}
                              {(Number(currentConsultation.detox_morning_sessions || currentConsultation.detoxMorningSessions || 0) > 0) && (
                                <div>
                                  <span className="font-semibold text-slate-800">Morning Sessions:</span>{' '}
                                  <Sun className="inline w-3.5 h-3.5 mr-1 text-amber-500" />
                                  {currentConsultation.detox_morning_sessions || currentConsultation.detoxMorningSessions}
                                </div>
                              )}
                              {(Number(currentConsultation.detox_evening_sessions || currentConsultation.detoxEveningSessions || 0) > 0) && (
                                <div>
                                  <span className="font-semibold text-slate-800">Evening Sessions:</span>{' '}
                                  <Moon className="inline w-3.5 h-3.5 mr-1 text-indigo-500" />
                                  {currentConsultation.detox_evening_sessions || currentConsultation.detoxEveningSessions}
                                </div>
                              )}
                              {(currentConsultation.followup_date || currentConsultation.followupDate) && (
                                <div><span className="font-semibold text-slate-800">Follow-up Date:</span> {formatDate(currentConsultation.followup_date || currentConsultation.followupDate)}</div>
                              )}
                              {(currentConsultation.followup_remarks || currentConsultation.followupRemarks) && (
                                <div><span className="font-semibold text-slate-800">Remarks:</span> {currentConsultation.followup_remarks || currentConsultation.followupRemarks}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {(currentConsultation.admission_recommended || currentConsultation.admissionRecommended) && (
                          <div className="rounded-xl p-4 border bg-sky-50 border-sky-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Bed className="w-4 h-4 text-sky-600" />
                              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Recommend for Admission</span>
                            </div>
                            <div className="space-y-2 text-sm text-slate-700">
                              {(currentConsultation.admission_doctor_name || currentConsultation.admissionDoctorName ||
                                currentConsultation.admission_doctor_id || currentConsultation.admissionDoctorId) && (
                                <div>
                                  <span className="font-semibold text-slate-800">Doctor:</span> {currentConsultation.admission_doctor_name ||
                                    currentConsultation.admissionDoctorName ||
                                    (effectiveDoctors.find(d => Number(d.id) === Number(currentConsultation.admission_doctor_id ?? currentConsultation.admissionDoctorId))?.name) ||
                                    'Assigned Provider'}
                                </div>
                              )}
                              {(currentConsultation.admission_date || currentConsultation.admissionDate) && (
                                <div><span className="font-semibold text-slate-800">Admission Date:</span> {formatDate(currentConsultation.admission_date || currentConsultation.admissionDate)}</div>
                              )}
                              {(currentConsultation.admission_remarks || currentConsultation.admissionRemarks) && (
                                <div className="bg-white rounded-lg p-3 border border-sky-100"><span className="font-semibold text-slate-800">Remarks for Receptionist:</span> {currentConsultation.admission_remarks || currentConsultation.admissionRemarks}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No consultation records found</p>
                        <p className="text-xs text-slate-400 mt-1">Complete a consultation to see notes here</p>
                      </div>
                    )}
                  </>
                )}

                {/* Detox Sessions History */}
                {historySubTab === 'detox' && (
                  <>
                    {currentDetoxSession ? (
                      <div className="space-y-5" onClick={handlePreviewImage}>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                              <Droplets className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">Detox Session {currentDetoxSession.sessionNumber || 1}</div>
                              <div className="text-xs text-teal-600 font-medium">{getSessionTypeDisplay(currentDetoxSession.sessionType)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                              {formatDate(currentDetoxSession.sessionDate || currentDetoxSession.scheduled_date)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">Session Date</div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">Provider:</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {currentDetoxSession.doctor?.user?.fullName || currentDetoxSession.doctorName || 'Assigned Provider'}
                            </span>
                          </div>
                        </div>

                        {(currentDetoxSession.detoxNotes || currentDetoxSession.notes) && (
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5" /> Detox Procedure Notes
                            </div>
                            <div
                              className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100"
                              dangerouslySetInnerHTML={{ __html: currentDetoxSession.detoxNotes || currentDetoxSession.notes || '<p class="text-slate-500">No notes recorded.</p>' }}
                            />
                          </div>
                        )}

                        {(currentDetoxSession.followupDate || currentDetoxSession.followup_date) && (
                          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                            <div className="flex items-center gap-2 mb-3">
                              <CalendarIcon className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Follow-up Details</span>
                            </div>
                            <div className="space-y-2 text-sm text-slate-700">
                              <div>
                                <span className="font-semibold text-slate-800">Follow-up Date:</span> {formatDate(currentDetoxSession.followupDate || currentDetoxSession.followup_date)}
                              </div>
                              {(currentDetoxSession.followupRemarks || currentDetoxSession.followup_remarks) && (
                                <div><span className="font-semibold text-slate-800">Remarks:</span> {currentDetoxSession.followupRemarks || currentDetoxSession.followup_remarks}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No detox session records found</p>
                        <p className="text-xs text-slate-400 mt-1">Complete a detox session to see details here</p>
                      </div>
                    )}
                  </>
                )}

                {/* Pagination */}
                {totalHistoryPages > 1 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-slate-600">
                        {historySubTab === 'consultations' ? 'Consultation' : 'Session'} <span className="font-bold text-emerald-600">{historyPage}</span> of <span className="font-bold text-slate-800">{totalHistoryPages}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => goToHistoryPage(historyPage - 1)}
                          disabled={historyPage === 1}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        <button
                          onClick={() => goToHistoryPage(historyPage + 1)}
                          disabled={historyPage === totalHistoryPages}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Confirmation Modal */}
      {showWhatsappConfirmModal && whatsappConsultationToSend && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowWhatsappConfirmModal(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowWhatsappConfirmModal(false)}></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full modal-animate overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Send via WhatsApp?</h2>
                </div>
                <button onClick={() => setShowWhatsappConfirmModal(false)} className="p-2 rounded-full hover:bg-white/10 transition text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-slate-700 text-sm">
                  Do you want to send the consultation PDF for <strong className="text-slate-900">{patient.name}</strong> to their WhatsApp number ({(patient.whatsapp || patient.phone) ?? 'No number available'})?
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowWhatsappConfirmModal(false)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold py-2.5 px-5 rounded-lg text-sm transition-colors shadow-sm">
                  Cancel
                </button>
                <button onClick={confirmAndSendToWhatsApp} disabled={isSendingWA} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSendingWA ? 'Sending...' : 'Yes, Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Share Doctor Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" onClick={() => setShowShareModal(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full modal-animate overflow-visible" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Share Record</h2>
                </div>
                <button onClick={() => setShowShareModal(false)} className="p-2 rounded-full hover:bg-white/10 transition text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-700 text-sm">Search and select a doctor to share this patient's history with.</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search doctor by name..."
                    value={shareQuery}
                    onChange={(e) => { setShareQuery(e.target.value); setSelectedShareDoctor(''); }}
                    onFocus={() => setIsShareFocused(true)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {(isShareFocused || shareQuery) && !selectedShareDoctor && (
                    <div
                      className="absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 max-h-48 overflow-auto"
                      onWheel={(e) => e.stopPropagation()}
                      onScroll={(e) => e.stopPropagation()}
                    >
                      {effectiveDoctors.filter(d => (d.name || d.user?.fullName || '').toLowerCase().includes((shareQuery||'').toLowerCase())).map(d => (
                        <div
                          key={d.id}
                          onMouseDown={() => { setSelectedShareDoctor(String(d.id)); setShareQuery(d.name || d.user?.fullName || ''); setIsShareFocused(false); }}
                          className="px-4 py-2 text-sm hover:bg-slate-100 cursor-pointer"
                        >
                          {d.name || d.user?.fullName}
                        </div>
                      ))}
                      {effectiveDoctors.filter(d => (d.name || d.user?.fullName || '').toLowerCase().includes((shareQuery||'').toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-sm text-slate-400">No doctors found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowShareModal(false)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold py-2.5 px-5 rounded-lg text-sm transition-colors shadow-sm">
                  Cancel
                </button>
                <button onClick={handleShareToDoctor} disabled={isSharing || !selectedShareDoctor} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSharing ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Consultation Modal */}
      {showAddCons && (
        <div className="fixed inset-0 z-[70] overflow-y-auto" onClick={() => setShowAddCons(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-5xl w-full modal-animate overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <style>{`
                .editor-content ul, .editor-content ol { margin-top: 0.5rem; margin-bottom: 0.5rem; padding-left: 1.5rem; }
                .editor-content ul { list-style-type: disc; }
                .editor-content ol { list-style-type: decimal; }
                .editor-content li { margin-bottom: 0.25rem; }
                .editor-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; border: 1px solid #e2e8f0; }
                .editor-content .img-wrap { position: relative; display: inline-block; margin: 8px 4px 8px 0; vertical-align: middle; max-width: 100%; }
                .editor-content .img-wrap img { margin: 0; display: block; }
              `}</style>
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">New Consultation</h2>
                    <p className="text-xs text-emerald-100">{patient.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowAddCons(false)} className="p-2 rounded-full hover:bg-white/10 transition text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="modal-content-scroll overflow-y-auto" style={{ maxHeight: 'calc(96vh - 90px)' }}>
                {/* Header Info */}
                <div className="p-5 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{patient.name}</h2>
                    <span className="text-sm text-slate-500">ID: P-{patient.id || patient.patientId} • Phone: {patient.phone?.replace(/\D/g, '').slice(-10)}</span>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold border border-emerald-200">Consultation in Progress</div>
                </div>

                {/* 1. Clinical Consultation Notes */}
                <div className="p-5 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> 1. Clinical Consultation Notes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Doctor</label>
                      <select value={consForm.doctorId} onChange={(e) => setConsForm({ ...consForm, doctorId: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                        <option value="">Select Doctor...</option>
                        {doctorSelectOptions.map(d => (<option key={d.id} value={String(d.id)}>Dr. {d.name || d.user?.fullName} — {d.specialization || 'General'}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Date</label>
                      <input type="date" value={consForm.date} max={new Date().toISOString().split('T')[0]} onChange={(e) => setConsForm({ ...consForm, date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Patient Medical History</label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <NewConsToolbar refEl={newConsMedHistoryRef} setter={setNewConsMedHistory} />
                      <div ref={newConsMedHistoryRef} contentEditable tabIndex={0} suppressContentEditableWarning onBlur={e => setNewConsMedHistory(e.currentTarget.innerHTML)} className="editor-content min-h-[100px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Notes [Prescription]</label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <NewConsToolbar refEl={newConsNotesRef} setter={setNewConsNotes} />
                      <div ref={newConsNotesRef} contentEditable tabIndex={0} suppressContentEditableWarning onBlur={e => setNewConsNotes(e.currentTarget.innerHTML)} className="editor-content min-h-[140px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Medical Reports</label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <NewConsToolbar refEl={newConsReportsRef} setter={setNewConsReports} />
                      <div ref={newConsReportsRef} contentEditable tabIndex={0} suppressContentEditableWarning onBlur={e => setNewConsReports(e.currentTarget.innerHTML)} className="editor-content min-h-[100px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">You can upload multiple images. They will be embedded into the report and included in the PDF.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Detox Procedure Note</label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <NewConsToolbar refEl={detoxProcedureEditorRef} setter={setDetoxProcedureNote} />
                      <div ref={detoxProcedureEditorRef} contentEditable tabIndex={0} suppressContentEditableWarning onBlur={e => setDetoxProcedureNote(e.currentTarget.innerHTML)} className="editor-content min-h-[100px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                  </div>
                </div>

                {/* 2. Diet Plan Note */}
                <div className="p-5 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-emerald-600" /> 2. Diet Plan Note</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Diet Plan Note</label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <NewConsToolbar refEl={dietPlanEditorRef} setter={setDietPlanNote} />
                      <div ref={dietPlanEditorRef} contentEditable tabIndex={0} suppressContentEditableWarning onBlur={e => setDietPlanNote(e.currentTarget.innerHTML)} className="editor-content min-h-[100px] rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Home Care Guidelines</label>
                    <input type="text" value={homeCare} onChange={e => setHomeCare(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                  </div>
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
                            {effectiveDoctors.length > 0 ? (effectiveDoctors.map(doc => (<option key={doc.id} value={doc.id}>Dr. {doc.name || doc.user?.fullName} — {doc.specialization || 'General'}</option>))) : (<option disabled>No doctors available</option>)}
                          </select>
                        </div>
                        <div className="w-28 space-y-2">
                          <label className="block text-xs font-semibold text-slate-600 whitespace-nowrap"><Sun className="inline w-3.5 h-3.5 mr-1 text-amber-500" />Morning</label>
                          <select value={detoxMorningSessions} onChange={e => setDetoxMorningSessions(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                            <option value="">Select</option>
                            {newConsSessionCountOptions.filter(v => v !== '').map(n => (<option key={n} value={n}>{n}</option>))}
                          </select>
                        </div>
                        <div className="w-28 space-y-2">
                          <label className="block text-xs font-semibold text-slate-600 whitespace-nowrap"><Moon className="inline w-3.5 h-3.5 mr-1 text-indigo-500" />Evening</label>
                          <select value={detoxEveningSessions} onChange={e => setDetoxEveningSessions(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                            <option value="">Select</option>
                            {newConsSessionCountOptions.filter(v => v !== '').map(n => (<option key={n} value={n}>{n}</option>))}
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
                            {effectiveDoctors.length > 0 ? (effectiveDoctors.map(doc => (<option key={doc.id} value={doc.id}>Dr. {doc.name || doc.user?.fullName} — {doc.specialization || 'General'}</option>))) : (<option disabled>No doctors available</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-600"><CalendarIcon className="inline w-3.5 h-3.5 mr-1 text-sky-600" />Admission Date</label>
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

                {/* Review Recommendation (Conditional) */}
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

                {/* Save Actions */}
                <div className="p-5 bg-slate-50 flex flex-wrap justify-end gap-3">
                  <button onClick={() => setShowAddCons(false)} disabled={isSavingNewCons} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleCreateConsultation} disabled={isSavingNewCons} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSavingNewCons ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Saving...</>) : (<><Save className="w-4 h-4" /> Save & Finalize Consultation</>)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Preview Modal */}
      {previewImageSrc && (
        <div className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-6" onClick={() => { setPreviewImageSrc(''); setPreviewZoom(1); }}>
          <div ref={previewZoomRef} className="flex items-center justify-center w-full h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImageSrc}
              alt="Zoomed preview"
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain select-none"
              style={{ transform: `scale(${previewZoom})`, transition: 'transform 0.2s ease' }}
            />
          </div>
          <button
            type="button"
            onClick={() => { setPreviewImageSrc(''); setPreviewZoom(1); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white text-xl font-bold flex items-center justify-center transition-colors"
            title="Close"
          >
            ✕
          </button>
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
