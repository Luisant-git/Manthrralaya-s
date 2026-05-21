import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PatientsView from './components/PatientsView';
import PhoneCallsView from './components/PhoneCallsView';
import AppointmentsView from './components/AppointmentsView';
import ConsultationsView from './components/ConsultationsView';
import DetoxStayView from './components/DetoxStayView';
import WhatsAppHubView from './components/WhatsAppHubView';
import ReportsView from './components/ReportsView';
import ReviewsView from './components/ReviewsView';
import PatientTimeline from './components/PatientTimeline';
import DocumentPreview from './components/DocumentPreview';
import LoginView from './components/LoginView';

import {
  initialPatients,
  initialDoctors,
  initialPhoneCalls,
  initialAppointments,
  initialConsultations,
  initialDetoxSessions,
  initialStayManagement,
  initialPrescriptions,
  initialDietCharts,
  initialFollowups,
  initialWhatsappLogs,
  initialReviews
} from './mockData';

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeRole, setActiveRole] = useState(''); // 'receptionist', 'doctor', 'admin'
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (role) => {
    setActiveRole(role);
    setIsAuthenticated(true);
    // Route to appropriate starting tab
    if (role === 'doctor') setActiveTab('consultations');
    else setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveRole('');
    setActiveTab('dashboard');
  };

  // Database States
  const [patients, setPatients] = useState(initialPatients);
  const [doctors, setDoctors] = useState(initialDoctors);
  const [phoneCalls, setPhoneCalls] = useState(initialPhoneCalls);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [consultations, setConsultations] = useState(initialConsultations);
  const [detoxSessions, setDetoxSessions] = useState(initialDetoxSessions);
  const [stayManagement, setStayManagement] = useState(initialStayManagement);
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [dietCharts, setDietCharts] = useState(initialDietCharts);
  const [followups, setFollowups] = useState(initialFollowups);
  const [whatsappLogs, setWhatsappLogs] = useState(initialWhatsappLogs);
  const [reviews, setReviews] = useState(initialReviews);

  const [searchQuery, setSearchQuery] = useState('');
  const [timelinePatient, setTimelinePatient] = useState(null);

  const handleAddPatient = (newPt) => setPatients(prev => [...prev, newPt]);
  const handleAddCall = (newCall) => setPhoneCalls(prev => [...prev, newCall]);

  const handleBookFromCall = (callObj) => {
    let patientObj = patients.find(p => p.phone === callObj.phone);
    if (!patientObj) {
      patientObj = {
        id: `P-${100 + patients.length + 1}`,
        name: callObj.patient_name,
        phone: callObj.phone,
        email: 'n/a', age: 35, gender: 'Other', blood_group: 'O+',
        medical_conditions: 'Registered via phone inquiry: ' + callObj.notes,
        address: 'n/a', registered_at: new Date().toISOString().split('T')[0]
      };
      setPatients(prev => [...prev, patientObj]);
    }
    const newAppt = {
      id: `A-${200 + appointments.length + 1}`,
      patient_id: patientObj.id, date: new Date().toISOString().split('T')[0],
      time: '03:30 PM', source: 'Phone Call', status: 'Scheduled', notes: callObj.notes
    };
    setAppointments(prev => [...prev, newAppt]);
    setPhoneCalls(prev => prev.map(c => (c.id === callObj.id ? { ...c, status: 'Booked' } : c)));

    const waLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: patientObj.id, patient_name: patientObj.name, phone: patientObj.phone,
      type: 'Booking Confirmation', message_text: `Dear ${patientObj.name}, your appointment is confirmed for Today at 03:30 PM. Reply HELP for support. - Detox360 Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Delivered', template_name: 'appointment_confirm'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
    alert(`Appointment scheduled for ${patientObj.name}!\n\nAutomated WhatsApp confirmation dispatched.`);
  };

  const handleAddAppointment = (newAppt, patientObj, doctorObj) => {
    setAppointments(prev => [...prev, newAppt]);
    const docName = doctorObj ? doctorObj.name : 'our specialist';
    const waLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: patientObj.id, patient_name: patientObj.name, phone: patientObj.phone,
      type: 'Booking Confirmation', message_text: `Dear ${patientObj.name}, your appointment with ${docName} is confirmed for ${newAppt.date} at ${newAppt.time}. - Detox360 Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Delivered', template_name: 'appointment_confirm'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
  };

  const handleCheckIn = (apptId) => {
    setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Checked-in' } : a)));
    const appt = appointments.find(a => a.id === apptId);
    const pt = patients.find(p => p.id === appt.patient_id) || {};
    const waLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: pt.id, patient_name: pt.name, phone: pt.phone,
      type: 'Clinic Alert', message_text: `Hello ${pt.name}, you have checked in at the clinic lobby. Please take a seat, Dr. Evelyn Carter will see you shortly. - Detox360 Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Read', template_name: 'checkin_alert'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
  };

  const handleCancelAppointment = (apptId) => setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Cancelled' } : a)));

  const handleAddConsultation = (newCons, apptId) => {
    setConsultations(prev => [...prev, newCons]);
    setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Completed' } : a)));

    if (newCons.detox_recommended) {
      const ptObj = patients.find(p => p.id === newCons.patient_id) || {};
      const newDtx = {
        id: `DTX-${400 + detoxSessions.length + 1}`, patient_id: newCons.patient_id, consultation_id: newCons.id,
        scheduled_date: '2026-05-21', type: newCons.detox_type, status: 'Scheduled', cost: 7500, technician: 'Nolan Ross', notes: 'Recommended during consultation ' + newCons.id
      };
      setDetoxSessions(prev => [...prev, newDtx]);
      const waLog = {
        id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: ptObj.id, patient_name: ptObj.name, phone: ptObj.phone,
        type: 'Session Reminder', message_text: `Hello ${ptObj.name}, your recommended ${newCons.detox_type} is scheduled for Tomorrow. Please begin fasting. - Detox360 Wellness`,
        sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Sent', template_name: 'detox_prep_reminder'
      };
      setWhatsappLogs(prev => [...prev, waLog]);
    }
  };

  const handleAddPrescription = (newPresc) => {
    setPrescriptions(prev => [...prev, newPresc]);
    const ptObj = patients.find(p => p.id === newPresc.patient_id) || {};
    const waLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: ptObj.id, patient_name: ptObj.name, phone: ptObj.phone,
      type: 'PDF Delivery', message_text: `Dear ${ptObj.name}, here is your customized prescription PDF: https://detox360.co/shared/docs/presc_${newPresc.id}. Please download. - Detox360 Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Delivered', template_name: 'document_delivery_pdf'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
  };

  const handleAddDietChart = (newDiet) => setDietCharts(prev => [...prev, newDiet]);

  const handleScheduleDetox = (newSession, patientObj) => {
    setDetoxSessions(prev => [...prev, newSession]);
    const waLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: patientObj.id, patient_name: patientObj.name, phone: patientObj.phone,
      type: 'Session Reminder', message_text: `Hello ${patientObj.name}, your ${newSession.type} session is scheduled for ${newSession.scheduled_date}. Technician: ${newSession.technician}. - Detox360 Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Sent', template_name: 'detox_prep_reminder'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
  };

  const handleUpdateDetoxStatus = (sessionId, newStatus) => setDetoxSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, status: newStatus } : s)));

  const handleAdmitPatient = (newStay, roomId) => {
    setStayManagement(prev => [...prev, newStay]);
    alert(`Patient admitted to room stay successfully! Checklist initialized.`);
  };

  const handleUpdateNursingChecklist = (stayId, checklistKey) => {
    setStayManagement(prev => prev.map(s => {
      if (s.id === stayId) {
        const checklist = { ...s.nursing_checklist };
        checklist[checklistKey] = !checklist[checklistKey];
        return { ...s, nursing_checklist: checklist };
      }
      return s;
    }));
  };

  const handleDischargePatient = (stayId, roomId) => {
    const stayObj = stayManagement.find(s => s.id === stayId);
    const ptObj = patients.find(p => p.id === stayObj.patient_id) || {};
    setStayManagement(prev => prev.map(s => (s.id === stayId ? { ...s, status: 'Discharged', check_out_time: new Date().toISOString().replace('T', ' ').substring(0, 16) } : s)));

    const newFollowup = {
      id: `FUP-${800 + followups.length + 1}`, patient_id: ptObj.id, scheduled_date: '2026-05-27',
      notes: `Review follow-up on recovery post discharge from room ${stayObj.room_name}. Check diet adherence.`, status: 'Pending', created_at: new Date().toISOString().split('T')[0]
    };
    setFollowups(prev => [...prev, newFollowup]);

    const waLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: ptObj.id, patient_name: ptObj.name, phone: ptObj.phone,
      type: 'Review Request', message_text: `Hello ${ptObj.name}, we hope you had a rejuvenating stay with us. Please share your rating feedback: https://detox360.co/leave-review - Detox360 Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Delivered', template_name: 'feedback_review'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
    alert(`Patient discharged!\n1. Room is now available.\n2. Next Review Followup created for May 27.\n3. WhatsApp rating review invite sent to patient.`);
  };

  const handleSendCustomMessage = (newLog) => setWhatsappLogs(prev => [...prev, newLog]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const pt = patients.find(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase() === searchQuery.toLowerCase() || p.phone.includes(searchQuery));
    if (pt) {
      setTimelinePatient(pt);
      setSearchQuery('');
    } else {
      alert(`No patient found matching search: "${searchQuery}"`);
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView patients={patients} appointments={appointments} detoxSessions={detoxSessions} followups={followups} stayManagement={stayManagement} onCheckIn={handleCheckIn} onNavigateToTab={setActiveTab} />;
      case 'patients':
        return <PatientsView patients={patients} onAddPatient={handleAddPatient} onSelectPatient={(pt) => setTimelinePatient(pt)} />;
      case 'phone-calls':
        return <PhoneCallsView phoneCalls={phoneCalls} onAddCall={handleAddCall} onBookFromCall={handleBookFromCall} />;
      case 'appointments':
        return <AppointmentsView appointments={appointments} patients={patients} doctors={doctors} onAddAppointment={handleAddAppointment} onCheckIn={handleCheckIn} onCancelAppointment={handleCancelAppointment} />;
      case 'consultations':
        return <ConsultationsView appointments={appointments} patients={patients} doctors={doctors} onAddConsultation={handleAddConsultation} onAddPrescription={handleAddPrescription} onAddDietChart={handleAddDietChart} activeRole={activeRole} />;
      case 'detox':
      case 'stay':
        return <DetoxStayView detoxSessions={detoxSessions} stayManagement={stayManagement} patients={patients} onScheduleDetox={handleScheduleDetox} onUpdateDetoxStatus={handleUpdateDetoxStatus} onAdmitPatient={handleAdmitPatient} onUpdateNursingChecklist={handleUpdateNursingChecklist} onDischargePatient={handleDischargePatient} />;
      case 'whatsapp-hub':
        return <WhatsAppHubView whatsappLogs={whatsappLogs} patients={patients} onSendCustomMessage={handleSendCustomMessage} />;
      case 'reports':
        return <ReportsView patients={patients} appointments={appointments} consultations={consultations} detoxSessions={detoxSessions} stayManagement={stayManagement} prescriptions={prescriptions} dietCharts={dietCharts} followups={followups} />;
      case 'reviews':
        return <ReviewsView reviews={reviews} />;
      case 'documents':
        return <DocumentPreview prescriptions={prescriptions} dietCharts={dietCharts} patients={patients} onClose={() => setActiveTab('dashboard')} />;
      default:
        return <div className="text-center py-12 text-slate-500">Access Denied or Feature in Development.</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-inter">
      <Header
        activeRole={activeRole}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeRole={activeRole}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {timelinePatient && (
        <PatientTimeline
          patient={timelinePatient}
          phoneCalls={phoneCalls}
          appointments={appointments}
          consultations={consultations}
          detoxSessions={detoxSessions}
          stayManagement={stayManagement}
          prescriptions={prescriptions}
          dietCharts={dietCharts}
          followups={followups}
          reviews={reviews}
          onClose={() => setTimelinePatient(null)}
        />
      )}
    </div>
  );
}
