import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Clock, 
  Check, 
  X, 
  Phone, 
  Calendar, 
  MapPin, 
  UserCheck, 
  Plus, 
  FileText,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  User,
  RefreshCw
} from 'lucide-react';

export default function ReceptionistView({
  appointments,
  setAppointments,
  patients,
  setPatients,
  doctors,
  whatsappLogs,
  setWhatsappLogs
}) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    location: '',
    address: '',
    phone: '',
    phoneAsWhatsapp: true,
    whatsapp: '',
    doctor_id: '',
    date: new Date().toISOString().split('T')[0],
    appointmentType: 'Initial consultation',
    session: 'FN',
    notes: ''
  });

  const [bookingModalPatient, setBookingModalPatient] = useState(null);
  const [modalBookingData, setModalBookingData] = useState({
    doctor_id: '',
    date: new Date().toISOString().split('T')[0],
    appointmentType: 'Initial consultation',
    session: 'FN',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const todayDate = new Date().toISOString().split('T')[0];
  
  const [isFetchingPatient, setIsFetchingPatient] = useState(false);
  const [foundPatient, setFoundPatient] = useState(null);
  const [showPatientFoundAlert, setShowPatientFoundAlert] = useState(false);
  const [phoneDebounce, setPhoneDebounce] = useState(null);

  const fetchPatientByPhone = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      setFoundPatient(null);
      return;
    }

    setIsFetchingPatient(true);
    
    setTimeout(() => {
      const existingPatient = patients.find(p => phoneNumbersMatch(p.phone, phoneNumber));
      
      if (existingPatient) {
        setFoundPatient(existingPatient);
        setShowPatientFoundAlert(true);
        
        setFormData(prev => ({
          ...prev,
          name: existingPatient.name,
          age: existingPatient.age.toString(),
          gender: existingPatient.gender || '',
          location: existingPatient.location || '',
          address: existingPatient.address || '',
          whatsapp: existingPatient.whatsapp || existingPatient.phone,
          phoneAsWhatsapp: !existingPatient.whatsapp || existingPatient.whatsapp === existingPatient.phone
        }));
        
        setTimeout(() => {
          setShowPatientFoundAlert(false);
        }, 5000);
      } else {
        setFoundPatient(null);
      }
      setIsFetchingPatient(false);
    }, 500);
  };

  useEffect(() => {
    if (phoneDebounce) {
      clearTimeout(phoneDebounce);
    }
    
    const timer = setTimeout(() => {
      if (formData.phone && formData.phone.trim().length >= 10) {
        fetchPatientByPhone(formData.phone);
      } else {
        setFoundPatient(null);
      }
    }, 800);
    
    setPhoneDebounce(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formData.phone]);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      phone: val,
      whatsapp: prev.phoneAsWhatsapp ? val : prev.whatsapp
    }));
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      phoneAsWhatsapp: checked,
      whatsapp: checked ? prev.phone : ''
    }));
  };

  const normalizePhone = (phone) => {
    if (!phone) return '';
    return phone.toString().replace(/\D/g, '');
  };

  const phoneNumbersMatch = (a, b) => {
    const normalizedA = normalizePhone(a);
    const normalizedB = normalizePhone(b);
    if (!normalizedA || !normalizedB) return false;
    if (normalizedA === normalizedB) return true;
    return normalizedA.endsWith(normalizedB) || normalizedB.endsWith(normalizedA);
  };

  const getOrCreatePatient = (data) => {
    let patient = patients.find(p => phoneNumbersMatch(p.phone, data.phone));
    
    if (!patient) {
      patient = {
        id: `P-${100 + patients.length + 1}`,
        name: data.name,
        age: parseInt(data.age) || 30,
        gender: data.gender || 'Other',
        blood_group: 'O+',
        phone: data.phone,
        whatsapp: data.phoneAsWhatsapp ? data.phone : data.whatsapp,
        location: data.location,
        address: data.address || 'n/a',
        medical_conditions: data.notes || 'Registered via Reception desk',
        email: 'n/a',
        registered_at: new Date().toISOString().split('T')[0]
      };
      setPatients(prev => [...prev, patient]);
    } else {
      const updatedPatient = { ...patient };
      let needsUpdate = false;
      
      if (data.name && data.name !== patient.name) {
        updatedPatient.name = data.name;
        needsUpdate = true;
      }
      if (data.age && parseInt(data.age) !== patient.age) {
        updatedPatient.age = parseInt(data.age);
        needsUpdate = true;
      }
      if (data.gender && data.gender !== patient.gender) {
        updatedPatient.gender = data.gender;
        needsUpdate = true;
      }
      if (data.location && data.location !== patient.location) {
        updatedPatient.location = data.location;
        needsUpdate = true;
      }
      if (data.address && data.address !== patient.address) {
        updatedPatient.address = data.address;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        setPatients(prev => prev.map(p => 
          p.id === patient.id ? updatedPatient : p
        ));
        patient = updatedPatient;
      }
    }
    return patient;
  };

  const handleAction = (type) => {
    if (!formData.name.trim()) return alert('Patient Name is required.');
    if (!formData.age.trim()) return alert('Patient Age is required.');
    if (!formData.gender) return alert('Patient Gender is required.');
    if (!formData.location.trim()) return alert('Patient Location is required.');
    if (!formData.phone.trim()) return alert('Patient Phone is required.');

    const patientObj = getOrCreatePatient(formData);

    if (type === 'book') {
      if (!formData.doctor_id) return alert('Please assign a doctor to book an appointment.');

      const doctorObj = doctors.find(d => d.id === formData.doctor_id);
      const newAppt = {
        id: `A-${200 + appointments.length + 1}`,
        patient_id: patientObj.id,
        doctor_id: formData.doctor_id,
        doctor_name: doctorObj ? doctorObj.name : 'Chief Clinical Consultant',
        date: formData.date,
        appointmentType: formData.appointmentType,
        session: formData.session,
        source: 'Phone Lead / On-Call',
        status: 'Scheduled',
        notes: formData.notes
      };

      setAppointments(prev => [...prev, newAppt]);

      const docName = doctorObj ? doctorObj.name : 'our specialist';
      const waLog = {
        id: `WA-${900 + (whatsappLogs ? whatsappLogs.length : 0) + 1}`,
        patient_id: patientObj.id,
        patient_name: patientObj.name,
        phone: patientObj.phone,
        type: 'Booking Confirmation',
        message_text: `Dear ${patientObj.name}, your ${formData.appointmentType} appointment (${formData.session} session) with ${docName} is confirmed for ${newAppt.date}. - Manthrralaya's Wellness`,
        sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Delivered',
        template_name: 'appointment_confirm'
      };
      if (setWhatsappLogs) setWhatsappLogs(prev => [...prev, waLog]);

      alert(`Appointment confirmed for ${patientObj.name}!\nWhatsApp notification dispatched.`);
    } else if (type === 'waiting') {
      const newWaitingAppt = {
        id: `A-${200 + appointments.length + 1}`,
        patient_id: patientObj.id,
        doctor_id: formData.doctor_id || '',
        doctor_name: formData.doctor_id ? (doctors.find(d => d.id === formData.doctor_id)?.name || '') : '',
        date: formData.date,
        appointmentType: formData.appointmentType,
        session: formData.session,
        source: 'Phone Inquiry / Tentative',
        status: 'Waiting',
        notes: formData.notes || 'Patient asked for appointment details / callback'
      };
      setAppointments(prev => [...prev, newWaitingAppt]);
      alert(`Patient ${patientObj.name} added to the Waiting Registry.`);
    }

    setFormData({
      name: '',
      age: '',
      location: '',
      address: '',
      phone: '',
      phoneAsWhatsapp: true,
      whatsapp: '',
      doctor_id: '',
      date: new Date().toISOString().split('T')[0],
      appointmentType: 'Initial consultation',
      session: 'FN',
      notes: ''
    });
    setFoundPatient(null);
  };

  const handleModalBookConfirm = (e) => {
    e.preventDefault();
    if (!modalBookingData.doctor_id) return alert('Please assign a doctor.');
    if (!modalBookingData.appointmentType) return alert('Please select appointment type.');

    const patientObj = bookingModalPatient;
    const doctorObj = doctors.find(d => d.id === modalBookingData.doctor_id);

    setAppointments(prev => prev.map(appt => {
      if (appt.patient_id === patientObj.id && appt.status === 'Waiting') {
        return {
          ...appt,
          doctor_id: modalBookingData.doctor_id,
          doctor_name: doctorObj ? doctorObj.name : 'Chief Clinical Consultant',
          date: modalBookingData.date,
          appointmentType: modalBookingData.appointmentType,
          session: modalBookingData.session,
          status: 'Scheduled',
          notes: modalBookingData.notes || appt.notes
        };
      }
      return appt;
    }));

    const docName = doctorObj ? doctorObj.name : 'our specialist';
    const waLog = {
      id: `WA-${900 + (whatsappLogs ? whatsappLogs.length : 0) + 1}`,
      patient_id: patientObj.id,
      patient_name: patientObj.name,
      phone: patientObj.phone,
      type: 'Booking Confirmation',
      message_text: `Dear ${patientObj.name}, your ${modalBookingData.appointmentType} appointment (${modalBookingData.session} session) with ${docName} is confirmed for ${modalBookingData.date}. - Manthrralaya's Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Delivered',
      template_name: 'appointment_confirm'
    };
    if (setWhatsappLogs) setWhatsappLogs(prev => [...prev, waLog]);

    alert(`Appointment successfully confirmed and scheduled for ${patientObj.name}!`);
    setBookingModalPatient(null);
    setModalBookingData({
      doctor_id: '',
      date: new Date().toISOString().split('T')[0],
      appointmentType: 'Initial consultation',
      session: 'FN',
      notes: ''
    });
  };

  const handleCheckIn = (apptId) => {
    setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Arrived' } : a)));
    const appt = appointments.find(a => a.id === apptId);
    const pt = patients.find(p => p.id === appt.patient_id) || {};
    
    const waLog = {
      id: `WA-${900 + (whatsappLogs ? whatsappLogs.length : 0) + 1}`,
      patient_id: pt.id,
      patient_name: pt.name,
      phone: pt.phone,
      type: 'Clinic Alert',
      message_text: `Hello ${pt.name}, you have arrived at the clinic lobby. Please take a seat, the doctor will see you shortly. - Manthrralaya's Wellness`,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Read',
      template_name: 'checkin_alert'
    };
    if (setWhatsappLogs) setWhatsappLogs(prev => [...prev, waLog]);
  };

  const handleCancelAppointment = (apptId) => {
    setAppointments(prev => prev.map(a => (a.id === apptId ? { ...a, status: 'Cancelled' } : a)));
  };

  const handleDeleteWaiting = (apptId) => {
    if (window.confirm("Are you sure you want to remove this inquiry from the Waiting Registry?")) {
      setAppointments(prev => prev.filter(a => a.id !== apptId));
    }
  };

  const activeBookings = appointments.filter(a => a.status !== 'Waiting' && a.date === todayDate);
  const waitingList = appointments.filter(a => a.status === 'Waiting');

  const filteredActiveBookings = activeBookings.filter(appt => {
    const pt = patients.find(p => p.id === appt.patient_id) || {};
    const matchesSearch = 
      pt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pt.phone?.includes(searchQuery) ||
      appt.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || appt.appointmentType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold uppercase tracking-wider">Scheduled</span>;
      case 'Arrived':
        return <span className="px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold uppercase tracking-wider">Arrived</span>;
      case 'Checked-in':
        return <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold uppercase tracking-wider">With Doctor</span>;
      case 'Completed':
        return <span className="px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-200 text-xs font-bold uppercase tracking-wider">Completed</span>;
      case 'Cancelled':
        return <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const renderPatientMeta = (pt) => {
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

  const clearForm = () => {
    setFormData({
      name: '',
      age: '',
      gender: '',
      location: '',
      address: '',
      phone: '',
      phoneAsWhatsapp: true,
      whatsapp: '',
      doctor_id: '',
      date: new Date().toISOString().split('T')[0],
      appointmentType: 'Initial consultation',
      session: 'FN',
      notes: ''
    });
    setFoundPatient(null);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Workspace Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Reception Desk Workspace
          </h1>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Manage inquiries, register callers, schedule clinic visits, and queue arrivals in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Intake Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-extrabold text-slate-800 font-outfit">Patient Intake & Booking</h2>
            </div>
            <button
              onClick={clearForm}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear Form"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {showPatientFoundAlert && foundPatient && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg animate-fadeIn">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-800 mb-1">Returning Patient Found!</p>
                  <p className="text-xs text-emerald-700">
                    Patient records for <strong>{foundPatient.name}</strong> have been auto-filled.
                  </p>
                </div>
                <button onClick={() => setShowPatientFoundAlert(false)} className="text-emerald-600 hover:text-emerald-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Patient Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-1 transition-all font-medium border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Age <span className="text-rose-500">*</span></label>
                <input type="number" required value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Gender <span className="text-rose-500">*</span></label>
                <select required value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Location <span className="text-rose-500">*</span></label>
                <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input type="tel" required placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={handlePhoneChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
              </div>
            </div>

            <div className="flex items-center space-x-2.5 py-1">
              <input id="phoneAsWhatsapp" type="checkbox" checked={formData.phoneAsWhatsapp} onChange={handleCheckboxChange} className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
              <label htmlFor="phoneAsWhatsapp" className="text-xs text-slate-600 font-bold select-none cursor-pointer">Use Phone number as WhatsApp number</label>
            </div>

            {!formData.phoneAsWhatsapp && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">WhatsApp Number <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-emerald-600" />
                  <input type="tel" placeholder="WhatsApp No with country code" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Schedule Doctor</label>
              <select value={formData.doctor_id} onChange={e => setFormData({ ...formData, doctor_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium">
                <option value="">-- Choose specialist --</option>
                {doctors.map(d => <option key={d.id} value={d.id} disabled={d.status !== 'Available'}>{d.name} ({d.designation}) {d.status !== 'Available' ? '(On Leave)' : ''}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Appointment Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Appointment Type</label>
                <select value={formData.appointmentType} onChange={e => setFormData({ ...formData, appointmentType: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium">
                  <option value="Initial consultation">Initial Consultation</option>
                  <option value="Detox">Detox</option>
                  <option value="Review">Review</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Session Time</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="FN" checked={formData.session === 'FN'} onChange={e => setFormData({ ...formData, session: e.target.value })} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">Forenoon (FN)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="AN" checked={formData.session === 'AN'} onChange={e => setFormData({ ...formData, session: e.target.value })} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">Afternoon (AN)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Call Notes / Reason</label>
              <textarea rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all font-medium"></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3">
              <button type="button" onClick={() => handleAction('waiting')} className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs">
                <Clock className="w-4 h-4" /> Save to Waiting
              </button>
              <button type="button" onClick={() => handleAction('book')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs">
                <UserCheck className="w-4 h-4" /> Book Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Registry Tables */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Waiting List Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
            <div className="p-4 border-b border-slate-200 bg-amber-50/50 flex items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Clock className="w-4.5 h-4.5 text-amber-500" /> Waiting Registry (On-Call Inquiries)
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
              {waitingList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">No patients are currently in the waiting list.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-4">Patient Profile</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Notes</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waitingList.map(appt => {
                      const pt = patients.find(p => p.id === appt.patient_id) || {};
                      return (
                        <tr key={appt.id} className="hover:bg-amber-50/10 transition-colors">
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-slate-800 block text-sm">{pt.name}</span>
                            <span className="text-slate-500 text-xs">{pt.phone}</span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={getAppointmentTypeBadge(appt.appointmentType)}>{appt.appointmentType}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 max-w-[150px] truncate" title={appt.notes}>{appt.notes}</td>
                          <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                            <button onClick={() => { setBookingModalPatient(pt); setModalBookingData(prev => ({ ...prev, notes: appt.notes, appointmentType: appt.appointmentType, session: appt.session })); }} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors">Confirm & Book</button>
                            <button onClick={() => handleDeleteWaiting(appt.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors inline-flex align-middle"><X className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Active Appointments Log */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Calendar className="w-4.5 h-4.5 text-emerald-600" /> Active Schedule & Clinic Arrivals</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{filteredActiveBookings.length} / {activeBookings.length} Total</span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search by patient name, phone, or doctor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                    <option value="all">All Types</option>
                    <option value="Initial consultation">Initial Consultation</option>
                    <option value="Detox">Detox</option>
                    <option value="Review">Review</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              {filteredActiveBookings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">No active schedules found matching your criteria.</div>
              ) : (
                <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Date & Session</th>
                      <th className="py-2.5 px-4">Patient Details</th>
                      <th className="py-2.5 px-4">Appointment Type</th>
                      <th className="py-2.5 px-4">Assigned Doctor</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActiveBookings.slice().reverse().map(appt => {
                      const pt = patients.find(p => p.id === appt.patient_id) || {};
                      const isScheduled = appt.status === 'Scheduled';
                      const isArrived = appt.status === 'Arrived';
                      const isCheckedIn = appt.status === 'Checked-in';
                      const isCompleted = appt.status === 'Completed';
                      const isCancelled = appt.status === 'Cancelled';
                      
                      return (
                        <tr key={appt.id} className="hover:bg-slate-50 transition-colors align-top">
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            {isScheduled && (
                              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700">
                                <input type="checkbox" onChange={() => handleCheckIn(appt.id)} className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500" />
                                <span className="text-xs font-semibold">Check-in</span>
                              </label>
                            )}
                            {isArrived && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold"><Clock className="w-3.5 h-3.5" /> Arrived</span>}
                            {isCheckedIn && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold"><Check className="w-3.5 h-3.5" /> With Doctor</span>}
                            {isCompleted && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-semibold"><Check className="w-3.5 h-3.5" /> Completed</span>}
                            {isCancelled && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-xs font-semibold"><X className="w-3.5 h-3.5" /> Cancelled</span>}
                          </td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <strong className="text-slate-800 block">{appt.date || todayDate}</strong>
                            <span className="text-slate-500 block text-[11px]">Session: {appt.session || 'FN'}</span>
                          </td>
                          <td className="py-3 px-4 align-top min-w-0">
                            <span className="font-bold text-slate-800 block text-sm truncate">{pt.name || 'Unknown Patient'}</span>
                            <span className="text-slate-500 font-medium block truncate">{formatPhoneWithoutCountryCode(pt.phone) || 'No phone'} {renderPatientMeta(pt)}</span>
                          </td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <span className={getAppointmentTypeBadge(appt.appointmentType)}>{appt.appointmentType || 'General'}</span>
                          </td>
                          <td className="py-3 px-4 align-top min-w-0 whitespace-nowrap">
                            <span className="font-semibold text-slate-700 block truncate">{appt.doctor_name || 'Dr. Evelyn Carter'}</span>
                          </td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            {getStatusBadge(appt.status)}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {isScheduled && <button onClick={() => handleCancelAppointment(appt.id)} className="text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors">Cancel</button>}
                            {isArrived && <span className="text-amber-600 font-bold italic px-2">Waiting in Lobby</span>}
                            {isCheckedIn && <span className="text-emerald-600 font-bold italic px-2">In Consultation</span>}
                            {isCompleted && <span className="text-slate-400 font-medium italic px-2">Finished</span>}
                            {isCancelled && <span className="text-slate-400 line-through italic px-2">Cancelled</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick-Book Modal */}
      {bookingModalPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-left animate-scaleIn">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg m-0 font-outfit">Confirm Appointment</h3>
                <p className="text-emerald-100 text-xs mt-0.5">Assign doctor and slot for {bookingModalPatient.name}</p>
              </div>
              <button onClick={() => setBookingModalPatient(null)} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleModalBookConfirm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assign Doctor</label>
                <select required value={modalBookingData.doctor_id} onChange={e => setModalBookingData({ ...modalBookingData, doctor_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500">
                  <option value="">-- Choose specialist --</option>
                  {doctors.map(d => <option key={d.id} value={d.id} disabled={d.status !== 'Available'}>{d.name} ({d.designation})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Appointment Date</label>
                  <input type="date" required value={modalBookingData.date} onChange={e => setModalBookingData({ ...modalBookingData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Appointment Type</label>
                  <select required value={modalBookingData.appointmentType} onChange={e => setModalBookingData({ ...modalBookingData, appointmentType: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500">
                    <option value="Initial consultation">Initial Consultation</option>
                    <option value="Detox">Detox</option>
                    <option value="Review">Review</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Session Time</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value="FN" checked={modalBookingData.session === 'FN'} onChange={e => setModalBookingData({ ...modalBookingData, session: e.target.value })} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" /><span className="text-sm font-medium text-slate-700">Forenoon (FN)</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value="AN" checked={modalBookingData.session === 'AN'} onChange={e => setModalBookingData({ ...modalBookingData, session: e.target.value })} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" /><span className="text-sm font-medium text-slate-700">Afternoon (AN)</span></label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Scheduling Notes</label>
                <textarea rows="2" value={modalBookingData.notes} onChange={e => setModalBookingData({ ...modalBookingData, notes: e.target.value })} placeholder="Notes from initial call inquiry..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
              <div className="bg-emerald-50 p-4 border border-emerald-100 rounded-xl text-xs text-emerald-800">Confirming will activate this booking and trigger an automated WhatsApp confirmation message to the patient.</div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setBookingModalPatient(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors">Cancel</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm">Book Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}