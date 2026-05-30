import React, { useState, useEffect } from 'react';
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
import MyPatientRecords from './components/MyPatientRecords';
import PatientTimeline from './components/PatientTimeline';
import DocumentPreview from './components/DocumentPreview';
import LoginView from './components/LoginView';
import ReceptionistView from './components/ReceptionistView';
import DoctorMasterView from './components/DoctorMasterView';
import UserManagementView from './components/UserManagementView';
import { userApi } from './api/userApi';

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
  const [currentUser, setCurrentUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Database States
  const [patients, setPatients] = useState(initialPatients);
  const [doctors, setDoctors] = useState([]); // Start empty, will be populated by API
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

  // Fetch doctors from backend
  const fetchDoctorsFromBackend = async () => {
    try {
      console.log('Fetching doctors from backend...');
      const response = await userApi.getUsersByRole('DOCTOR');
      console.log('API Response:', response);
      
      if (response && response.data && response.data.length > 0) {
        const doctorsFromBackend = response.data.map(doc => ({
          id: doc.id,
          name: doc.user?.fullName || `Doctor ${doc.id}`,
          specialization: doc.specialization,
          status: doc.status,
          designation: doc.specialization,
          user: doc.user
        }));
        setDoctors(doctorsFromBackend);
        console.log('Doctors fetched successfully:', doctorsFromBackend);
      } else {
        console.warn('No doctors data from API, using mock data as fallback');
        setDoctors(initialDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Fallback to mock data if API fails
      setDoctors(initialDoctors);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        // Manually decode the JWT payload (the second segment of the token)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        // Check if the token has expired
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          throw new Error('Token expired');
        }

        setActiveRole(payload.role.toLowerCase());
        setCurrentUser(payload.name || payload.email);
        setIsAuthenticated(true);

        // Ensure the user lands on the correct tab for their role after a refresh
        if (payload.role.toLowerCase() === 'doctor') setActiveTab('consultations');
        else setActiveTab('dashboard');
      } catch (e) {
        console.error('Session restoration failed:', e.message);
        localStorage.removeItem('access_token');
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch doctors when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDoctorsFromBackend();
    }
  }, [isAuthenticated]);

  const handleLogin = ({ role, username }) => {
    setActiveRole(role);
    setCurrentUser(username);
    setIsAuthenticated(true);
    // Route to appropriate starting tab
    if (role === 'doctor') setActiveTab('consultations');
    else if (role === 'receptionist') setActiveTab('dashboard');
    else setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setActiveRole('');
    setCurrentUser('');
    setActiveTab('dashboard');
  };

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
      type: 'Booking Confirmation', message_text: `Dear ${patientObj.name}, your appointment is confirmed for Today at 03:30 PM. Reply HELP for support. - Manthrralaya's Wellness`,
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
      type: 'Booking Confirmation', message_text: `Dear ${patientObj.name}, your appointment with ${docName} is confirmed for ${newAppt.date} at ${newAppt.time}. - Manthrralaya's Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Delivered', template_name: 'appointment_confirm'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
  };

  const isDetoxAppointment = (appt) => {
    return String(appt?.appointmentType || '').toLowerCase().includes('detox');
  };

  const handleCheckIn = (apptId, navigate = false, doctorInitiated = false) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    if (doctorInitiated) {
      setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Checked-in' } : a)));
    } else {
      setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Arrived' } : a)));
    }

    const pt = patients.find(p => p.id === appt.patient_id) || {};
    const waLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: pt.id, patient_name: pt.name, phone: pt.phone,
      type: doctorInitiated ? 'Doctor Alert' : 'Clinic Alert',
      message_text: doctorInitiated
        ? `Hello ${pt.name}, your consultation has been started by the doctor. Please proceed to the consultation room.`
        : `Hello ${pt.name}, you have checked in at the clinic lobby. Please take a seat while the doctor prepares to see you.`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Read', template_name: doctorInitiated ? 'doctor_checkin' : 'checkin_alert'
    };
    setWhatsappLogs(prev => [...prev, waLog]);

    if (navigate && doctorInitiated) {
      setActiveTab(isDetoxAppointment(appt) ? 'detox' : 'consultations');
    }
  };

  const handleCancelAppointment = (apptId) => setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Cancelled' } : a)));

  const handleAddConsultation = (newCons, apptId) => {
    setConsultations(prev => [...prev, newCons]);
    setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Completed' } : a)));

    if (newCons.detox_recommended) {
      const ptObj = patients.find(p => p.id === newCons.patient_id) || {};
      const followupDateString = newCons.followup_date || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const newDtx = {
        id: `DTX-${400 + detoxSessions.length + 1}`, patient_id: newCons.patient_id, consultation_id: newCons.id,
        scheduled_date: followupDateString, type: newCons.detox_type, status: 'Scheduled', cost: 7500, technician: 'Nolan Ross', notes: newCons.detox_procedure || `Recommended during consultation ${newCons.id}`
      };
      setDetoxSessions(prev => [...prev, newDtx]);

      const newFollowup = {
        id: `FUP-${800 + followups.length + 1}`,
        patient_id: ptObj.id,
        scheduled_date: followupDateString,
        notes: newCons.followup_remarks || `Follow up with receptionist to confirm detox session with ${newCons.detox_doctor_name || 'the assigned doctor'} and prepare the patient for ${newCons.detox_type}.`,
        status: 'Pending',
        created_at: new Date().toISOString().split('T')[0]
      };
      setFollowups(prev => [...prev, newFollowup]);

      const waLog = {
        id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: ptObj.id, patient_name: ptObj.name, phone: ptObj.phone,
        type: 'Session Reminder', message_text: `Hello ${ptObj.name}, your recommended ${newCons.detox_type} is scheduled for ${followupDateString}. Please begin fasting. - Manthrralaya's Wellness`,
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
      type: 'PDF Delivery', message_text: `Dear ${ptObj.name}, here is your customized prescription PDF: https://manthrralayas.co/shared/docs/presc_${newPresc.id}. Please download. - Manthrralaya's Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Delivered', template_name: 'document_delivery_pdf'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
  };

  const handleAddDietChart = (newDiet) => setDietCharts(prev => [...prev, newDiet]);

  const handleScheduleDetox = (newSession, patientObj) => {
    setDetoxSessions(prev => [...prev, newSession]);
    const waLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`, patient_id: patientObj.id, patient_name: patientObj.name, phone: patientObj.phone,
      type: 'Session Reminder', message_text: `Hello ${patientObj.name}, your ${newSession.type} session is scheduled for ${newSession.scheduled_date}. Technician: ${newSession.technician}. - Manthrralaya's Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16), status: 'Sent', template_name: 'detox_prep_reminder'
    };
    setWhatsappLogs(prev => [...prev, waLog]);
  };

  const handleUpdateDetoxStatus = (sessionId, newStatus) => setDetoxSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, status: newStatus } : s)));

  const handleUpdateDetoxSession = (sessionId, updates) => {
    setDetoxSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, ...updates } : s)));
  };

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
      type: 'Review Request', message_text: `Hello ${ptObj.name}, we hope you had a rejuvenating stay with us. Please share your rating feedback: https://manthrralayas.co/leave-review - Manthrralaya's Wellness`,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
        <p className="ml-4 text-lg text-slate-700">Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView patients={patients} appointments={appointments} consultations={consultations} detoxSessions={detoxSessions} followups={followups} stayManagement={stayManagement} activeRole={activeRole} onCheckIn={handleCheckIn} onNavigateToTab={setActiveTab} currentUser={currentUser} />;
      case 'patients':
        return <PatientsView appointments={appointments} patients={patients} followups={followups} onAddPatient={handleAddPatient} onSelectPatient={(pt) => setTimelinePatient(pt)} />;
      case 'phone-calls':
        return <PhoneCallsView phoneCalls={phoneCalls} onAddCall={handleAddCall} onBookFromCall={handleBookFromCall} />;
      case 'appointments':
        return <AppointmentsView appointments={appointments} patients={patients} doctors={doctors} onAddAppointment={handleAddAppointment} onCheckIn={handleCheckIn} onCancelAppointment={handleCancelAppointment} />;
      case 'consultations':
        return <ConsultationsView appointments={appointments} patients={patients} doctors={doctors} consultations={consultations} dietCharts={dietCharts} onAddConsultation={handleAddConsultation} onAddDietChart={handleAddDietChart} activeRole={activeRole} />;
      case 'my-patient-records':
        return <MyPatientRecords patients={patients} appointments={appointments} consultations={consultations} detoxSessions={detoxSessions} stayManagement={stayManagement} prescriptions={prescriptions} dietCharts={dietCharts} followups={followups} reviews={reviews} />;
      case 'detox':
      case 'stay':
        return <DetoxStayView
          appointments={appointments}
          patients={patients}
          doctors={doctors}
          consultations={consultations}
          detoxSessions={detoxSessions}
          stayManagement={stayManagement}
          onAddConsultation={handleAddConsultation}
          onScheduleDetox={handleScheduleDetox}
          onUpdateDetoxStatus={handleUpdateDetoxStatus}
          onUpdateDetoxSession={handleUpdateDetoxSession}
          onAdmitPatient={handleAdmitPatient}
          onUpdateNursingChecklist={handleUpdateNursingChecklist}
          onDischargePatient={handleDischargePatient}
          activeRole={activeRole}
        />;
      case 'whatsapp-hub':
        return <WhatsAppHubView whatsappLogs={whatsappLogs} patients={patients} onSendCustomMessage={handleSendCustomMessage} />;
      case 'reports':
        return <ReportsView patients={patients} appointments={appointments} consultations={consultations} detoxSessions={detoxSessions} stayManagement={stayManagement} prescriptions={prescriptions} dietCharts={dietCharts} followups={followups} />;
      case 'reviews':
        return <ReviewsView reviews={reviews} />;
      case 'documents':
        return <DocumentPreview prescriptions={prescriptions} dietCharts={dietCharts} patients={patients} onClose={() => setActiveTab('dashboard')} />;
      case 'receptionist-desk':
        return (
          <ReceptionistView
            appointments={appointments}
            setAppointments={setAppointments}
            patients={patients}
            setPatients={setPatients}
            doctors={doctors}
            whatsappLogs={whatsappLogs}
            setWhatsappLogs={setWhatsappLogs}
          />
        );
      case 'doctor-master':
        return <DoctorMasterView doctors={doctors} setDoctors={setDoctors} />;
      case 'user-management':
        return activeRole === 'admin' ? (
          <UserManagementView />
        ) : (
          <div className="text-center py-12 text-slate-500">Access Denied. Admin privileges required.</div>
        );
      default:
        return <div className="text-center py-12 text-slate-500">Access Denied or Feature in Development.</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-inter">
      <Header
        activeRole={activeRole}
        currentUser={currentUser}
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