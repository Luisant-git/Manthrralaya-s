import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Plus, CalendarPlus, Calendar, ChevronLeft, ChevronRight, Loader2, Search, FilterX } from 'lucide-react';
import { toast } from 'react-toastify';
import { getPagedAppointments } from '../api/appointmentApi';

export default function AppointmentsView({ 
  appointments, 
  patients, 
  doctors, 
  onAddAppointment, 
  onCheckIn, 
  onCancelAppointment,
  consultations = [],
  detoxSessions = [],
  followups = [],
  activeRole,
  currentUser
}) {
  const [isBooking, setIsBooking] = useState(false);
  const [showFollowups, setShowFollowups] = useState(false);
  
  // Server-side pagination for the schedule log (Patient Records UI style)
  const [serverPage, setServerPage] = useState(1);
  const serverPageSize = 8;
  const appointmentTypeOptions = ['New consultation', 'Detox', 'Review', 'Follow-up'];
  const [serverItems, setServerItems] = useState([]);
  const [totalBooked, setTotalBooked] = useState(0);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [searchTextDebounced, setSearchTextDebounced] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchTextDebounced(searchText.trim()), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    if ((activeRole === 'doctor' || activeRole === 'therapist') && doctors?.length > 0 && !doctorFilter) {
      const currentUserEmail = (currentUser || '').toLowerCase();
      const currentDoctor = doctors.find(d => {
        const dEmail = (d.user?.email || d.email || '').toLowerCase();
        const dName = (d.user?.fullName || d.name || '').toLowerCase();
        return dEmail === currentUserEmail || (dName && currentUserEmail.includes(dName));
      });
      if (currentDoctor) {
        setDoctorFilter(currentDoctor.id.toString());
      }
    }
  }, [activeRole, currentUser, doctors]);

  // Reset to first page whenever a filter changes
  useEffect(() => {
    setServerPage(1);
  }, [searchTextDebounced, typeFilter, doctorFilter, fromDate, toDate]);

  useEffect(() => {
    let active = true;
    setLoadingAppointments(true);
    getPagedAppointments(serverPage, serverPageSize, {
      search: searchTextDebounced || undefined,
      appointmentType: typeFilter || undefined,
      doctorId: doctorFilter || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    })
      .then(res => {
        if (!active) return;
        const data = Array.isArray(res) ? res : (res?.data || []);
        const pag = res?.pagination;
        setServerItems(data);
        setTotalBooked(pag?.total ?? data.length);
      })
      .catch(err => {
        console.error('Failed to load appointments page:', err);
        if (active) {
          setServerItems([]);
          setTotalBooked(0);
        }
      })
      .finally(() => { if (active) setLoadingAppointments(false); });
    return () => { active = false; };
  }, [serverPage, serverPageSize, refreshKey, searchTextDebounced, typeFilter, doctorFilter, fromDate, toDate]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalSchedulePages) setServerPage(page);
  };

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter('');
    setDoctorFilter('');
    setFromDate('');
    setToDate('');
  };
  
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointmentType: 'New consultation',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    notes: ''
  });

  // Helper function to get next follow-up from consultations or detox sessions
  const getFollowupDateValue = (record) => {
    if (!record) return null;
    return record.followupDate || record.followup_date || null;
  };

  const isValidFutureDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const normalizeString = (value) => String(value || '').trim();
  const isDetoxType = (value) => normalizeString(value).toLowerCase() === 'detox';
  const isScheduled = (value) => normalizeString(value).toLowerCase() === 'scheduled';

  const hasCompletedThreeDetoxSessions = (patientId) => {
    const ptDetox = detoxSessions.filter(d => String(d.patientId || d.patient_id) === String(patientId));
    return ptDetox.length >= 3;
  };

  const getFinalFollowupType = (patientId, defaultType) => {
    if (hasCompletedThreeDetoxSessions(patientId)) return 'Review';
    const type = normalizeString(defaultType);
    return type || 'Review';
  };

  const getFinalAppointmentType = (patientId, rawType) => {
    if (hasCompletedThreeDetoxSessions(patientId)) return 'Review';
    const type = normalizeString(rawType);
    return type || 'Review';
  };

  const getNextDetoxSessionValue = (patientId) => {
    if (!patientId) return 'FN';
    const ptDetox = detoxSessions.filter(d => String(d.patientId || d.patient_id) === String(patientId));
    const completedTypes = ptDetox.map(d => String(d.sessionType || '').toLowerCase());
    if (!completedTypes.includes('morning')) return 'FN';
    if (!completedTypes.includes('evening')) return 'AN';
    return 'FD';
  };

  const handlePatientSelect = (patientId) => {
    const isReview = hasCompletedThreeDetoxSessions(patientId);
    const appointmentType = isReview ? 'Review' : formData.appointmentType;
    const session = appointmentType === 'Detox' ? getNextDetoxSessionValue(patientId) : formData.session;
    setFormData({ ...formData, patient_id: patientId, appointmentType, session });
  };

  const getPendingDerivedFollowup = (patientId) => {
    const pending = followups
      .filter(f => String(f.patient_id || f.patientId) === String(patientId))
      .map(f => ({
        ...f,
        scheduled_date: f.scheduled_date || f.date || getFollowupDateValue(f) || null,
        appointment_type: getFinalFollowupType(patientId, f.appointmentType || f.type || 'Review'),
        source: 'derived',
        notes: f.notes || f.followup_remarks || f.followupRemarks || 'Pending follow-up',
        isPending: true
      }))
      .filter(f => isValidFutureDate(f.scheduled_date))
      .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));

    return pending[0] || null;
  };

  const getNextFollowup = (patientId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        doctor_name: latestDetox.doctor?.user?.fullName || latestDetox.doctorName,
        doctor_id: latestDetox.doctorId || latestDetox.doctor_id,
        appointment_type: getFinalFollowupType(patientId, 'Detox'),
        source: 'detox',
        notes: latestDetox.followupRemarks || latestDetox.followup_remarks || 'Follow-up after detox session',
        isPending: true
      };
    };

    const getPendingConsultationFollowup = () => {
      const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(patientId));
      const latestCons = [...ptCons].sort((a, b) => new Date(b.date || b.consultationDate || 0) - new Date(a.date || a.consultationDate || 0))[0];
      if (!latestCons) return null;

      const rec = latestCons?.receptionistFollowup || latestCons?.receptionist_followup;
      const recIsActive = rec && rec.status !== 'Cancelled' && rec.status !== 'Completed';
      const followupDate = recIsActive ? getFollowupDateValue(rec) : getFollowupDateValue(latestCons);
      if (!followupDate) return null;
      const followupDateObj = new Date(followupDate);
      if (isNaN(followupDateObj.getTime()) || followupDateObj < today) return null;

      return {
        scheduled_date: followupDate,
        doctor_name: latestCons.detox_doctor_name || latestCons.detoxDoctorName || latestCons.doctor_name,
        doctor_id: latestCons.detox_doctor_id || latestCons.detoxDoctorId || latestCons.doctor_id,
        appointment_type: getFinalFollowupType(patientId, (latestCons.detox_recommended || latestCons.detoxRecommended) ? 'Detox' : 'Review'),
        source: 'consultation',
        notes: latestCons.followup_remarks || latestCons.followupRemarks || 'Follow-up from consultation',
        isPending: true
      };
    };

    const futureAppt = appointments
      .filter(a => {
        const isPt = String(a.patient_id || a.patientId) === String(patientId);
        if (!isPt) return false;
        const apptDate = new Date(a.date || a.appointmentDate || 0);
        const status = String(a.status || '').toLowerCase();
        return apptDate > today && status === 'scheduled';
      })
      .sort((a, b) => new Date(a.date || a.appointmentDate || 0) - new Date(b.date || b.appointmentDate || 0))[0];

    const detoxFollowup = getPendingDetoxFollowup();
    const consultationFollowup = getPendingConsultationFollowup();
    const derivedFollowup = getPendingDerivedFollowup(patientId);

    const candidates = [
      futureAppt ? {
        scheduled_date: futureAppt.date || futureAppt.appointmentDate,
        appointment_type: getFinalFollowupType(patientId, futureAppt.appointmentType),
        source: 'appointment',
        isPending: false
      } : null,
      detoxFollowup,
      consultationFollowup,
      derivedFollowup
    ].filter(Boolean);

    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];
  };

  // Combine booked appointments (from backend page) with pending follow-ups
  const getAllAppointmentsWithFollowups = () => {
    const bookedAppointments = serverItems.map(appt => {
      const patientId = appt.patient_id || appt.patientId;
      const rawType = appt.appointmentType || appt.type || appt.appointment_type;
      const appointmentType = getFinalAppointmentType(patientId, rawType);
      return {
        ...appt,
        appointmentType,
        isFollowup: false,
        displayType: 'booked'
      };
    });
    
    const pendingFollowups = [];
    
    // Only add follow-ups if showFollowups is true
    if (showFollowups) {
      patients.forEach(patient => {
        const nextFollowup = getNextFollowup(patient.id);
        if (nextFollowup && nextFollowup.isPending) {
          // Check if there's already a booked appointment for this follow-up date
          const hasExistingAppointment = appointments.some(appt => 
            String(appt.patient_id || appt.patientId) === String(patient.id) &&
            (appt.appointmentDate === nextFollowup.scheduled_date || 
             appt.date === nextFollowup.scheduled_date)
          );
          
          if (!hasExistingAppointment) {
            pendingFollowups.push({
              id: `followup-${patient.id}-${nextFollowup.scheduled_date}`,
              patient_id: patient.id,
              patientId: patient.id,
              doctor_id: nextFollowup.doctor_id,
              doctorId: nextFollowup.doctor_id,
              appointmentDate: nextFollowup.scheduled_date,
              date: nextFollowup.scheduled_date,
              appointmentType: nextFollowup.appointment_type,
              status: 'Scheduled',
              notes: nextFollowup.notes,
              doctor_name: nextFollowup.doctor_name,
              isFollowup: true,
              followupSource: nextFollowup.source,
              displayType: 'followup'
            });
          }
        }
      });
    }
    
    // Combine and sort by date
    const all = [...bookedAppointments, ...pendingFollowups];
    return all.sort((a, b) => {
      const dateA = a.appointmentDate || a.date;
      const dateB = b.appointmentDate || b.date;
      return new Date(dateB) - new Date(dateA);
    });
  };

  const allItems = getAllAppointmentsWithFollowups();

  const totalSchedulePages = Math.max(1, Math.ceil(totalBooked / serverPageSize));
  const pendingFollowupCount = allItems.filter(i => i.isFollowup).length;
  const scheduleStartIndex = (serverPage - 1) * serverPageSize;

  const getDisplayAppointmentType = (appt) => {
    if (String(appt.appointmentType).toLowerCase() !== 'detox') return appt.appointmentType || 'General';
    let displaySession = appt.session;
    if (!displaySession) {
       const ptDetox = detoxSessions.filter(d => String(d.patientId || d.patient_id) === String(appt.patient_id || appt.patientId));
       const matchingDetox = ptDetox.find(d => String(d.appointmentId || d.appointment_id) === String(appt.id));
       if (matchingDetox) {
         const sType = String(matchingDetox.sessionType || '').toLowerCase();
         displaySession = sType === 'morning' ? 'FN' : sType === 'evening' ? 'AN' : 'FD';
       } else {
         const completedTypes = ptDetox.map(d => String(d.sessionType || '').toLowerCase());
         if (!completedTypes.includes('morning')) displaySession = 'FN';
         else if (!completedTypes.includes('evening')) displaySession = 'AN';
         else if (!completedTypes.includes('fullday')) displaySession = 'FD';
         else displaySession = 'FN';
       }
    }
    return `Detox (${displaySession})`;
  };

  const getNextDetoxSessionLabel = (patientId) => {
    if (!patientId) return 'Detox (FN)';
    const ptDetox = detoxSessions.filter(d => String(d.patientId || d.patient_id) === String(patientId));
    const completedTypes = ptDetox.map(d => String(d.sessionType || '').toLowerCase());
    let nextSession = 'FN';
    if (!completedTypes.includes('morning')) nextSession = 'FN';
    else if (!completedTypes.includes('evening')) nextSession = 'AN';
    else if (!completedTypes.includes('fullday')) nextSession = 'FD';
    return `Detox (${nextSession})`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patient_id) { toast.warn('Please select a patient.'); return; }
    if (!formData.doctor_id) { toast.warn('Please select a doctor.'); return; }

    const patientObj = patients.find(p => String(p.id) === String(formData.patient_id));
    const doctorObj = doctors.find(d => String(d.id) === String(formData.doctor_id));
    
    const newAppt = {
      id: `A-${200 + appointments.length + 1}`,
      patient_id: formData.patient_id,
      doctor_id: formData.doctor_id,
      appointmentType: formData.appointmentType,
      doctor_name: doctorObj?.user?.fullName || doctorObj?.name || 'Not Applicable',
      date: formData.date,
      time: formData.time,
      source: 'Direct Booking',
      status: 'Scheduled',
      notes: formData.notes
    };

    onAddAppointment(newAppt, patientObj, doctorObj);
    setRefreshKey(k => k + 1);
    setIsBooking(false);
    setFormData({ 
      patient_id: '', 
      doctor_id: '', 
      appointmentType: 'New consultation', 
      date: new Date().toISOString().split('T')[0], 
      time: '10:00 AM', 
      notes: '' 
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Arrived': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Checked-in': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toISOString().split('T')[0];
    } catch (e) {
      return dateStr;
    }
  };

  const findPatient = (appointment) => {
    if (!appointment) return {};
    const pid = appointment.patientId || appointment.patient_id;

    const masterPt = patients?.find(p => String(p.id) === String(pid));
    if (masterPt) return masterPt;

    if (appointment.patient || appointment.Patient) return appointment.patient || appointment.Patient;

    const nameToMatch = appointment.patient_name || appointment.patient?.name;
    if (nameToMatch) {
      return patients?.find(p => p.name === nameToMatch) || {};
    }

    return {};
  };

  const findDoctor = (appointment) => {
    const doctorId = appointment.doctorId || appointment.doctor_id;
    if (!doctorId) return null;
    
    let doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) {
      doctor = doctors.find(d => String(d.id) === String(doctorId));
    }
    return doctor;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Appointments & Queue
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage daily schedules, patient arrivals, and doctor queues.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFollowups(!showFollowups)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              showFollowups 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {showFollowups ? 'Hide Follow-ups' : 'Show Follow-ups'}
          </button>
          {/* <button
            onClick={() => setIsBooking(!isBooking)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            {isBooking ? <CalendarIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isBooking ? 'View Schedule' : 'Book Appointment'}
          </button> */}
        </div>
      </div>

      {isBooking ? (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left max-w-2xl mx-auto">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
            <CalendarPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Schedule New Appointment</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Patient</label>
                <select 
                  required 
                  value={formData.patient_id}
                  onChange={e => handlePatientSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose registered patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assign Doctor</label>
                <select 
                  required 
                  value={formData.doctor_id}
                  onChange={e => {
                    const selectedDocId = e.target.value;
                    const docInfo = doctors.find(d => String(d.id) === String(selectedDocId));
                    const isReviewPatient = hasCompletedThreeDetoxSessions(formData.patient_id);
                    if (docInfo?.role === 'THERAPIST') {
                      setFormData({
                        ...formData,
                        doctor_id: selectedDocId,
                        appointmentType: isReviewPatient ? 'Review' : 'Detox',
                        session: isReviewPatient ? formData.session : getNextDetoxSessionValue(formData.patient_id)
                      });
                    } else {
                      setFormData({ ...formData, doctor_id: selectedDocId });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose available doctor --</option>
                  {doctors.filter(d => {
                    if (formData.appointmentType !== 'Detox' && d.role === 'THERAPIST') return false;
                    return true;
                  }).map(d => (
                    <option key={d.id} value={d.id} disabled={d.status !== 'Available'}>
                      {d.user?.fullName || d.name} ({d.specialization}) 
                      {d.status !== 'Available' ? ' - Not Available' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
                <select
                  required
                  value={formData.appointmentType}
                  onChange={e => {
                    const newType = e.target.value;
                    const newSession = newType === 'Detox' ? getNextDetoxSessionValue(formData.patient_id) : formData.session;
                    setFormData({ ...formData, appointmentType: newType, session: newSession });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {(() => {
                    const selectedDoctor = doctors.find(d => String(d.id) === String(formData.doctor_id));
                    const selectedPatientIsReview = hasCompletedThreeDetoxSessions(formData.patient_id);
                    if (selectedDoctor?.role === 'THERAPIST') {
                      return selectedPatientIsReview ? (
                        <option value="Review">Review</option>
                      ) : (
                        <option value="Detox">{getNextDetoxSessionLabel(formData.patient_id)}</option>
                      );
                    }
                    return (
                      <>
                        <option value="New consultation">New Consultation</option>
                        <option value="Detox">{getNextDetoxSessionLabel(formData.patient_id)}</option>
                        <option value="Review">Follow-up</option>
                      </>
                    );
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason / Intake Notes</label>
              <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"></textarea>
            </div>
            
            <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-lg text-sm text-emerald-800">
              <span className="font-bold block mb-1">Automated WhatsApp Trigger</span>
              Scheduling will instantly send a Meta Cloud API booking confirmation to the patient's phone.
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm">
                Confirm & Dispatch Notification
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search Patient</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by patient name or mobile..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            <div className="w-full md:w-40">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                <option value="">All Types</option>
                {appointmentTypeOptions.map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            
            {!(activeRole === 'doctor' || activeRole === 'therapist') && (
              <div className="w-full md:w-44">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor</label>
                <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  <option value="">All Doctors</option>
                  {doctors.map(d => (<option key={d.id} value={d.id}>{d.user?.fullName || d.name}</option>))}
                </select>
              </div>
            )}
            
            <div className="w-full md:w-36">
              <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
              <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            
            <div className="w-full md:w-36">
              <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
              <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            
            <div className="w-full md:w-auto">
              <button
                onClick={clearFilters}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:text-rose-600 transition"
                title="Clear all filters"
              >
                <FilterX className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800">Master Schedule Log</h3>
            </div>
            <div className="text-xs text-slate-500">
              {totalBooked} booked | {pendingFollowupCount} pending follow-ups
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient Profile</th>
                  <th className="py-3 px-4">Appointment Type</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Status</th>
                 
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allItems.map(appt => {
                  const pt = findPatient(appt);
                  const doctor = findDoctor(appt);
                  const doctorName = doctor?.user?.fullName || doctor?.name || appt.doctor_name || 'Not Assigned';
                  const isFollowup = appt.isFollowup;
                  const displayDate = formatDate(appt.date || appt.appointmentDate);
                  
                  return (
                    <tr key={appt.id} className={`hover:bg-slate-50 transition-colors ${isFollowup ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <span className={`${isFollowup ? 'font-semibold text-amber-700' : 'text-slate-500'}`}>
                          {displayDate}
                        </span>
                        {isFollowup && (
                          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                            Pending Follow-up {appt.followupSource === 'detox' ? '(from detox)' : '(recommended)'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{pt.name || 'Unknown Patient'}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5 font-medium">
                          <div>{pt.phone?.replace(/\D/g, '').slice(-10) || 'No mobile'}</div>
                          <div>{pt.age ? `${pt.age} yrs` : 'Age N/A'} {pt.location ? `• ${pt.location}` : ''}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                          String(appt.appointmentType || '').toLowerCase().includes('detox') ? 'border-teal-200 bg-teal-50 text-teal-700' : 
                          String(appt.appointmentType || '').toLowerCase() === 'review' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                          'border-purple-200 bg-purple-50 text-purple-700'
                        }`}>
                          {getDisplayAppointmentType(appt)}
                          {isFollowup && appt.followupSource === 'detox' && (
                            <span className="ml-1 text-[9px] font-normal">(from detox)</span>
                          )}
                          {isFollowup && appt.followupSource === 'consultation' && (
                            <span className="ml-1 text-[9px] font-normal">(recommended)</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 block">
                          {doctorName || appt.doctor_name || 'Not Assigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={appt.notes}>
                        {appt.notes || (isFollowup ? 'Follow-up recommended' : '-')}
                      </td>
                      <td className="py-3 px-4">
                        {isFollowup ? (
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-amber-100 text-amber-700 border-amber-200">
                            Pending
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(appt.status)}`}>
                            {appt.status}
                          </span>
                        )}
                      </td>
                     
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loadingAppointments ? (
              <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading schedule...
              </div>
            ) : allItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No appointments or pending follow-ups found</div>
            ) : (
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5 px-4 pb-4">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{totalBooked === 0 ? 0 : scheduleStartIndex + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(scheduleStartIndex + serverPageSize, totalBooked)}</span> of <span className="font-semibold text-slate-800">{totalBooked}</span> appointments
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(serverPage - 1)}
                    disabled={serverPage === 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center">
                    {Array.from({ length: Math.min(5, totalSchedulePages) }, (_, i) => {
                      let pageNum;
                      if (totalSchedulePages <= 5) {
                        pageNum = i + 1;
                      } else if (serverPage <= 3) {
                        pageNum = i + 1;
                      } else if (serverPage >= totalSchedulePages - 2) {
                        pageNum = totalSchedulePages - 4 + i;
                      } else {
                        pageNum = serverPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-semibold transition ${serverPage === pageNum ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => goToPage(serverPage + 1)}
                    disabled={serverPage === totalSchedulePages}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}