import React, { useState } from 'react';
import { Star, Download, Calendar, ShieldCheck, User, ClipboardList, PenTool } from 'lucide-react';

export default function PatientPortalView({
  patients,
  appointments,
  stayManagement,
  prescriptions,
  dietCharts,
  reviews,
  onAddReview,
  onDownloadDocTrigger
}) {
  const [activePatientId, setActivePatientId] = useState(patients[1]?.id || patients[0]?.id || ''); 
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const activePatient = patients.find(p => p.id === activePatientId) || patients[0] || {};
  const ptAppointments = appointments.filter(a => a.patient_id === activePatient.id);
  const ptStays = stayManagement.filter(s => s.patient_id === activePatient.id && s.status === 'Admitted');
  const ptPrescription = prescriptions.find(pr => pr.patient_id === activePatient.id);
  const ptDiet = dietCharts.find(di => di.patient_id === activePatient.id);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!comment) return alert('Please enter comments.');

    const newReview = {
      id: `REV-${10 + reviews.length + 1}`,
      patient_name: activePatient.name,
      patient_id: activePatient.id,
      rating,
      comments: comment,
      date: new Date().toISOString().split('T')[0]
    };

    onAddReview(newReview);
    setComment('');
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Patient Self Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Access your medical documents, track your one-day stay checklist, and view scheduled cleanses.
          </p>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Portal Account File</label>
          <select
            value={activePatientId}
            onChange={(e) => setActivePatientId(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 font-medium focus:outline-none focus:border-emerald-500"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} (File #{p.id})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile, Appointments, and Stay logs */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left space-y-4">
            <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Patient File</span>
                <span className="text-lg font-bold text-slate-800 block leading-tight">{activePatient.name}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Phone:</span> <strong className="text-slate-800">{activePatient.phone}</strong></div>
              <div className="flex justify-between"><span>Email:</span> <strong className="text-slate-800">{activePatient.email}</strong></div>
              <div className="flex justify-between"><span>Conditions:</span> <strong className="text-slate-600 max-w-[150px] text-right truncate">{activePatient.medical_conditions}</strong></div>
              <div className="flex justify-between"><span>Blood Group:</span> <strong className="text-red-500">{activePatient.blood_group}</strong></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-emerald-600" /> My Appointment Logs
            </h3>
            <div className="space-y-3">
              {ptAppointments.map(appt => (
                <div key={appt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-slate-800 block">{appt.date} • {appt.time}</span>
                    <span className="text-slate-500 text-xs">Method: {appt.source}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                    appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              ))}
              {ptAppointments.length === 0 && (
                <p className="text-slate-400 italic text-sm text-center py-4">No appointments booked.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <ClipboardList className="w-5 h-5 text-purple-600" /> Room Stay Checklist
            </h3>
            {ptStays.length > 0 ? (
              ptStays.map(stay => {
                const checklist = stay.nursing_checklist || {};
                return (
                  <div key={stay.id} className="space-y-4 text-sm">
                    <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-100">
                      <span className="font-bold text-purple-900">{stay.room_name}</span>
                      <span className="text-xs bg-purple-200 text-purple-800 font-bold px-2 py-1 rounded">Admitted</span>
                    </div>

                    <div className="space-y-2.5 pl-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">1. Vitals Checked (Morning)</span>
                        <span className={checklist.vitals_checked_morning ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                          {checklist.vitals_checked_morning ? "✓ Done" : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">2. Detox Liquid Juices Served</span>
                        <span className={checklist.detox_liquids_served ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                          {checklist.detox_liquids_served ? "✓ Done" : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">3. Post-Procedure Bath</span>
                        <span className={checklist.post_procedure_bath ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                          {checklist.post_procedure_bath ? "✓ Done" : "Pending"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">4. Resting Comfortably</span>
                        <span className={checklist.resting_comfortably ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                          {checklist.resting_comfortably ? "✓ Done" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 italic text-sm text-center py-4">Not currently admitted for room stay.</p>
            )}
          </div>
        </div>

        {/* Right Side: Document Engine view (Diet/Prescription) & Submit rating review */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" /> Medical Documents Folder
              </h3>
              <button
                onClick={() => onDownloadDocTrigger('documents')}
                className="text-sm text-emerald-600 hover:underline font-semibold"
              >
                Open Doc Engine
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wide">Prescription</span>
                  <span className="text-base font-bold text-slate-800 block mt-3">Rx Therapy Form</span>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    {ptPrescription ? `Contains ${ptPrescription.medicines?.length || 0} medicinal entries issued by Dr. Evelyn Carter.` : 'Awaiting clinical consult prescription.'}
                  </p>
                </div>
                {ptPrescription && (
                  <button
                    onClick={() => onDownloadDocTrigger('documents')}
                    className="w-full bg-white border border-slate-200 hover:border-emerald-500 text-emerald-700 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                )}
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">Dietary Guide</span>
                  <span className="text-base font-bold text-slate-800 block mt-3">Alkaline Menu</span>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    {ptDiet ? 'Custom nutrition meals configured for daily gut cleansing.' : 'Awaiting diet chart issuance.'}
                  </p>
                </div>
                {ptDiet && (
                  <button
                    onClick={() => onDownloadDocTrigger('documents')}
                    className="w-full bg-white border border-slate-200 hover:border-emerald-500 text-emerald-700 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left space-y-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <PenTool className="w-6 h-6 text-amber-500" /> Share Detox Experience / Leave Feedback
            </h3>

            {feedbackSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-emerald-700 text-sm font-bold text-center">
                ✓ Feedback submitted successfully! Your comment has been synchronized into the dashboard reports.
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-600 font-bold uppercase">Rate Experience:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-7 h-7 ${star <= rating ? 'fill-current' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-600 font-bold uppercase mb-2">Feedback Comments</label>
                  <textarea
                    required
                    placeholder="e.g. The procedure was extremely professional. The room check-in process was very smooth..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-sm transition-colors"
                  >
                    Submit Clinical Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
