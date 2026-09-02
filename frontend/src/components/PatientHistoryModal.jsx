import React, { useState } from 'react';
import { X, User, Phone, Mail, Calendar as CalendarIcon, Stethoscope, Droplets, FileText, Download, MessageSquare, Activity, ClipboardList, RefreshCw, Bed, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { generateConsultationPDF, generateDetoxPDF, buildConsultationPdfBlob } from '../utils/pdfGenerator';
import { uploadConsultationPdf } from '../api/consultationApi';
import { toast } from 'react-toastify';

export default function PatientHistoryModal({ isOpen, onClose, patient, consultations, detoxSessions, doctors = [] }) {
  const [historyPage, setHistoryPage] = useState(1);
  const [historySubTab, setHistorySubTab] = useState('consultations');

  const historyItemsPerPage = 1;

  if (!isOpen || !patient) return null;

  const patientConsultations = consultations
    .filter(c => String(c.patient_id || c.patientId) === String(patient.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const patientDetoxSessions = detoxSessions
    .filter(d => String(d.patientId || d.patient_id) === String(patient.id))
    .sort((a, b) => new Date(b.sessionDate || b.scheduled_date) - new Date(a.sessionDate || a.scheduled_date));

  const totalHistoryPages = historySubTab === 'consultations'
    ? Math.max(1, Math.ceil(patientConsultations.length / historyItemsPerPage))
    : Math.max(1, Math.ceil(patientDetoxSessions.length / historyItemsPerPage));

  const historyStartIndex = (historyPage - 1) * historyItemsPerPage;
  const currentConsultation = patientConsultations[historyStartIndex];
  const currentDetoxSession = patientDetoxSessions[historyStartIndex];

  const goToHistoryPage = (page) => {
    if (page >= 1 && page <= totalHistoryPages) {
      setHistoryPage(page);
    }
  };



  return (
    <>
      <style>{`
        .consultation-notes-content { font-size: 0.9375rem; line-height: 1.6; }
        .consultation-notes-content ul, .consultation-notes-content ol { margin-top: 0.75rem; margin-bottom: 0.75rem; padding-left: 1.75rem; }
        .consultation-notes-content ul { list-style-type: disc; }
        .consultation-notes-content ol { list-style-type: decimal; }
        .consultation-notes-content li { margin-bottom: 0.375rem; line-height: 1.5; }
        .consultation-notes-content p { margin-bottom: 0.875rem; line-height: 1.5; }
        .consultation-notes-content h1 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.75rem; }
        .consultation-notes-content h2 { font-size: 1.125rem; font-weight: 700; margin-top: 0.875rem; margin-bottom: 0.625rem; }
        .consultation-notes-content strong { font-weight: 700; color: #1e293b; }
        .consultation-notes-content em { font-style: italic; }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-animate { animation: modalSlideIn 0.2s ease-out; }
        .modal-content-scroll::-webkit-scrollbar { width: 6px; }
        .modal-content-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .modal-content-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
        .modal-content-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      `}</style>
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full modal-animate overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="sticky top-0 z-10">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{patient.name}</h2>
                    <p className="text-xs text-emerald-100">P-{patient.id}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition text-white">
                  <X className="w-5 h-5" />
                </button>
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
              <div className="flex gap-4">
                <button onClick={() => { setHistorySubTab('consultations'); setHistoryPage(1); }} className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${historySubTab === 'consultations' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <span className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Consultations ({patientConsultations.length})</span>
                </button>
                <button onClick={() => { setHistorySubTab('detox'); setHistoryPage(1); }} className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${historySubTab === 'detox' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <span className="flex items-center gap-2"><Droplets className="w-4 h-4" /> Detox Sessions ({patientDetoxSessions.length})</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="modal-content-scroll overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    {historySubTab === 'consultations' ? (
                      <><FileText className="w-5 h-5 text-emerald-600" /><h3 className="text-base font-bold text-slate-800">Consultation Notes</h3></>
                    ) : (
                      <><Droplets className="w-5 h-5 text-emerald-600" /><h3 className="text-base font-bold text-slate-800">Detox Session Details</h3></>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {historySubTab === 'consultations' && currentConsultation && (
                      <>

                        <button onClick={() => generateConsultationPDF(currentConsultation, patient)} className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                          <Download className="w-3.5 h-3.5" /> Full PDF
                        </button>
                      </>
                    )}
                    {historySubTab === 'detox' && currentDetoxSession && (
                      <button onClick={() => generateDetoxPDF(currentDetoxSession, patient)} className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
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
                      <div className="space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-emerald-600" /></div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{currentConsultation.doctor_name || 'Assigned Doctor'}</div>
                              <div className="text-xs text-emerald-600 font-medium">Clinical Consultant</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">{currentConsultation.date}</div>
                            <div className="text-[10px] text-slate-400 mt-1">Visit Date</div>
                          </div>
                        </div>

                        {(currentConsultation.consultation_notes || currentConsultation.consultationNotes) && (currentConsultation.consultation_notes || currentConsultation.consultationNotes) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Consultation Notes</div>
                              <button onClick={() => generateConsultationPDF(currentConsultation, 'Consultation Notes')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>
                            </div>
                            <div className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: currentConsultation.consultation_notes || currentConsultation.consultationNotes }} />
                          </div>
                        )}

                        {(currentConsultation.medical_history || currentConsultation.medicalHistoryNotes) && (currentConsultation.medical_history || currentConsultation.medicalHistoryNotes) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5" /> Medical History</div>
                              <button onClick={() => generateConsultationPDF(currentConsultation, 'Medical History')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>
                            </div>
                            <div className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: currentConsultation.medical_history || currentConsultation.medicalHistoryNotes }} />
                          </div>
                        )}

                        {(currentConsultation.diet_plan_note || currentConsultation.dietPlanNotes) && (currentConsultation.diet_plan_note || currentConsultation.dietPlanNotes) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5" /> Diet Plan</div>
                              <button onClick={() => generateConsultationPDF(currentConsultation, 'Diet Plan')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>
                            </div>
                            <div className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: currentConsultation.diet_plan_note || currentConsultation.dietPlanNotes }} />
                          </div>
                        )}

                        {(currentConsultation.detox_procedure || currentConsultation.detoxProcedureNotes) && (currentConsultation.detox_procedure || currentConsultation.detoxProcedureNotes) !== '<br>' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Detox Procedure</div>
                              <button onClick={() => generateConsultationPDF(currentConsultation, 'Detox Procedure')} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>
                            </div>
                            <div className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: currentConsultation.detox_procedure || currentConsultation.detoxProcedureNotes }} />
                          </div>
                        )}

                        {(currentConsultation.home_care || currentConsultation.homecareGuideliness) && (
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Bed className="w-3.5 h-3.5" /> Home Care Guidelines</div>
                            <div className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">{currentConsultation.home_care || currentConsultation.homecareGuideliness}</div>
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
                                    doctors.find(d => Number(d.id) === Number(currentConsultation.detox_doctor_id ?? currentConsultation.detoxDoctorId))?.name ||
                                    'Assigned Provider'}
                                </div>
                              )}
                              {(currentConsultation.followup_date || currentConsultation.followupDate) && (
                                <div><span className="font-semibold text-slate-800">Follow-up Date:</span> {String(currentConsultation.followup_date || currentConsultation.followupDate).substring(0, 10)}</div>
                              )}
                              {(currentConsultation.followup_remarks || currentConsultation.followupRemarks) && (
                                <div><span className="font-semibold text-slate-800">Remarks:</span> {currentConsultation.followup_remarks || currentConsultation.followupRemarks}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-800">No Consultations Found</h3>
                        <p className="text-slate-500 mt-1">This patient has no recorded consultations yet.</p>
                      </div>
                    )}
                  </>
                )}

                {/* Detox History */}
                {historySubTab === 'detox' && (
                  <>
                    {currentDetoxSession ? (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Droplets className="w-5 h-5 text-emerald-600" /></div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{currentDetoxSession.therapistName || 'Assigned Therapist'}</div>
                              <div className="text-xs text-emerald-600 font-medium">Therapist</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">{currentDetoxSession.sessionDate || currentDetoxSession.scheduled_date}</div>
                            <div className="text-[10px] text-slate-400 mt-1">Session Date</div>
                          </div>
                        </div>

                        {currentDetoxSession.treatmentDetails && (
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Treatment Details</div>
                            <div className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">{currentDetoxSession.treatmentDetails}</div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {currentDetoxSession.patientFeedback && (
                            <div>
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Feedback</div>
                              <div className="text-slate-700 bg-amber-50 p-4 rounded-xl border border-amber-100/50 h-full">{currentDetoxSession.patientFeedback}</div>
                            </div>
                          )}
                          {currentDetoxSession.therapistObservations && (
                            <div>
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Therapist Observations</div>
                              <div className="text-slate-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100/50 h-full">{currentDetoxSession.therapistObservations}</div>
                            </div>
                          )}
                        </div>

                        {currentDetoxSession.nextSessionPlan && (
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Next Session Plan</div>
                            <div className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{currentDetoxSession.nextSessionPlan}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-800">No Detox Sessions Found</h3>
                        <p className="text-slate-500 mt-1">This patient has no recorded detox sessions yet.</p>
                      </div>
                    )}
                  </>
                )}

                {/* Pagination Controls */}
                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-500">Showing record <span className="font-semibold text-slate-800">{historyPage}</span> of <span className="font-semibold text-slate-800">{totalHistoryPages}</span></p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => goToHistoryPage(historyPage - 1)} disabled={historyPage === 1} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={() => goToHistoryPage(historyPage + 1)} disabled={historyPage === totalHistoryPages} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}
