import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Activity, FileText, Eye, X, Loader2, RefreshCw, Pencil } from 'lucide-react';
import { getAllPatients, createPatient, updatePatient } from '../api/patientApi';
import { toast } from 'react-toastify';
import { updateReceptionistFollowup } from '../api/consultationApi';

export default function PatientsView({ appointments = [], followups = [], consultations = [], detoxSessions = [], onAddPatient, onSelectPatient, onRefreshConsultations, activeRole = '' }) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPatient, setViewingPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch patients from backend
  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllPatients();
      const patientsData = Array.isArray(response) ? response : response.data || [];
      setPatients(patientsData);
      console.log('Patients fetched:', patientsData);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const getAppointmentTypeBadge = (type) => {
    const colors = {
      'Initial consultation': 'bg-purple-50 text-purple-600 border-purple-200',
      'Detox': 'bg-teal-50 text-teal-600 border-teal-200',
      'Review': 'bg-amber-50 text-amber-600 border-amber-200'
    };
    return `px-2 py-0.5 rounded text-xs font-medium border ${colors[type] || 'bg-slate-50 text-slate-600 border-slate-200'}`;
  };

  const getLatestAppointmentType = (patientId) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (!appointments || appointments.length === 0) return 'No Record';
    const sorted = appointments
      .filter(a => {
        const isPt = String(a.patientId || a.patient_id) === String(patientId);
        if (!isPt || !a.appointmentType) return false;
        const apptDate = new Date(a.appointmentDate || a.date || 0);
        return apptDate <= today || ['Arrived', 'Checked-in', 'Completed'].includes(a.status);
      })
      .sort((a, b) => {
        const dateA = new Date(a.appointmentDate || a.date || 0);
        const dateB = new Date(b.appointmentDate || b.date || 0);
        return dateB - dateADate;
      });
    return sorted[0]?.appointmentType || 'General';
  };

  const getLatestAppointmentNote = (patientId) => {
    if (!appointments || appointments.length === 0) return null;
    const sorted = appointments
      .filter(a => String(a.patientId || a.patient_id) === String(patientId))
      .sort((a, b) => {
        const dateA = new Date(a.appointmentDate || a.date || 0);
        const dateB = new Date(b.appointmentDate || b.date || 0);
        return dateB - dateA;
      });
    return sorted[0]?.notes || null;
  };

  const getFollowupDateValue = (record) => {
    if (!record) return null;
    return record.followupDate || record.followup_date || null;
  };

  const getCompletedDetoxSessionCount = (patientId) => {
    return (detoxSessions || [])
      .filter(d => String(d.patientId || d.patient_id) === String(patientId))
      .filter(ds => {
        const status = String(ds.status || '').toLowerCase();
        return ['completed', 'done', 'finished'].includes(status);
      }).length;
  };

  const getLatestConsultation = (patientId) => {
    const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(patientId));
    return [...ptCons].sort((a, b) => new Date(b.consultationDate || b.date || 0) - new Date(a.consultationDate || a.date || 0))[0] || null;
  };

  const getLatestClinicalType = (patientId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestApptType = getLatestAppointmentType(patientId);
    if (latestApptType && latestApptType !== 'General' && latestApptType !== 'No Record') {
      return latestApptType;
    }

    const hasPendingDetoxFollowup = (followups || [])
      .some(f => {
        const fupDate = new Date(f.scheduled_date || f.date || 0);
        const matchesPatient = String(f.patient_id || f.patientId) === String(patientId);
        const isPending = f.status === 'Pending';
        const isFuture = !isNaN(fupDate.getTime()) && fupDate >= today;
        const type = f.appointmentType || f.type || (f.notes && f.notes.toLowerCase().includes('detox') ? 'Detox' : 'Review');
        return matchesPatient && isPending && isFuture && type === 'Detox';
      });

    if (hasPendingDetoxFollowup) return 'Detox';

    const followup = getFollowupInfo(patientId);
    if (followup?.type === 'Detox') return 'Detox';
    if (followup?.type) return followup.type;

    const futureDetoxAppointment = (appointments || [])
      .some(a => {
        const apptDate = new Date(a.date || a.appointmentDate || 0);
        const matchesPatient = String(a.patientId || a.patient_id) === String(patientId);
        const isFuture = !isNaN(apptDate.getTime()) && apptDate >= today;
        const isScheduled = a.status === 'Scheduled';
        return matchesPatient && isFuture && isScheduled && a.appointmentType === 'Detox';
      });

    if (futureDetoxAppointment) return 'Detox';

    const latestCons = getLatestConsultation(patientId);
    if (latestCons && (latestCons.detox_recommended || latestCons.detoxRecommended)) {
      const hasFutureDetox = (appointments || [])
        .some(a => {
          const apptDate = new Date(a.date || a.appointmentDate || 0);
          const matchesPatient = String(a.patientId || a.patient_id) === String(patientId);
          const isFuture = !isNaN(apptDate.getTime()) && apptDate >= today;
          const isScheduled = a.status === 'Scheduled';
          return matchesPatient && isFuture && isScheduled && a.appointmentType === 'Detox';
        });
      if (hasFutureDetox) return 'Detox';
    }

    const completedDetoxCount = getCompletedDetoxSessionCount(patientId);
    if (completedDetoxCount >= 3) {
      const hasPendingReview = (followups || []).some(f => {
        const fupDate = new Date(f.scheduled_date || f.date || 0);
        const matchesPatient = String(f.patient_id || f.patientId) === String(patientId);
        const isPending = f.status === 'Pending';
        const isFuture = !isNaN(fupDate.getTime()) && fupDate >= today;
        return matchesPatient && isPending && isFuture;
      });
      if (hasPendingReview) return 'Review';
    } else if (completedDetoxCount > 0) {
      const hasFutureDetox = (appointments || [])
        .some(a => {
          const apptDate = new Date(a.date || a.appointmentDate || 0);
          const matchesPatient = String(a.patientId || a.patient_id) === String(patientId);
          const isFuture = !isNaN(apptDate.getTime()) && apptDate >= today;
          const isScheduled = a.status === 'Scheduled';
          return matchesPatient && isFuture && isScheduled && a.appointmentType === 'Detox';
        });
      if (hasFutureDetox) return 'Detox';
    }

    return null;
  };

  const getFollowupInfo = (patientId) => {
    const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(patientId));
    const latestCons = [...ptCons].sort((a,b)=> new Date(b.consultationDate || b.date || 0) - new Date(a.consultationDate || a.date || 0))[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureAppt = appointments
      .filter(a => {
        const isPt = String(a.patientId || a.patient_id) === String(patientId);
        if (!isPt) return false;
        const apptDate = new Date(a.appointmentDate || a.date || 0);
        return apptDate >= today && a.status === 'Scheduled';
      })
      .sort((a, b) => new Date(a.appointmentDate || a.date || 0) - new Date(b.appointmentDate || b.date || 0))[0];

    const candidates = [];
    if (futureAppt) {
      candidates.push({
        id: futureAppt.id,
        date: futureAppt.appointmentDate || futureAppt.date,
        status: futureAppt.status,
        notes: futureAppt.notes,
        source: 'booked_appointment',
        type: futureAppt.appointmentType
      });
    }

    const getConsultationFollowup = () => {
      if (!latestCons) return null;
      const rec = latestCons.receptionistFollowup || latestCons.receptionist_followup;
      const recIsActive = rec && rec.status !== 'Cancelled' && rec.status !== 'Completed';
      const consultationFollowupDate = recIsActive ? getFollowupDateValue(rec) : getFollowupDateValue(latestCons);
      if (!consultationFollowupDate) return null;
      const followupDateObj = new Date(consultationFollowupDate);
      if (isNaN(followupDateObj.getTime()) || followupDateObj < today) return null;
      const isDetox = latestCons.detox_recommended || latestCons.detoxRecommended;
      return {
        id: rec?.id || null,
        consultationId: latestCons.id || latestCons.consultationId,
        date: consultationFollowupDate,
        status: rec?.status || 'Pending',
        notes: rec?.notes || latestCons.followup_remarks || latestCons.followupRemarks || '',
        source: rec ? 'receptionist' : 'doctor',
        type: isDetox ? 'Detox' : 'Review'
      };
    };

    const getDetoxFollowup = () => {
      const ptDetox = detoxSessions.filter(d => String(d.patientId || d.patient_id) === String(patientId));
      const latestDetox = [...ptDetox].sort((a, b) => {
        const dateA = getFollowupDateValue(a) ? new Date(getFollowupDateValue(a)).getTime() : 0;
        const dateB = getFollowupDateValue(b) ? new Date(getFollowupDateValue(b)).getTime() : 0;
        return dateB - dateA;
      })[0];
      const detoxFollowupDate = getFollowupDateValue(latestDetox);
      if (!latestDetox || !detoxFollowupDate) return null;
      const followupDateObj = new Date(detoxFollowupDate);
      if (isNaN(followupDateObj.getTime()) || followupDateObj < today) return null;
      return {
        id: latestDetox.id,
        date: detoxFollowupDate,
        status: 'Pending',
        notes: latestDetox.followupRemarks || latestDetox.followup_remarks || 'Follow-up after detox session',
        source: 'detox',
        type: latestDetox.sessionType === 'fullDay' ? 'Detox' : 'Review'
      };
    };

    const detoxFollowup = getDetoxFollowup();
    const consultationFollowup = getConsultationFollowup();
    if (detoxFollowup) candidates.push(detoxFollowup);
    if (consultationFollowup) candidates.push(consultationFollowup);

    const derivedFollowup = followups
      .filter(f => {
        const fupDate = new Date(f.scheduled_date || f.date || 0);
        return String(f.patient_id) === String(patientId) && f.status === 'Pending' && fupDate >= today;
      })
      .sort((a, b) => new Date(b.scheduled_date || b.date || 0) - new Date(a.scheduled_date || a.date || 0))[0];

    if (derivedFollowup) {
      candidates.push({
        id: derivedFollowup.id,
        date: derivedFollowup.scheduled_date || derivedFollowup.date,
        status: derivedFollowup.status || 'Pending',
        notes: derivedFollowup.notes,
        source: 'derived',
        type: derivedFollowup.notes?.toLowerCase().includes('detox') ? 'Detox' : 'Review'
      });
    }

    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', location: '', address: '', phone: '', phoneAsWhatsapp: true, whatsapp: '', medical_conditions: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingFollowup, setIsUpdatingFollowup] = useState(false);
  const [receptionistEditMode, setReceptionistEditMode] = useState(false);
  const [receptionistFollowupDate, setReceptionistFollowupDate] = useState('');
  const [receptionistFollowupNotes, setReceptionistFollowupNotes] = useState('');
  const [receptionistChecked, setReceptionistChecked] = useState(false);

  const [editingPatient, setEditingPatient] = useState(null);
  const [editingConsultationId, setEditingConsultationId] = useState(null);
  const [editingFollowupDate, setEditingFollowupDate] = useState('');
  const [editingFollowupNotes, setEditingFollowupNotes] = useState('');
  const [editingFollowupStatus, setEditingFollowupStatus] = useState('Pending');

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedPhone, setEditedPhone] = useState('');
  const [editedWhatsapp, setEditedWhatsapp] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [editingContactPatient, setEditingContactPatient] = useState(null);

  const openEditContactModal = (pt, e) => {
    e?.stopPropagation();
    const rawPhone = (pt.phone || '').replace(/\D/g, '').slice(-10);
    const rawWhatsapp = (pt.whatsapp || pt.phone || '').replace(/\D/g, '').slice(-10);
    setEditingContactPatient(pt);
    setEditedPhone(rawPhone);
    setEditedWhatsapp(rawWhatsapp);
  };

  const handleSaveContact = async () => {
    if (!editingContactPatient) return;
    setIsSavingContact(true);
    try {
      const cleanedPhone = editedPhone.replace(/\D/g, '');
      const cleanedWhatsapp = editedWhatsapp.replace(/\D/g, '');
      await updatePatient(editingContactPatient.id, {
        phone: cleanedPhone,
        whatsapp: cleanedWhatsapp
      });
      setPatients(prev => prev.map(p =>
        String(p.id) === String(editingContactPatient.id)
          ? { ...p, phone: cleanedPhone, whatsapp: cleanedWhatsapp }
          : p
      ));
      setViewingPatient(prev => prev && String(prev.id) === String(editingContactPatient.id)
        ? { ...prev, phone: cleanedPhone, whatsapp: cleanedWhatsapp }
        : prev
      );
      setEditingContactPatient(null);
      setIsEditingContact(false);
      toast.success('Contact details updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update contact details');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, phone: val, whatsapp: prev.phoneAsWhatsapp ? val : prev.whatsapp }));
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, phoneAsWhatsapp: checked, whatsapp: checked ? prev.phone : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.warn('Patient Name is required.'); return; }
    if (!formData.age) { toast.warn('Age is required.'); return; }
    if (!formData.gender) { toast.warn('Gender is required.'); return; }
    if (!formData.location.trim()) { toast.warn('Location is required.'); return; }
    if (!formData.phone.trim()) { toast.warn('Phone Number is required.'); return; }
    setIsSubmitting(true);
    try {
      const newPatient = await createPatient({
        name: formData.name, age: parseInt(formData.age), gender: formData.gender,
        phone: formData.phone, whatsapp: formData.phoneAsWhatsapp ? formData.phone : formData.whatsapp,
        location: formData.location, address: formData.address || '', medical_conditions: formData.medical_conditions || ''
      });
      await fetchPatients();
      if (onAddPatient) onAddPatient(newPatient);
      setIsAdding(false);
      setFormData({ name: '', age: '', gender: '', location: '', address: '', phone: '', phoneAsWhatsapp: true, whatsapp: '', medical_conditions: '' });
      toast.success('Patient registered successfully!');
    } catch (err) {
      console.error('Error creating patient:', err);
      toast.error(err.message || 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!editingContactPatient) return;
    const rawPhone = (editingContactPatient.phone || '').replace(/\D/g, '').slice(-10);
    const rawWhatsapp = (editingContactPatient.whatsapp || editingContactPatient.phone || '').replace(/\D/g, '').slice(-10);
    setEditedPhone(rawPhone);
    setEditedWhatsapp(rawWhatsapp);
  }, [editingContactPatient]);

  useEffect(() => {
    if (!viewingPatient) return;
    setEditedPhone(viewingPatient.phone || '');
    setEditedWhatsapp(viewingPatient.whatsapp || viewingPatient.phone || '');
  }, [viewingPatient]);

  useEffect(() => {
    if (!viewingPatient) return;
    const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(viewingPatient.id));
    const latestCons = [...ptCons].sort((a, b) => new Date(b.consultationDate || b.date || b.followup_date || 0) - new Date(a.consultationDate || a.date || a.followup_date || 0))[0];
    const rec = latestCons?.receptionistFollowup || latestCons?.receptionist_followup || null;
    setReceptionistFollowupDate(rec?.followupDate || rec?.followup_date || latestCons?.followup_date || latestCons?.followupDate || '');
    setReceptionistFollowupNotes(rec?.notes || rec?.notes_text || latestCons?.followup_remarks || latestCons?.followupRemarks || '');
    setReceptionistChecked(Boolean(rec));
  }, [viewingPatient, consultations]);

  const normalizePhone = (val) => (val || '').replace(/\D/g, '').slice(-10);

  const filteredPatients = patients.filter(p => {
    const normalized = searchTerm.trim().toLowerCase();
    const matchesName = p.name?.toLowerCase().includes(normalized);
    const normalizedId = String(p.id).toLowerCase();
    const isIdSearch = /^p-\d+$/.test(normalized);
    const idMatches = isIdSearch ? normalizedId === normalized.slice(2) : normalizedId.includes(normalized);
    const isPhoneSearch = /^[\d\s-]+$/.test(normalized) && !isIdSearch;
    const matchesPhone = isPhoneSearch ? normalizePhone(p.phone).includes(normalizePhone(normalized)) : false;
    return matchesName || idMatches || matchesPhone;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
        <span className="text-slate-500">Loading patients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-rose-600 mb-4">{error}</div>
        <button onClick={fetchPatients} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">Patient Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage patient intakes, demographics, and clinical records.</p>
        </div>
      </div>

      {isAdding ? (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left max-w-2xl mx-auto">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">New Patient Registration</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Patient Name <span className="text-rose-500">*</span></label>
              <input type="text" required placeholder="e.g. Jessica Smith" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Age <span className="text-rose-500">*</span></label>
                <input type="number" required placeholder="e.g. 29" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Gender <span className="text-rose-500">*</span></label>
                <select required value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium">
                  <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Location <span className="text-rose-500">*</span></label>
                <input type="text" required placeholder="e.g. Indiranagar" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Address</label>
              <input type="text" placeholder="Full residential address (optional)" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number <span className="text-rose-500">*</span></label>
              <input type="tel" required placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={handlePhoneChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
            </div>
            <div className="flex items-center space-x-2.5 py-1">
              <input id="phoneAsWhatsappIntake" type="checkbox" checked={formData.phoneAsWhatsapp} onChange={handleCheckboxChange} className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
              <label htmlFor="phoneAsWhatsappIntake" className="text-xs text-slate-600 font-bold select-none cursor-pointer">Use Phone number as WhatsApp number</label>
            </div>
            {!formData.phoneAsWhatsapp && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">WhatsApp Number <span className="text-rose-500">*</span></label>
                <input type="tel" required placeholder="WhatsApp No with country code" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Primary Medical Conditions</label>
              <textarea rows="2" placeholder="Patient symptoms, specific requests, or details..." value={formData.medical_conditions} onChange={e => setFormData({ ...formData, medical_conditions: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium resize-none"></textarea>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}{isSubmitting ? 'Registering...' : 'Register Intake Record'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search by name, ID or phone number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>}
            </div>
          </div>
          <div className="w-full">
            {filteredPatients.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No patients found matching your search.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 xl:hidden bg-slate-50">
                  {filteredPatients.map(pt => {
                    const type = getLatestClinicalType(pt.id);
                    return (
                      <div key={pt.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <div><span className="font-bold text-slate-800 text-sm block">{pt.name}</span><span className="text-emerald-600 font-mono text-xs font-bold block mt-0.5">P-{pt.id}</span></div>
                          <span className={getAppointmentTypeBadge(type)}>{type || 'No appointment'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div><span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Phone</span><span className="font-medium text-slate-700">{pt.phone?.replace(/\D/g, '').slice(-10) || 'N/A'}</span></div>
                          <div><span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">WhatsApp</span><span className="font-medium text-slate-700">{(pt.whatsapp || pt.phone)?.replace(/\D/g, '').slice(-10) || 'N/A'}</span></div>
                          <div><span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Age</span><span className="font-medium text-slate-700">{pt.age || 'N/A'}</span></div>
                          <div><span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Gender</span><span className="font-medium text-slate-700">{pt.gender || 'N/A'}</span></div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 mt-auto flex items-center justify-between gap-2">
                          <button onClick={() => setViewingPatient(pt)} className="flex-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Eye className="w-4 h-4" /> View</button>
                          {(activeRole === 'receptionist' || activeRole === 'admin') && (
                            <button onClick={(e) => openEditContactModal(pt, e)} className="flex-1 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"><Pencil className="w-4 h-4" /> Edit</button>
                          )}
                          <button onClick={() => onSelectPatient && onSelectPatient(pt)} className={`${(activeRole === 'receptionist' || activeRole === 'admin') ? '' : 'flex-1'} text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5`}><Activity className="w-4 h-4" /> Timeline</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden xl:block overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-3 px-4">Patient ID</th><th className="py-3 px-4">Name</th><th className="py-3 px-4">Phone No</th><th className="py-3 px-4">WhatsApp</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Age</th><th className="py-3 px-4">Gender</th><th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPatients.map(pt => {
                        const type = getLatestClinicalType(pt.id);
                        return (
                          <tr key={pt.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-emerald-600">P-{pt.id}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{pt.name}</td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{pt.phone?.replace(/\D/g, '').slice(-10)}</td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{(pt.whatsapp || pt.phone)?.replace(/\D/g, '').slice(-10)}</td>
                            <td className="py-3 px-4"><span className={getAppointmentTypeBadge(type)}>{type || 'No appointment'}</span></td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{pt.age}</td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{pt.gender || 'N/A'}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button onClick={() => setViewingPatient(pt)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200"><Eye className="w-4 h-4" /> View</button>
                                {(activeRole === 'receptionist' || activeRole === 'admin') && (
                                  <button onClick={(e) => openEditContactModal(pt, e)} className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-amber-200"><Pencil className="w-4 h-4" /> Edit</button>
                                )}
                                <button onClick={() => onSelectPatient && onSelectPatient(pt)} className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-emerald-200"><Activity className="w-4 h-4" /> Timeline</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContactPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-left animate-scaleIn">
            <div className="p-4 flex justify-between items-start border-b border-slate-100">
              <div><h3 className="text-lg font-bold text-slate-800">Edit Contact</h3><p className="text-sm font-medium text-slate-500 mt-0.5">{editingContactPatient.name}</p></div>
              <button onClick={() => setEditingContactPatient(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-50 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <input type="tel" value={editedPhone} onChange={e => setEditedPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow" placeholder="Phone number" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp Number</label>
                <input type="tel" value={editedWhatsapp} onChange={e => setEditedWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow" placeholder="WhatsApp number" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end items-center gap-2 border-t border-slate-100">
              <button onClick={() => setEditingContactPatient(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm" disabled={isSavingContact}>Cancel</button>
              <button onClick={handleSaveContact} disabled={isSavingContact} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSavingContact && <Loader2 className="w-4 h-4 animate-spin" />}{isSavingContact ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Patient Details Modal */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden text-left animate-scaleIn">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">{viewingPatient.name?.charAt(0) || 'P'}</div>
                <div><h2 className="text-xl font-bold text-slate-800">{viewingPatient.name}</h2><p className="text-slate-500 text-sm font-medium">P-{viewingPatient.id} • Registered {viewingPatient.createdAt ? new Date(viewingPatient.createdAt).toISOString().split('T')[0] : 'N/A'}</p></div>
              </div>
              <button onClick={() => setViewingPatient(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">Personal Information</h3>
              <ul className="mb-4">
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50"><span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Age</span><span className="font-medium text-slate-800 text-sm">{viewingPatient.age || 'N/A'} yrs</span></li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50"><span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Gender</span><span className="font-medium text-slate-800 text-sm">{viewingPatient.gender || 'N/A'}</span></li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50"><span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Phone Number</span><span className="font-medium text-slate-800 text-sm">{viewingPatient.phone?.replace(/\D/g, '').slice(-10) || 'N/A'}</span></li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50"><span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">WhatsApp</span><span className="font-medium text-slate-800 text-sm">{(viewingPatient.whatsapp || viewingPatient.phone)?.replace(/\D/g, '').slice(-10) || 'N/A'}</span></li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50"><span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Location</span><span className="font-medium text-slate-800 text-sm">{viewingPatient.location || 'N/A'}</span></li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-start sm:items-center py-1 border-b border-slate-50"><span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Address</span><span className="font-medium text-slate-800 text-sm sm:text-right sm:max-w-[70%]">{viewingPatient.address || 'N/A'}</span></li>
              </ul>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">Clinical Details</h3>
              <ul className="mb-4">
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50"><span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Appointment Type</span><span className="font-medium text-slate-800 text-sm">{getLatestAppointmentType(viewingPatient.id)}</span></li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50"><span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Next Follow-up Date</span><span className="font-medium text-slate-800 text-sm">{(() => { const info = getFollowupInfo(viewingPatient.id); if (!info || !info.date) return 'No follow-up'; return `${new Date(info.date).toLocaleDateString('en-GB')} (${info.status})`; })()}</span></li>
              </ul>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Primary Medical Conditions / Notes</span>
                <div className="space-y-3">
                  {viewingPatient.medical_conditions && <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{viewingPatient.medical_conditions}</p>}
                  {(() => {
                    const note = getLatestAppointmentNote(viewingPatient.id);
                    if (note) return <div className={viewingPatient.medical_conditions ? "pt-2 border-t border-slate-200" : ""}><span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Latest Booking Note (Call/Reason):</span><p className="text-slate-600 text-sm italic leading-relaxed">"{note}"</p></div>;
                    return !viewingPatient.medical_conditions && <p className="text-slate-400 text-sm italic">No specific medical conditions or appointment notes recorded.</p>;
                  })()}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setViewingPatient(null)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Edit Follow-up Modal */}
      {editingPatient && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-left border border-slate-200">
            <div className="p-4 flex justify-between items-start border-b border-slate-100">
              <div><h3 className="text-lg font-bold text-slate-800">Update Follow-up</h3><p className="text-sm font-medium text-slate-500 mt-0.5">{editingPatient.name}</p></div>
              <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-50 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <select value={editingFollowupStatus} onChange={e=>setEditingFollowupStatus(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow">
                  <option value="Pending">Pending</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Schedule Date</label>
                <input type="date" value={editingFollowupDate ? new Date(editingFollowupDate).toISOString().split('T')[0] : ''} onChange={e=>setEditingFollowupDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes (Optional)</label>
                <textarea rows={2} placeholder="Any remarks..." value={editingFollowupNotes} onChange={e=>setEditingFollowupNotes(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-shadow" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
              {editingConsultationId ? (
                <button className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors" onClick={async () => {
                  try { setIsUpdatingFollowup(true); await updateReceptionistFollowup(editingConsultationId, { followupDate: null, notes: null, status: 'Pending' }); toast.success('Follow-up cleared'); if (onRefreshConsultations) await onRefreshConsultations(); await fetchPatients(); setEditingPatient(null); } catch (err) { toast.error('Failed to clear'); } finally { setIsUpdatingFollowup(false); }
                }}>Remove</button>
              ) : <div></div>}
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm" onClick={()=>setEditingPatient(null)}>Cancel</button>
                <button className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2" onClick={async () => {
                  if (!editingConsultationId) { toast.error('No consultation available to attach follow-up'); return; }
                  try { setIsUpdatingFollowup(true); await updateReceptionistFollowup(editingConsultationId, { followupDate: editingFollowupDate || null, notes: editingFollowupNotes || null, status: editingFollowupStatus || 'Pending' }); toast.success('Follow-up updated successfully'); if (onRefreshConsultations) await onRefreshConsultations(); await fetchPatients(); setEditingPatient(null); } catch (err) { toast.error('Failed to save'); } finally { setIsUpdatingFollowup(false); }
                }}>{isUpdatingFollowup ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}