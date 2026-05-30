import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Plus, CalendarPlus } from 'lucide-react';

export default function AppointmentsView({ appointments, patients, doctors, onAddAppointment, onCheckIn, onCancelAppointment }) {
  const [isBooking, setIsBooking] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointmentType: 'Initial consultation',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patient_id) return alert('Please select a patient.');
    if (!formData.doctor_id) return alert('Please select a doctor.');

    const patientObj = patients.find(p => p.id === parseInt(formData.patient_id));
    const doctorObj = doctors.find(d => d.id === parseInt(formData.doctor_id));
    
    const newAppt = {
      id: `A-${200 + appointments.length + 1}`,
      patient_id: parseInt(formData.patient_id),
      doctor_id: parseInt(formData.doctor_id),
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
        <button
          onClick={() => setIsBooking(!isBooking)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          {isBooking ? <CalendarIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isBooking ? 'View Schedule' : 'Book Appointment'}
        </button>
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
                  onChange={e => setFormData({...formData, doctor_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose available doctor --</option>
                  {doctors.map(d => (
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
                  <option value="Initial consultation">Initial Consultation</option>
                  <option value="Detox">Detox</option>
                  <option value="Review">Follow-up</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Time</label>
                <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
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
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Master Schedule Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Time & Date</th>
                  <th className="py-3 px-4">Patient Profile</th>
                  <th className="py-3 px-4">Appointment Type</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Intake Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(appt => {
                  const pt = patients.find(p => p.id === appt.patient_id) || {};
                  return (
                    <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{appt.time}</span>
                        <span className="text-slate-500">{appt.date}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{pt.name || 'Unknown'}</span>
                        <span className="text-slate-500">{pt.phone || 'No phone'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${appt.appointmentType === 'Detox' ? 'border-teal-200 bg-teal-50 text-teal-700' : appt.appointmentType === 'Review' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-purple-200 bg-purple-50 text-purple-700'}`}>
                          {appt.appointmentType || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 block">
                          {(() => {
                            const doctor = doctors.find(d => d.id === appt.doctor_id);
                            return doctor?.user?.fullName || doctor?.name || 'Not Assigned';
                          })()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                        {appt.notes || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(appt.status)}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {appt.status === 'Scheduled' && (
                          <>
                            <button onClick={() => onCheckIn(appt.id, false, false)} className="text-emerald-600 hover:bg-emerald-50 font-bold px-2.5 py-1.5 rounded-lg border border-transparent hover:border-emerald-200 transition-colors">
                              Check-in
                            </button>
                            <button onClick={() => onCancelAppointment(appt.id)} className="text-rose-600 hover:bg-rose-50 font-bold px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors">
                              Cancel
                            </button>
                          </>
                        )}
                        {appt.status === 'Checked-in' && (
                          <span className="text-slate-400 font-medium italic">Awaiting Consult</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}