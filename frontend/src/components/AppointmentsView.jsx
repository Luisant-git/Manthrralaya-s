import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Plus, CalendarPlus, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AppointmentsView({ 
  appointments, 
  patients, 
  doctors, 
  onAddAppointment, 
  onCheckIn, 
  onCancelAppointment,
  consultations = [],
  detoxSessions = []
}) {
  const [isBooking, setIsBooking] = useState(false);
  const [showFollowups, setShowFollowups] = useState(true);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointmentType: 'Initial consultation',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    notes: ''
  });

  // Helper function to get next follow-up from consultations or detox sessions
  const getNextFollowup = (patientId) => {
    // First check consultations
    const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(patientId));
    const latestCons = [...ptCons].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (latestCons && (latestCons.followup_date || latestCons.followupDate)) {
      const followupDate = latestCons.followup_date || latestCons.followupDate;
      const isDetoxRecommended = latestCons.detox_recommended || latestCons.detoxRecommended;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const followupDateObj = new Date(followupDate);
      
      if (!isNaN(followupDateObj.getTime()) && followupDateObj >= today) {
        return {
          scheduled_date: followupDate,
          doctor_name: latestCons.detox_doctor_name || latestCons.detoxDoctorName || latestCons.doctor_name,
          doctor_id: latestCons.detox_doctor_id || latestCons.detoxDoctorId || latestCons.doctor_id,
          appointment_type: isDetoxRecommended ? 'Detox' : 'Review',
          source: 'consultation',
          notes: latestCons.followup_remarks || latestCons.followupRemarks || 'Follow-up from consultation',
          isPending: true
        };
      }
    }
    
    // Check detox sessions for follow-up dates
    const ptDetox = detoxSessions.filter(d => String(d.patientId || d.patient_id) === String(patientId));
    const latestDetox = [...ptDetox].sort((a, b) => {
      const dateA = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
      const dateB = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
      return dateB - dateA;
    })[0];
    
    // CRITICAL: Use followupDate (camelCase) - this matches your data structure
    const detoxFollowupDate = latestDetox?.followupDate || latestDetox?.followup_date;
    
    if (latestDetox && detoxFollowupDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const followupDateObj = new Date(detoxFollowupDate);
      
      if (!isNaN(followupDateObj.getTime()) && followupDateObj >= today) {
        // Format the date to YYYY-MM-DD for display
        const formattedDate = followupDateObj.toISOString().split('T')[0];
        
        return {
          scheduled_date: formattedDate,
          doctor_name: latestDetox.doctor?.user?.fullName || latestDetox.doctorName,
          doctor_id: latestDetox.doctorId || latestDetox.doctor_id,
          appointment_type: 'Review',
          source: 'detox',
          notes: latestDetox.followupRemarks || latestDetox.followup_remarks || 'Follow-up after detox session',
          isPending: true
        };
      }
    }
    
    return null;
  };

  // Combine booked appointments with pending follow-ups
  const getAllAppointmentsWithFollowups = () => {
    const bookedAppointments = appointments.map(appt => ({
      ...appt,
      isFollowup: false,
      displayType: 'booked'
    }));
    
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
      return new Date(dateA) - new Date(dateB);
    });
  };

  const allItems = getAllAppointmentsWithFollowups();

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
    setIsBooking(false);
    setFormData({ 
      patient_id: '', 
      doctor_id: '', 
      appointmentType: 'Initial consultation', 
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
          <button
            onClick={() => setIsBooking(!isBooking)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            {isBooking ? <CalendarIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isBooking ? 'View Schedule' : 'Book Appointment'}
          </button>
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
                  onChange={e => setFormData({...formData, patient_id: e.target.value})}
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
                    if (docInfo?.role === 'THERAPIST') {
                      setFormData({...formData, doctor_id: selectedDocId, appointmentType: 'Detox'});
                    } else {
                      setFormData({...formData, doctor_id: selectedDocId});
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
                      {d.status !== 'Available' ? ' - On Leave' : ''}
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
                  onChange={e => setFormData({ ...formData, appointmentType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {doctors.find(d => String(d.id) === String(formData.doctor_id))?.role === 'THERAPIST' ? (
                    <option value="Detox">Detox</option>
                  ) : (
                    <>
                      <option value="Initial consultation">Initial Consultation</option>
                      <option value="Detox">Detox</option>
                      <option value="Review">Follow-up</option>
                    </>
                  )}
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
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800">Master Schedule Log</h3>
            </div>
            <div className="text-xs text-slate-500">
              {allItems.filter(i => !i.isFollowup).length} booked | {allItems.filter(i => i.isFollowup).length} pending follow-ups
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
                  <th className="py-3 px-4 text-right">Actions</th>
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
                          appt.appointmentType === 'Detox' ? 'border-teal-200 bg-teal-50 text-teal-700' : 
                          appt.appointmentType === 'Review' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                          'border-purple-200 bg-purple-50 text-purple-700'
                        }`}>
                          {appt.appointmentType || 'General'}
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
                      <td className="py-3 px-4 text-right space-x-2">
                        {!isFollowup && appt.status === 'Scheduled' && (
                          <>
                            <button onClick={() => onCheckIn(appt.id, false, false)} className="text-emerald-600 hover:bg-emerald-50 font-bold px-2.5 py-1.5 rounded-lg border border-transparent hover:border-emerald-200 transition-colors">
                              Check-in
                            </button>
                            <button onClick={() => onCancelAppointment(appt.id)} className="text-rose-600 hover:bg-rose-50 font-bold px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors">
                              Cancel
                            </button>
                          </>
                        )}
                        {!isFollowup && appt.status === 'Checked-in' && (
                          <span className="text-slate-400 font-medium italic">Awaiting Consult</span>
                        )}
                        {isFollowup && (
                          <button 
                            onClick={() => {
                              setFormData({
                                patient_id: pt.id,
                                doctor_id: appt.doctor_id,
                                appointmentType: appt.appointmentType,
                                date: appt.date,
                                notes: appt.notes,
                                time: '10:00 AM'
                              });
                              setIsBooking(true);
                            }}
                            className="text-emerald-600 hover:bg-emerald-50 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                          >
                            Book Now
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {allItems.length === 0 && (
              <div className="py-12 text-center text-slate-500">No appointments or pending follow-ups found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}