import React from 'react';
import { Phone, Calendar, Stethoscope, Activity, Bed, Home, RefreshCw, Star, X } from 'lucide-react';

export default function PatientTimeline({
  patient,
  phoneCalls,
  appointments,
  consultations,
  detoxSessions,
  stayManagement,
  prescriptions,
  dietCharts,
  followups,
  reviews,
  onClose
}) {
  if (!patient) return null;

  // Helper to clean HTML from notes for preview
  const cleanHtml = (text) => {
    if (!text) return '';
    return text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const timelineEvents = [];

  phoneCalls.filter(c => c.phone === patient.phone || c.phone === patient.whatsapp).forEach(c => {
    timelineEvents.push({
      date: c.date, 
      time: c.time, 
      type: 'phone_call', 
      title: 'Phone Intake Call',
      icon: Phone, 
      color: 'bg-emerald-500', 
      description: `Logged incoming call. Status: ${c.status}. Notes: ${c.notes}`
    });
  });

  appointments.filter(a => String(a.patient_id || a.patientId) === String(patient.id)).forEach(a => {
    const timeDisplay = a.time || (a.session === 'FN' ? 'Forenoon' : 'Afternoon');
    const sourceDisplay = a.source || 'Clinic Walk-in';
    
    timelineEvents.push({
      date: a.date, 
      time: timeDisplay, 
      type: 'appointment', 
      title: `Clinic Appointment Scheduled`,
      icon: Calendar, 
      color: 'bg-blue-500', 
      description: `Method: ${sourceDisplay}. Status: ${a.status}. Intake Notes: ${a.notes || 'No notes.'}`
    });
  });

  consultations.filter(c => String(c.patient_id || c.patientId) === String(patient.id)).forEach(c => {
    const isDetoxRec = c.detox_recommended || c.detoxRecommended;
    const fRemarks = c.followup_remarks || c.followupRemarks;
    const docName = c.detox_doctor_name || c.detoxDoctorName || 'Assigned Provider';

    const detoxDetail = isDetoxRec
      ? `Detox assignment: ${c.detox_type || 'Recommended'} with ${docName}. Follow-up Remarks: ${fRemarks || 'No additional remarks.'}`
      : 'No detox recommended';

    const cNotes = cleanHtml(c.consultation_notes || c.consultationNotes);
    const dNotes = cleanHtml(c.detox_procedure || c.detoxProcedureNotes);
    const combinedNotes = [cNotes, dNotes].filter(Boolean).join(' | ').substring(0, 200);

    timelineEvents.push({
      date: c.date || c.consultationDate?.split('T')[0] || 'Unknown Date', 
      time: 'Consult Time', 
      type: 'consultation', 
      title: 'Doctor Consultation',
      icon: Stethoscope, 
      color: 'bg-indigo-500',
      description: `Clinical Notes: ${combinedNotes}${combinedNotes.length >= 200 ? '...' : ''}. ${detoxDetail}`
    });
  });

  detoxSessions.filter(d => String(d.patient_id || d.patientId) === String(patient.id)).forEach(d => {
    const cleanNotes = cleanHtml(d.notes || d.detoxNotes);
    
    // Helper to extract numeric ID from strings like "A-201"
    const normalizeId = (id) => String(id || '').replace(/^\D+/g, '');

    // Robust lookup for linked consultation data
    const linkedCons = consultations.find(c => 
      (c.appointment_id && d.appointment_id && normalizeId(c.appointment_id) === normalizeId(d.appointment_id)) ||
      (c.appointmentId && d.appointmentId && normalizeId(c.appointmentId) === normalizeId(d.appointmentId)) ||
      String(c.id) === String(d.consultationId || d.consultation_id)
    );

    const fRemarks = d.followup_remarks || d.followupRemarks || linkedCons?.followup_remarks || linkedCons?.followupRemarks;
    const rawFDate = d.followupDate || d.followup_date || linkedCons?.followupDate || linkedCons?.followup_date;
    const fDate = rawFDate ? (typeof rawFDate === 'string' ? rawFDate.split('T')[0] : new Date(rawFDate).toISOString().split('T')[0]) : null;

    timelineEvents.push({
      date: d.scheduled_date || d.sessionDate?.split('T')[0] || 'Unknown Date', 
      time: 'Session Date', 
      type: 'detox', 
      title: `Detox Therapy Session`,
      icon: Activity, 
      color: 'bg-cyan-500',
      description: `Session: ${d.type || d.sessionType || 'Detox'}. Status: ${d.status || 'Active'}. Clinical Notes: ${cleanNotes}${fRemarks ? `. Follow-up Instructions: ${cleanHtml(fRemarks)}` : ''}${fDate ? `. Remainder Follow-up Date: ${fDate}` : ''}`
    });
  });

  stayManagement.filter(s => String(s.patient_id || s.patientId) === String(patient.id)).forEach(s => {
    // Add admission event
    timelineEvents.push({
      date: s.check_in_time ? s.check_in_time.split(' ')[0] : s.check_in_date || 'Unknown',
      time: s.check_in_time ? s.check_in_time.split(' ')[1] : 'Admission',
      type: 'stay_in', 
      title: `Admitted for One-Day Stay`,
      icon: Bed, 
      color: 'bg-purple-500', 
      description: `Assigned Room: ${s.room_name}. Status: ${s.status}. Directives: ${s.notes}`
    });
    
    // Add discharge event if discharged
    if (s.status === 'Discharged' && s.check_out_time) {
      timelineEvents.push({
        date: s.check_out_time.split(' ')[0],
        time: s.check_out_time.split(' ')[1],
        type: 'stay_out', 
        title: `Discharged from Stay Room`,
        icon: Home, 
        color: 'bg-slate-500', 
        description: `Discharged from Room ${s.room_name}. Program completed.`
      });
    }
  });

  followups.filter(f => String(f.patient_id || f.patientId) === String(patient.id)).forEach(f => {
    timelineEvents.push({
      date: f.scheduled_date, 
      time: 'Review Date', 
      type: 'followup', 
      title: `Next Review Reminder`,
      icon: RefreshCw, 
      color: 'bg-amber-500', 
      description: `Followup instructions: ${f.notes}. Status: ${f.status}`
    });
  });

  reviews.filter(r => String(r.patient_id || r.patientId) === String(patient.id)).forEach(r => {
    timelineEvents.push({
      date: r.date, 
      time: 'Review Rating', 
      type: 'review', 
      title: `Client Feedback & Review`,
      icon: Star, 
      color: 'bg-orange-500', 
      description: `Rating: ${r.rating} Stars. Comments: "${r.comments}"`
    });
  });

 // Sort events by date in DESCENDING order (newest/latest first)
const sortedEvents = timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-3xl">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Unified Lifecycle Profile</span>
            <h2 className="text-xl font-bold text-slate-800 mt-1">360° Timeline: {patient.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Phone: {patient.phone?.replace(/\D/g, '').slice(-10)} • ID: P-{patient.id}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 text-left bg-white">
          {sortedEvents.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 pl-8 ml-4 space-y-8">
              {sortedEvents.map((evt, idx) => {
                const Icon = evt.icon;
                return (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-12 top-0.5 w-8 h-8 rounded-full ${evt.color} border-4 border-white flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="space-y-1.5 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{evt.title}</span>
                        <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono font-bold uppercase">
                          {evt.date} {evt.time !== 'Consult Time' && evt.time !== 'Session Date' && evt.time !== 'Review Date' && evt.time !== 'Review Rating' && evt.time !== 'Admission' ? `• ${evt.time}` : ''}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{evt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              No historical lifecycle events recorded for this patient file yet.
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 text-right rounded-b-3xl">
          <button onClick={onClose} className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2 px-5 rounded-lg text-sm shadow-sm transition-colors">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}