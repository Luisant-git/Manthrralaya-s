import React, { useState } from 'react';
import { Stethoscope, Activity, Bed, RefreshCw, ClipboardList, ChevronLeft, ChevronRight, Star, FileText, X, User, Phone, Mail, Calendar as CalendarIcon, Droplets, Download, MessageSquare, Share2, Edit3, Save } from 'lucide-react';
import { Sun, Moon, SunMoon } from 'lucide-react';
import { toast } from 'react-toastify';
import { generateConsultationPDF, generateDetoxPDF, buildConsultationPdfBlob } from '../utils/pdfGenerator';
import { uploadConsultationPdf, updateConsultation } from '../api/consultationApi';
import { createAppointment, updateAppointment } from '../api/appointmentApi';

export default function PatientHistoryModal({
  patient,
  consultations = [],
  detoxSessions = [],
  appointments = [],
  doctors = [],
  onClose
}) {
  const [historyPage, setHistoryPage] = useState(1);
  const [historySubTab, setHistorySubTab] = useState('consultations');
  const [isSendingWA, setIsSendingWA] = useState(false);
  const [showWhatsappConfirmModal, setShowWhatsappConfirmModal] = useState(false);
  const [whatsappConsultationToSend, setWhatsappConsultationToSend] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareDoctor, setSelectedShareDoctor] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const historyItemsPerPage = 1;

  if (!patient) return null;

  const availableDoctors = [...doctors];

  const patientId = String(patient.id ?? patient.patientId);

  const patientConsultations = consultations
    .filter(c => String(c.patient_id || c.patientId) === patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

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
    setShowShareModal(false);
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
      setShowShareModal(false);
      setSelectedShareDoctor('');
    } catch (error) {
      console.error('Error sharing record:', error);
      toast.error(error.message || 'Failed to share patient record');
    } finally {
      setIsSharing(false);
    }
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

      toast.success('Notes updated successfully');
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error(error.message || 'Failed to update notes');
    } finally {
      setIsSavingEdit(false);
    }
  };

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

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeModal}>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>

        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full modal-animate overflow-hidden"
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
            </div>

            {/* Scrollable Content */}
            <div className="modal-content-scroll overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
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
                      <div className="space-y-5">
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
                              <div
                                className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setEditContent(e.target.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: editContent }}
                              />
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
                              <div
                                className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setEditContent(e.target.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: editContent }}
                              />
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
                              <div
                                className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setEditContent(e.target.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: editContent }}
                              />
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
                              <div
                                className="w-full bg-white p-4 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] text-sm outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setEditContent(e.target.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: editContent }}
                              />
                            ) : (
                              <div
                                className="consultation-notes-content bg-slate-50 p-4 rounded-xl border border-slate-100"
                                dangerouslySetInnerHTML={{ __html: currentConsultation.detox_procedure || currentConsultation.detoxProcedureNotes }}
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
                              {(currentConsultation.followup_date || currentConsultation.followupDate) && (
                                <div><span className="font-semibold text-slate-800">Follow-up Date:</span> {formatDate(currentConsultation.followup_date || currentConsultation.followupDate)}</div>
                              )}
                              {(currentConsultation.followup_remarks || currentConsultation.followupRemarks) && (
                                <div><span className="font-semibold text-slate-800">Remarks:</span> {currentConsultation.followup_remarks || currentConsultation.followupRemarks}</div>
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
                      <div className="space-y-5">
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
            <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full modal-animate overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                <p className="text-slate-700 text-sm">Select a doctor to share this patient's history with.</p>
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
    </>
  );
}
