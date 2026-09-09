import React, { useState } from 'react';
import { Search, Stethoscope, Calendar, Activity, Bed, RefreshCw, ClipboardList, Eye, ChevronLeft, ChevronRight, Star, FileText, X, User, Phone, Mail, Calendar as CalendarIcon, UserPlus, Plus, Clock, Droplets, Download, MessageSquare, Share2 } from 'lucide-react';
import { Sun, Moon, SunMoon } from 'lucide-react';
import { toast } from 'react-toastify';
import { generateConsultationPDF, generateDetoxPDF, buildConsultationPdfBlob } from '../utils/pdfGenerator';
import { uploadConsultationPdf } from '../api/consultationApi';
import { createAppointment, updateAppointment } from '../api/appointmentApi';
import PatientHistoryModal from './PatientHistoryModal';

export default function UnifiedPatientRecords({
  patients = [],
  appointments = [],
  consultations = [],
  detoxSessions = [],
  stayManagement = [],
  prescriptions = [],
  dietCharts = [],
  followups = [],
  reviews = [],
  onAddPatient,
  onSelectPatient,
  activeRole,
  currentUser,
  doctors = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareDoctor, setSelectedShareDoctor] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [patientToShare, setPatientToShare] = useState(null);

  // New Patient Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    location: '',
    address: '',
    phone: '',
    phoneAsWhatsapp: true,
    whatsapp: '',
    medical_conditions: ''
  });

  // Identify current doctor and their relevant patients
  const isDoctor = activeRole === 'doctor' || activeRole === 'therapist';
  let currentDoc = isDoctor
    ? doctors.find(d => {
      const doctorEmail = (d.user?.email || d.email || '').toLowerCase();
      const doctorName = (d.user?.fullName || d.name || '').toLowerCase();
      const currentUserLower = String(currentUser || '').toLowerCase();
      return doctorEmail === currentUserLower || doctorName === currentUserLower;
    })
    : null;

  // FALLBACK: Identify doctor from appointments or consultations if master list is empty
  if (isDoctor && !currentDoc) {
    const sourceAppt = appointments.find(a => {
      const dEmail = (a.doctor?.user?.email || '').toLowerCase();
      const dName = (a.doctor?.user?.fullName || a.doctor?.name || '').toLowerCase();
      const currentUserLower = String(currentUser || '').toLowerCase();
      return dEmail === currentUserLower || dName === currentUserLower;
    });

    if (sourceAppt && sourceAppt.doctor) {
      currentDoc = {
        ...sourceAppt.doctor,
        name: sourceAppt.doctor.user?.fullName || sourceAppt.doctor.name
      };
    } else {
      const sourceCons = consultations.find(c => {
        const dName = (c.doctor_name || '').toLowerCase();
        const currentUserLower = String(currentUser || '').toLowerCase();
        return dName === currentUserLower;
      });
      if (sourceCons) {
        currentDoc = { id: sourceCons.doctor_id, name: sourceCons.doctor_name };
      }
    }
  }

  const currentDocId = currentDoc?.id;

  // Create a robust list of doctors for name lookups
  let availableDoctors = [...doctors];
  if (appointments && appointments.length > 0) {
    appointments.forEach(a => {
      const doc = a.doctor;
      if (doc && doc.id) {
        if (!availableDoctors.some(d => String(d.id) === String(doc.id))) {
          availableDoctors.push({
            ...doc,
            name: doc.user?.fullName || doc.name || `Doctor ${doc.id}`
          });
        }
      }
    });
  }

  // Create a set of patient IDs assigned to this doctor
  const myPatientIds = isDoctor ? new Set([
    ...appointments
      .filter(a => currentDocId && Number(a.doctor_id ?? a.doctorId ?? a.doctor?.id) === Number(currentDocId))
      .map(a => String(a.patient_id || a.patientId)),
    ...consultations
      .filter(c => currentDocId && Number(c.doctor_id ?? c.doctorId ?? c.doctor?.id) === Number(currentDocId))
      .map(c => String(c.patient_id || c.patientId))
  ]) : null;

  const getAppointmentTypeBadge = (type) => {
    if (!type) return 'border-slate-200 bg-slate-100 text-slate-600';
    const t = type.toLowerCase();
    if (t.includes('detox')) return 'border-teal-200 bg-teal-50 text-teal-700';
    if (t.includes('review')) return 'border-amber-200 bg-amber-50 text-amber-700';
    if (t.includes('initial')) return 'border-purple-200 bg-purple-50 text-purple-700';
    return 'border-purple-200 bg-purple-50 text-purple-700';
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

    const latestAppt = getLatestAppointment(patientId);
    if (latestAppt?.appointmentType && latestAppt.appointmentType !== 'General') {
      if (latestAppt.appointmentType === 'Detox' && latestAppt.session) {
        return `Detox (${latestAppt.session})`;
      }
      return latestAppt.appointmentType;
    }

    // Check all follow-ups for any pending detox follow-up - this takes priority
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

    const followup = getNextFollowup(patientId);
    if (followup?.appointmentType === 'Detox') return 'Detox';
    if (followup?.appointmentType) return followup.appointmentType;

    // Check for future detox appointments
    const futureDetoxAppointment = (appointments || [])
      .find(a => {
        const apptDate = new Date(a.date || a.appointmentDate || 0);
        const matchesPatient = String(a.patient_id || a.patientId) === String(patientId);
        const isFuture = !isNaN(apptDate.getTime()) && apptDate >= today;
        const isScheduled = a.status === 'Scheduled';
        return matchesPatient && isFuture && isScheduled && a.appointmentType === 'Detox';
      });

    if (futureDetoxAppointment) return `Detox (${futureDetoxAppointment.session || 'FN'})`;

    // Check consultation's detox recommendation
    const latestCons = getLatestConsultation(patientId);
    if (latestCons && (latestCons.detox_recommended || latestCons.detoxRecommended)) {
      // Only return Detox if there's a future detox scheduled
      const hasFutureDetox = (appointments || [])
        .find(a => {
          const apptDate = new Date(a.date || a.appointmentDate || 0);
          const matchesPatient = String(a.patient_id || a.patientId) === String(patientId);
          const isFuture = !isNaN(apptDate.getTime()) && apptDate >= today;
          const isScheduled = a.status === 'Scheduled';
          return matchesPatient && isFuture && isScheduled && a.appointmentType === 'Detox';
        });
      if (hasFutureDetox) return `Detox (${hasFutureDetox.session || 'FN'})`;
    }

    // Check for any completed detox sessions (less than 3) only if there's a future detox planned
    const completedDetoxCount = getCompletedDetoxSessionCount(patientId);
    if (completedDetoxCount >= 3) {
      // After 3+ detox sessions, patient should be in Review - but only if there's a follow-up pending
      const hasPendingReview = (followups || []).some(f => {
        const fupDate = new Date(f.scheduled_date || f.date || 0);
        const matchesPatient = String(f.patient_id || f.patientId) === String(patientId);
        const isPending = f.status === 'Pending';
        const isFuture = !isNaN(fupDate.getTime()) && fupDate >= today;
        return matchesPatient && isPending && isFuture;
      });
      if (hasPendingReview) return 'Review';
    } else if (completedDetoxCount > 0) {
      // Only return Detox if there's a future detox scheduled
      const hasFutureDetox = (appointments || [])
        .find(a => {
          const apptDate = new Date(a.date || a.appointmentDate || 0);
          const matchesPatient = String(a.patient_id || a.patientId) === String(patientId);
          const isFuture = !isNaN(apptDate.getTime()) && apptDate >= today;
          const isScheduled = a.status === 'Scheduled';
          return matchesPatient && isFuture && isScheduled && a.appointmentType === 'Detox';
        });
      if (hasFutureDetox) return `Detox (${hasFutureDetox.session || 'FN'})`;
    }

    return null;
  };

  const getLatestAppointment = (patientId) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Include everything through the end of today

    // Find the most recent past or current appointment
    const sorted = appointments
      .filter(a => {
        const isPt = String(a.patient_id || a.patientId) === String(patientId);
        if (!isPt || !a.appointmentType) return false;

        const apptDate = new Date(a.date || a.appointmentDate || 0);
        // Include only past/today appointments or those already in lobby/consultation/done
        return apptDate <= today || ['Arrived', 'Checked-in', 'Completed'].includes(a.status);
      })
      .sort((a, b) => new Date(b.date || b.appointmentDate || 0) - new Date(a.date || a.appointmentDate || 0));

    return sorted[0] || null;
  };

  const getNextFollowup = (patientId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getPendingConsultationFollowup = () => {
      const latestCons = consultations
        .filter(c => String(c.patient_id || c.patientId) === String(patientId))
        .sort((a, b) => new Date(b.consultationDate || b.date || 0) - new Date(a.consultationDate || a.date || 0))[0];

      if (!latestCons) return null;
      const rec = latestCons?.receptionistFollowup || latestCons?.receptionist_followup;
      const recIsActive = rec && rec.status !== 'Cancelled' && rec.status !== 'Completed';
      const effectiveDate = recIsActive ? getFollowupDateValue(rec) : getFollowupDateValue(latestCons);
      if (!effectiveDate) return null;
      const followupDateObj = new Date(effectiveDate);
      if (isNaN(followupDateObj.getTime()) || followupDateObj < today) return null;

      return {
        scheduled_date: effectiveDate,
        appointmentType: (latestCons.detox_recommended || latestCons.detoxRecommended) ? 'Detox' : 'Review',
        source: 'consultation'
      };
    };

    const getPendingDetoxFollowup = () => {
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
        scheduled_date: detoxFollowupDate,
        appointmentType: latestDetox.sessionType === 'fullDay' ? 'Detox' : 'Review',
        source: 'detox'
      };
    };

    const futureAppt = appointments
      .filter(a => {
        const isPt = String(a.patient_id || a.patientId) === String(patientId);
        if (!isPt) return false;
        const apptDate = new Date(a.date || a.appointmentDate || 0);
        return apptDate >= today && a.status === 'Scheduled';
      })
      .sort((a, b) => new Date(a.date || a.appointmentDate || 0) - new Date(b.date || b.appointmentDate || 0))[0];

    const candidates = [];
    if (futureAppt) {
      candidates.push({
        scheduled_date: futureAppt.date || futureAppt.appointmentDate,
        appointmentType: futureAppt.appointmentType,
        source: 'appointment'
      });
    }

    const detoxFollowup = getPendingDetoxFollowup();
    if (detoxFollowup) candidates.push(detoxFollowup);

    const consultationFollowup = getPendingConsultationFollowup();
    if (consultationFollowup) candidates.push(consultationFollowup);

    const fromFollowups = followups
      .filter(f => String(f.patient_id) === String(patientId) && f.status === 'Pending')
      .sort((a, b) => new Date(b.scheduled_date || b.date || 0) - new Date(a.scheduled_date || a.date || 0))[0];

    if (fromFollowups) {
      candidates.push({
        scheduled_date: fromFollowups.scheduled_date || fromFollowups.date,
        appointmentType: fromFollowups.appointmentType || fromFollowups.type || 'Review',
        source: 'derived'
      });
    }

    if (candidates.length === 0) return null;

    return candidates.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];
  };

  // Create a robust list of patients
  let allAvailablePatients = [...patients];

  if (appointments && appointments.length > 0) {
    appointments.forEach(a => {
      const pt = a.patient || a.Patient;
      if (pt && pt.id && !allAvailablePatients.some(p => String(p.id) === String(pt.id))) {
        allAvailablePatients.push({
          ...pt,
          name: pt.name || pt.fullName || 'Unknown Patient'
        });
      }
    });
  }

  const basePatients = isDoctor
    ? allAvailablePatients.filter(p => myPatientIds.has(String(p.id)))
    : allAvailablePatients;

  const filteredPatients = basePatients.filter(pt => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return true;
    const normalizedId = String(pt.id).toLowerCase();
    const isIdSearch = /^p-\d+$/.test(normalized);
    const idMatches = isIdSearch ? normalizedId === normalized.slice(2) : normalizedId.includes(normalized);
    return (
      pt.name.toLowerCase().includes(normalized) ||
      idMatches ||
      (pt.phone || '').includes(normalized) ||
      (pt.email || '').toLowerCase().includes(normalized)
    );
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const openModal = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const openShareModal = (patient) => {
    setPatientToShare(patient);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setPatientToShare(null);
    setSelectedShareDoctor('');
  };

  const handleShareToDoctor = async () => {
    if (!selectedShareDoctor) {
      toast.error('Please select a doctor to share with.');
      return;
    }
    setIsSharing(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const patientIdStr = String(patientToShare.id || patientToShare.patientId);
      
      // Find the active appointment for today for this patient
      const activeAppt = appointments.find(a => {
         const ptMatch = String(a.patient_id || a.patientId) === patientIdStr;
         const d = new Date(a.date || a.appointmentDate || 0);
         d.setHours(0, 0, 0, 0);
         const isToday = d.getTime() === today.getTime();
         const isActive = ['Scheduled', 'Arrived', 'Checked-in'].includes(a.status);
         return ptMatch && isToday && isActive;
      });

      if (!activeAppt) {
         toast.error("No active appointment found for this patient today to share.");
         setIsSharing(false);
         return;
      }

      await updateAppointment(activeAppt.id, {
        doctorId: parseInt(selectedShareDoctor),
        status: "Arrived",
        notes: (activeAppt.notes ? activeAppt.notes + " | " : "") + "Shared to another doctor."
      });

      toast.success('Patient record shared successfully!');
      closeShareModal();
    } catch (error) {
      console.error('Error sharing record:', error);
      toast.error(error.message || 'Failed to share patient record');
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPt = {
      id: `P-${100 + patients.length + 1}`,
      name: formData.name,
      age: parseInt(formData.age) || 30,
      gender: 'Other',
      blood_group: 'O+',
      phone: formData.phone,
      whatsapp: formData.phoneAsWhatsapp ? formData.phone : formData.whatsapp,
      location: formData.location,
      address: formData.address || 'n/a',
      medical_conditions: formData.medical_conditions || 'Registered via Intake form',
      email: 'n/a',
      registered_at: new Date().toISOString().split('T')[0]
    };
    if (onAddPatient) onAddPatient(newPt);
    setIsAdding(false);
    setFormData({
      name: '',
      age: '',
      location: '',
      address: '',
      phone: '',
      phoneAsWhatsapp: true,
      whatsapp: '',
      medical_conditions: ''
    });
  };

  return (
    <>
      <div className="space-y-6">
        <style>{`
        .consultation-notes-content {
          font-size: 0.9375rem;
          line-height: 1.6;
        }
        .consultation-notes-content ul,
        .consultation-notes-content ol {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          padding-left: 1.75rem;
        }
        .consultation-notes-content ul { list-style-type: disc; }
        .consultation-notes-content ol { list-style-type: decimal; }
        .consultation-notes-content li { 
          margin-bottom: 0.375rem;
          line-height: 1.5;
        }
        .consultation-notes-content p { 
          margin-bottom: 0.875rem;
          line-height: 1.5;
        }
        .consultation-notes-content h1 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
        }
        .consultation-notes-content h2 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-top: 0.875rem;
          margin-bottom: 0.625rem;
        }
        .consultation-notes-content strong { font-weight: 700; color: #1e293b; }
        .consultation-notes-content em { font-style: italic; }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .modal-animate {
          animation: modalSlideIn 0.2s ease-out;
        }
        
        .modal-content-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .modal-content-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .modal-content-scroll::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .modal-content-scroll::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>

        {/* Header - Directory Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">Patient Records</h1>
            <p className="text-slate-500 text-sm mt-1">Browse patients, view consultation history.</p>
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Patient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Smith"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 29"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indiranagar"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Address</label>
                <input
                  type="text"
                  placeholder="Full residential address (optional)"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="flex items-center space-x-2.5 py-1">
                <input
                  id="phoneAsWhatsappIntake"
                  type="checkbox"
                  checked={formData.phoneAsWhatsapp}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="phoneAsWhatsappIntake" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                  Use Phone number as WhatsApp number
                </label>
              </div>

              {!formData.phoneAsWhatsapp && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required={!formData.phoneAsWhatsapp}
                    placeholder="WhatsApp No with country code"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Primary Medical Conditions</label>
                <textarea
                  rows="2"
                  placeholder="Patient symptoms, specific requests, or details..."
                  value={formData.medical_conditions}
                  onChange={e => setFormData({ ...formData, medical_conditions: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium resize-none transition-all font-medium"
                ></textarea>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Register Intake Record
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            {/* Search Bar - Directory Style */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients by name, ID, phone or email..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Table - Directory Style */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Latest Appointment</th>
                    <th className="py-3 px-4">Appointment Date</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Follow-up</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPatients.map(pt => {
                    const latestAppointment = getLatestAppointment(pt.id);
                    const nextFollowup = getNextFollowup(pt.id); // This is correct for the follow-up column
                    const clinicalType = getLatestClinicalType(pt.id);
                    return (
                      <tr key={pt.id} className="hover:bg-slate-50 transition-colors align-top">
                        <td className="py-4 px-4 align-top">
                          <div className="font-semibold text-slate-900">{pt.name}</div>
                          <div className="text-xs text-slate-500 mt-1">P-{pt.id}</div>
                        </td>
                        <td className="py-4 px-4 align-top">
                          {clinicalType ? (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${getAppointmentTypeBadge(clinicalType)}`}>
                              {clinicalType}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">No appointment</span>
                          )}
                        </td>
                        <td className="py-4 px-4 align-top text-slate-600 text-sm">
                          {latestAppointment ? (
                            <>
                              <div>{latestAppointment.date}</div>
                              {latestAppointment.time && <div className="text-xs text-slate-500">{latestAppointment.time}</div>}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="text-slate-600">{pt.phone?.replace(/\D/g, '').slice(-10) || 'No phone'}</div>
                          {pt.email && pt.email.toLowerCase() !== 'n/a' && (
                            <div className="text-xs text-slate-500 mt-1">{pt.email}</div>
                          )}
                        </td>
                        <td className="py-4 px-4 align-top">
                          {nextFollowup ? (
                            <div className="text-slate-600">{formatDate(nextFollowup.scheduled_date)}</div>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-4 px-4 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openModal(pt)}
                              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              History
                            </button>
                            <button
                              type="button"
                              onClick={() => openShareModal(pt)}
                              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Share
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectPatient && onSelectPatient(pt)}
                              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Timeline
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No patient records match your search.</div>
            ) : (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6 px-4 pb-4">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredPatients.length)}</span> of <span className="font-semibold text-slate-800">{filteredPatients.length}</span> patients
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-semibold transition ${currentPage === pageNum ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal - Consultation History */}
        {isModalOpen && selectedPatient && (
          <PatientHistoryModal
            patient={selectedPatient}
            consultations={consultations}
            detoxSessions={detoxSessions}
            doctors={availableDoctors}
            onClose={closeModal}
          />
        )}
      </div>


      {/* Share Doctor Modal */}
      {showShareModal && patientToShare && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" onClick={closeShareModal}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full modal-animate overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Share Record</h2>
                </div>
                <button onClick={closeShareModal} className="p-2 rounded-full hover:bg-white/10 transition text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-700 text-sm">Select a doctor to share <strong>{patientToShare.name}</strong>'s history with.</p>
                <select
                  value={selectedShareDoctor}
                  onChange={(e) => setSelectedShareDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Doctor</option>
                  {availableDoctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name || d.user?.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={closeShareModal} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold py-2.5 px-5 rounded-lg text-sm transition-colors shadow-sm">
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
    </>
  );
}