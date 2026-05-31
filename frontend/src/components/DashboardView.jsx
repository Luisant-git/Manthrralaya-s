import React, { useState } from 'react';
import { Users, Calendar, Activity, CheckCircle, TrendingUp, TrendingDown, Clock, ShieldCheck, Stethoscope, ClipboardList, Search } from 'lucide-react';

export default function DashboardView({ 
  patients, 
  appointments, 
  consultations,
  detoxSessions,
  followups,
  stayManagement,
  activeRole,
  onCheckIn,
  onNavigateToTab,
  currentUser,
  doctors = []
}) {
  
  const todayDate = new Date().toLocaleDateString('en-CA');
  const isDoctorView = activeRole === 'doctor';
  
  // DEBUG: Log what we received
  console.log('📊 DashboardView Debug:');
  console.log('  - activeRole:', activeRole);
  console.log('  - currentUser:', currentUser);
  console.log('  - doctors array length:', doctors.length);
  console.log('  - doctors:', doctors);
  console.log('  - appointments count:', appointments.length);
  
 

  // Find current doctor - Match from doctors list or fallback to appointments data
  let currentDoctor = isDoctorView
    ? doctors.find(d => {
        const doctorEmail = (d.user?.email || d.email || '').toLowerCase();
        const doctorName = (d.user?.fullName || d.name || '').toLowerCase();
        const currentUserLower = String(currentUser || '').toLowerCase();
        
        // Match by email or name to ensure the doctor record is found correctly
        return doctorEmail === currentUserLower || doctorName === currentUserLower;
      })
    : null;

  // FALLBACK: If doctors list is empty (e.g. 403 Forbidden error on admin list)
  // or match not found, try to identify the doctor from the appointments data.
  if (isDoctorView && !currentDoctor && appointments && appointments.length > 0) {
    const aptWithDoctor = appointments.find(a => {
      const dEmail = (a.doctor?.user?.email || '').toLowerCase();
      const dName = (a.doctor?.user?.fullName || a.doctor?.name || '').toLowerCase();
      const currentUserLower = String(currentUser || '').toLowerCase();
      return dEmail === currentUserLower || dName === currentUserLower;
    });
    
    if (aptWithDoctor && aptWithDoctor.doctor) {
      currentDoctor = {
        ...aptWithDoctor.doctor,
        name: aptWithDoctor.doctor.user?.fullName || aptWithDoctor.doctor.name,
      };
      console.log('💡 Identified current doctor from appointments fallback:', currentDoctor);
    }
  }

const currentDoctorId = currentDoctor && currentDoctor.id ? Number(currentDoctor.id) : null;

  console.log('🎯 Current Doctor found:', currentDoctor);
  console.log('🎯 Current Doctor ID (number):', currentDoctorId);
  if (isDoctorView) console.log('📋 All doctors available:', doctors.map(d => ({ 
    id: d.id, 
    name: d.name, 
    email: d.user?.email || d.email 
  })));
  
  // Calculate quick metrics
  const totalPatients = patients.length;
  const todaysAppts = appointments.filter(a => a.date === todayDate).length;
  const activeStays = stayManagement.filter(s => s.status === 'Admitted').length;
  const pendingFollowups = followups.filter(f => f.status === 'Pending').length;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Get today's appointments - FIXED: Strict doctor filtering
  const todayAppointments = appointments.filter(a => {
    const apptDate = a.date || (a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString('en-CA') : '');
    const isToday = apptDate === todayDate;
    
    if (!isDoctorView) return isToday;
    
    // If no doctor is logged in, show nothing
    if (!currentDoctorId) {
      return false;
    }
    
    // Get doctor_id from multiple sources and convert to number
    const appointmentDoctorId = a.doctor_id ?? a.doctorId ?? a.doctor?.id;
    
    // Convert to number for strict comparison
    const appointmentDoctorIdNum = appointmentDoctorId ? Number(appointmentDoctorId) : null;
    
    // STRICT MATCH: Only show appointments where doctor ID matches exactly
    const isMatch = isToday && appointmentDoctorIdNum === currentDoctorId;
    
    if (isToday && appointmentDoctorIdNum) {
      console.log(`  Appointment ${a.id}: doctorId=${appointmentDoctorIdNum}, currentDoctorId=${currentDoctorId}, match=${isMatch ? '✅' : '❌'}`);
    }
    
    return isMatch;
  });
  
  console.log('📅 Today Appointments count:', todayAppointments.length);
  console.log('📅 Today Appointments details:', todayAppointments.map(a => ({ 
    id: a.id, 
    doctorId: a.doctor_id || a.doctorId, 
    status: a.status,
    patientName: a.patient?.name || 'Unknown'
  })));
  
  const totalAppointmentsToday = todayAppointments.length;
  
  // For counting unique completed patients
  const completedPatientsToday = todayAppointments
    .filter(a => a.status === 'Completed')
    .map(a => a.patient_id || a.patientId);
  const completedTodayCount = new Set(completedPatientsToday).size;
  
  // Get patients who are waiting for the doctor
  const arrivedPatients = todayAppointments.filter(a => a.status === 'Arrived');
  const checkedInPatients = todayAppointments.filter(a => a.status === 'Checked-in');
  
  // Doctor queue: show appointments that are NOT completed
  const doctorQueue = todayAppointments.filter(a =>
    a.status === 'Arrived' || a.status === 'Checked-in'
  );
  
  console.log('👨‍⚕️ Doctor Queue length:', doctorQueue.length);
  
  const getAppointmentTypeKey = (appt) => String(appt?.appointmentType || '').toLowerCase();

  const handleStartAppointment = (appt) => {
    if (appt.status !== 'Checked-in') {
      alert('Patient must be checked-in before starting consultation');
      return;
    }
    const typeKey = getAppointmentTypeKey(appt);
    if (typeKey.includes('detox')) {
      onNavigateToTab('detox');
    } else {
      onNavigateToTab('consultations');
    }
  };

  const handleDoctorCheckIn = async (appointmentId) => {
    await onCheckIn(appointmentId, true, true);
  };

  // Get today's patient list for doctor with all details
  const todayPatientList = doctorQueue
    .map((appt) => {
      const pid = appt.patientId || appt.patient_id;
      // Find patient from patients array or from nested patient object in appointment
      let patient = patients.find(p => String(p.id) === String(pid));
      
      // If not found in patients array, check if appointment has nested patient data
      if (!patient && appt.patient) {
        patient = appt.patient;
      }
      
      // Count previous consultations for this patient
      const patientConsultations = consultations.filter(c => String(c.patient_id || c.patientId) === String(pid));
      const historyCount = patientConsultations.length;
      const historyRecords = patientConsultations.sort((a, b) => new Date(b.date) - new Date(a.date));
      const latestNote = historyRecords[0]?.consultation_notes || appt.notes || 'No consultation notes yet.';
      const isCheckedIn = appt.status === 'Checked-in';
      
      // Check if this appointment already has a completed consultation
      const hasCompletedConsultation = consultations.some(c => {
        const apptIdFromConsult = c.appointment_id ?? c.appointmentId;
        if (!apptIdFromConsult) return false;
        return String(apptIdFromConsult) === String(appt.id);
      });

      return {
        ...appt,
        patient,
        historyCount,
        latestNote,
        isCheckedIn,
        hasCompletedConsultation
      };
    })
    // Only show appointments that don't have a completed consultation yet
    .filter(item => !item.hasCompletedConsultation && item.patient);
  
  // Get completed appointments list for display
  const completedAppointmentsList = todayAppointments
    .filter(a => a.status === 'Completed')
    .map((appt) => {
      const pid = appt.patientId || appt.patient_id;
      let patient = patients.find(p => String(p.id) === String(pid));
      
      if (!patient && appt.patient) {
        patient = appt.patient;
      }
      
      const completedConsultation = consultations.find(c => 
        String(c.appointment_id) === String(appt.id) || (String(c.patient_id) === String(pid) && c.date === todayDate)
      );
      
      return {
        ...appt,
        patient,
        completedConsultation
      };
    })
    .filter(item => item.patient);

  const renderPatientMeta = (pt) => {
    if (!pt) return '';
    const parts = [];
    if (pt.age) parts.push(`${pt.age} yrs`);
    if (pt.location && pt.location !== 'n/a') parts.push(pt.location);
    return parts.length > 0 ? `(${parts.join(' • ')})` : '';
  };

  const formatPhoneWithoutCountryCode = (phone) => {
    if (!phone) return '';
    const digits = phone.toString().replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const getAppointmentTypeBadge = (type) => {
    const colors = {
      'Initial consultation': 'bg-purple-50 text-purple-600 border-purple-200',
      'Detox': 'bg-teal-50 text-teal-600 border-teal-200',
      'Review': 'bg-amber-50 text-amber-600 border-amber-200'
    };
    return `px-2 py-0.5 rounded text-xs font-medium border ${colors[type] || colors['Initial consultation']}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold uppercase tracking-wider">Scheduled</span>;
      case 'Arrived':
        return <span className="px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold uppercase tracking-wider">Arrived</span>;
      case 'Checked-in':
        return <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold uppercase tracking-wider">Checked-in</span>;
      case 'Completed':
        return <span className="px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-200 text-xs font-bold uppercase tracking-wider">Completed</span>;
      case 'Cancelled':
        return <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const filteredReceptionistAppointments = todayAppointments.filter((appt) => {
    const pid = appt.patientId || appt.patient_id;
    let patient = patients.find((p) => String(p.id) === String(pid));
    
    if (!patient && appt.patient) {
      patient = appt.patient;
    }
    
    const matchesSearch = !searchQuery ||
      patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient?.phone?.includes(searchQuery) ||
      appt.appointmentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || appt.appointmentType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  // If doctor view but we haven't identified the doctor profile yet (even with fallback)
  if (isDoctorView && !currentDoctor && doctors.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
        <h3 className="text-lg font-bold text-yellow-800 mb-2">Identifying Doctor Profile</h3>
        <p className="text-yellow-700">Please wait while we sync your account details...</p>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
      </div>
    );
  }
  
  // If doctor view but no doctor found, show debug info
  if (isDoctorView && doctors.length > 0 && !currentDoctor) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
        <h3 className="text-lg font-bold text-yellow-800 mb-2">Doctor Not Found</h3>
        <p className="text-yellow-700">Could not find doctor record for user: <strong>{currentUser}</strong></p>
        <p className="text-sm text-yellow-600 mt-2">Available doctors:</p>
        <ul className="text-sm text-yellow-600 mt-1">
          {doctors.map(d => (
            <li key={d.id}>ID: {d.id}, Name: {d.name || d.user?.fullName}, Email: {d.user?.email}</li>
          ))}
        </ul>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Refresh Data
        </button>
      </div>
    );
  }
  
  // If doctor view but no appointments found, show helpful message
  if (isDoctorView && currentDoctor && todayAppointments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 border-2 border-white shadow-sm text-xl">
              {getInitials(currentUser)}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
                Doctor Dashboard
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Welcome back, <span className="font-bold text-emerald-600">{currentUser}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-blue-800 mb-2">No Appointments Today</h3>
          <p className="text-blue-700">
            You don't have any appointments scheduled for today ({todayDate}).
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Check with the receptionist to schedule appointments or view other days in the appointments tab.
          </p>
          <button
            onClick={() => onNavigateToTab('appointments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View All Appointments
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Top Title & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 border-2 border-white shadow-sm text-xl">
            {getInitials(currentUser)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
              {isDoctorView ? 'Doctor Dashboard' : 'Clinic Overview'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, <span className="font-bold text-emerald-600">{currentUser}</span>. 
              {isDoctorView
                ? ' Here is your patient queue for today.'
                : ' View real-time insights on patient flow and admissions.'}
            </p>
          </div>
        </div>
      </div>

      {isDoctorView && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Today’s Appointments</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-800">{totalAppointmentsToday}</span>
                <span className="text-xs text-slate-400">total today</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Arrived (Lobby)</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-amber-600">{arrivedPatients.length}</span>
                <span className="text-xs text-slate-400">need doctor check-in</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Ready for Consult</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-600">{checkedInPatients.length}</span>
                <span className="text-xs text-slate-400">doctor checked-in</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigateToTab('consultations')}>
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Completed Today</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-800">{completedTodayCount}</span>
                <span className="text-xs text-slate-400">patients seen</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {!isDoctorView && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-sm font-semibold text-slate-500 block">Total Patients</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-800">{totalPatients}</span>
                  <span className="text-sm font-bold text-emerald-500 flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> 12%</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigateToTab('appointments')}>
              <div>
                <span className="text-sm font-semibold text-slate-500 block">Today's Appointments</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-800">{todaysAppts}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-sm font-semibold text-slate-500 block">Pending Reviews</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-800">{pendingFollowups}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isDoctorView ? (
          <>
            {/* Left Column: Today's Patient Queue */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Today’s Patient Queue</h2>
                  <p className="text-sm text-slate-500">Active appointments waiting for consultation • {todayPatientList.length} remaining</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                    Arrived: {arrivedPatients.length}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Checked-in: {checkedInPatients.length}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                    Completed: {completedTodayCount}
                  </span>
                </div>
              </div>

              {/* Search bar for Today's Patient Queue */}
              <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative max-w-md">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patients by name, ID, phone or appointment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {todayPatientList.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                    <p className="text-slate-500">All appointments completed for today!</p>
                    <p className="text-sm text-slate-400 mt-1">Great job, doctor!</p>
                  </div>
                ) : (
                  todayPatientList.map((item) => (
                    <div key={item.id} className={`p-4 rounded-2xl border transition-all ${item.isCheckedIn ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-slate-900">{item.patient?.name || 'Unknown Patient'}</div>
                            {item.isCheckedIn && (
                              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                Checked-in
                              </span>
                            )}
                            {String(item.appointmentType || '').toLowerCase().includes('detox') && (
                              <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                Detox
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {item.patient?.medical_conditions || item.appointmentType} • {item.session === 'FN' ? 'Forenoon' : 'Afternoon'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Total Visits: {item.historyCount}
                          </div>
                          {item.patient?.phone && (
                            <div className="text-xs text-slate-400 mt-1">
                              📞 {formatPhoneWithoutCountryCode(item.patient.phone)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
                            <div className="text-sm font-semibold text-slate-700">{item.status}</div>
                          </div>
                          {item.status === 'Arrived' ? (
                            <button
                              onClick={() => handleDoctorCheckIn(item.id)}
                              className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors whitespace-nowrap flex items-center gap-2"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Doctor Check-in
                            </button>
                          ) : item.status === 'Checked-in' ? (
                            <button
                              onClick={() => handleStartAppointment(item)}
                              className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap flex items-center gap-2"
                            >
                              <Stethoscope className="w-4 h-4" />
                              {String(item.appointmentType || '').toLowerCase().includes('detox') ? 'Start Detox Session' : 'Start Consultation'}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-200 text-slate-500 cursor-not-allowed whitespace-nowrap"
                            >
                              Waiting
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 text-sm text-slate-700">
                        <span className="text-xs text-slate-500 block mb-1">Latest note:</span>
                        <span className="font-medium text-slate-900 line-clamp-2">{item.latestNote.replace(/<[^>]+>/g, '').slice(0, 100)}{item.latestNote.length > 100 ? '…' : ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Completed Today Summary */}
            <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Completed Today</h2>
                <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                  {completedAppointmentsList.length} completed
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {completedAppointmentsList.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No appointments completed yet today.</p>
                  </div>
                ) : (
                  completedAppointmentsList.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                      <div className="font-bold text-slate-800 text-sm">{item.patient?.name || 'Unknown Patient'}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {item.appointmentType}
                        {String(item.appointmentType || '').toLowerCase().includes('detox') && (
                          <span className="ml-2 text-teal-600">(Detox Session)</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Time: {item.session === 'FN' ? '9:00 AM - 1:00 PM' : '2:00 PM - 6:00 PM'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          // Receptionist View - Today's Appointments with Search and Filter
          <div className="lg:col-span-3 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Today's Appointments</h2>
                <p className="text-sm text-slate-500 mt-1">Click "Check-in" to mark patients as arrived in lobby.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {filteredReceptionistAppointments.length} / {todayAppointments.length} today
              </span>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-xl mb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patients by name, ID, phone or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg pl-4 pr-8 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="Initial consultation">Initial Consultation</option>
                    <option value="Detox">Detox</option>
                    <option value="Review">Review</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredReceptionistAppointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm italic">
                  No active schedules found matching your criteria.
                </div>
              ) : (
                <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Date & Session</th>
                      <th className="py-2.5 px-4">Patient Details</th>
                      <th className="py-2.5 px-4">Appointment Type</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceptionistAppointments.slice().reverse().map(appt => {
                      const pid = appt.patientId || appt.patient_id;
                      let pt = patients.find(p => String(p.id) === String(pid));
                      
                      if (!pt && appt.patient) {
                        pt = appt.patient;
                      }
                      
                      const isArrived = appt.status === 'Arrived';
                      const isCheckedIn = appt.status === 'Checked-in';
                      const isCompleted = appt.status === 'Completed';
                      const isCancelled = appt.status === 'Cancelled';
                      
                      return (
                        <tr key={appt.id} className="hover:bg-slate-50 transition-colors align-top">
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            {!isArrived && !isCheckedIn && !isCompleted && !isCancelled ? (
                              <button
                                onClick={() => onCheckIn(appt.id, false, false)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Check-in
                              </button>
                            ) : (isArrived || isCheckedIn) ? (
                              <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {isArrived ? 'Arrived' : 'With Doctor'}
                              </span>
                            ) : isCompleted ? (
                              <span className="text-slate-400 text-xs">Completed</span>
                            ) : isCancelled ? (
                              <span className="text-rose-400 text-xs">Cancelled</span>
                            ) : null}
                          </td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <strong className="text-slate-800 block">{appt.date || todayDate}</strong>
                            <span className="text-slate-500 block text-[11px]">Session: {appt.session || 'FN'}</span>
                          </td>
                          <td className="py-3 px-4 align-top min-w-0">
                            <span className="font-bold text-slate-800 block text-sm truncate">{pt?.name || 'Unknown Patient'}</span>
                            <span className="text-slate-500 font-medium block truncate">
                              {formatPhoneWithoutCountryCode(pt?.phone) || 'No phone'} {renderPatientMeta(pt)}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <span className={getAppointmentTypeBadge(appt.appointmentType)}>
                              {appt.appointmentType || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            {getStatusBadge(appt.status)}
                          </td>
                          <td className="py-3 px-4 align-top text-slate-600 text-sm max-w-[250px] break-words">
                            {appt.notes || 'No notes available.'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}