import React, { useState, useEffect } from 'react';
import { getPatientByPhone, createPatient } from '../api/patientApi';
import { createAppointment, updateAppointment, updateAppointmentStatus, deleteAppointment } from '../api/appointmentApi';
import { toast } from 'react-toastify';
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
  RefreshCw,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addTemplateHeader, addTemplateFooter } from '../utils/pdfGenerator';

export default function ReceptionistView({
  appointments,
  setAppointments,
  patients,
  setPatients,
  doctors,
  whatsappLogs,
  setWhatsappLogs,
  consultations = [],
  detoxSessions = []
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
  const [filterDate, setFilterDate] = useState(todayDate);
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  
  const [isFetchingPatient, setIsFetchingPatient] = useState(false);
  const [foundPatient, setFoundPatient] = useState(null);
  const [showPatientFoundAlert, setShowPatientFoundAlert] = useState(false);
  const [matchingPatients, setMatchingPatients] = useState([]);
  const [phoneDebounce, setPhoneDebounce] = useState(null);

  // Create a robust list of available doctors (Master list + Extraction from Appointments)
  const availableDoctors = doctors ? doctors.filter(d => d.status === 'Available') : [];
  const allDoctors = doctors ? [...doctors] : [];
  
  if (appointments && appointments.length > 0) {
    appointments.forEach(a => {
      const doc = a.doctor || a.Doctor;
      if (doc && doc.id) {
        if (!allDoctors.some(d => String(d.id) === String(doc.id))) {
          allDoctors.push({
            ...doc,
            name: doc.user?.fullName || doc.name || `Doctor ${doc.id}`
          });
        }
        if (doc.status === 'Available' && !availableDoctors.some(d => String(d.id) === String(doc.id))) {
          availableDoctors.push({
            ...doc,
            name: doc.user?.fullName || doc.name || `Doctor ${doc.id}`
          });
        }
      }
    });
  }

  const getDoctorLabel = (doctorId) => {
    if (!doctorId) return '';
    const doc = allDoctors.find(d => String(d.id) === String(doctorId));
    if (!doc) return `Doctor ${doctorId}`;
    const name = doc.user?.fullName || doc.name || `Doctor ${doc.id}`;
    const specialty = doc.specialization || doc.designation || '';
    return `${name}${specialty ? ` (${specialty})` : ''} (${doc.status || 'Unknown'})`;
  };

  const getAppointmentTimestamp = (appt) => {
    const raw = appt?.appointmentDate || appt?.date;
    if (!raw) return 0;
    const normalized = typeof raw === 'string' && !raw.includes('T') ? `${raw}T00:00:00` : raw;
    const dateObj = new Date(normalized);
    return isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
  };

  const hasCompletedThreeDetoxSessions = (patientId) => {
    if (!patientId) return false;
    const ptDetox = detoxSessions.filter(d => String(d.patientId || d.patient_id) === String(patientId));
    return ptDetox.length >= 3;
  };

  const getFinalAppointmentType = (patientId, rawType) => {
    if (hasCompletedThreeDetoxSessions(patientId)) return 'Review';
    return rawType || 'Review';
  };

 const buildPrefilledPatientForm = (patient, prev) => {
  // Get patient's appointments (nested in patient object)
  const patientAppointments = Array.isArray(patient.appointments) ? [...patient.appointments] : [];
  
  // Get the most recent appointment by date
  const lastAppt = [...patientAppointments].sort((a, b) => {
    const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
    const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
    return dateB - dateA;
  })[0];

  // Get consultations for this patient
  const ptCons = consultations.filter(c => String(c.patient_id) === String(patient.id));
  const latestCons = [...ptCons].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  
  // Get detox sessions for this patient
  const ptDetoxSessions = detoxSessions ? detoxSessions.filter(ds => String(ds.patient_id) === String(patient.id) || String(ds.patientId) === String(patient.id)) : [];
  const latestDetoxSession = [...ptDetoxSessions].sort((a, b) => {
    const dateA = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
    const dateB = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
    return dateB - dateA;
  })[0];

  const defaultDate = new Date().toISOString().slice(0, 10);
  
  const newState = {
    ...prev,
    name: patient.name || prev.name,
    age: patient.age?.toString() || prev.age,
    gender: patient.gender || prev.gender,
    location: patient.location || prev.location,
    address: patient.address || prev.address,
    whatsapp: patient.whatsapp || patient.phone || prev.whatsapp,
    phoneAsWhatsapp: !patient.whatsapp || patient.whatsapp === patient.phone,
    doctor_id: '',
    doctor_name: '',
    date: defaultDate,
    appointmentType: 'Initial consultation',
    session: 'FN'
  };

  // Helper function to format date for input
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    return dateValue;
  };

  // PRIORITY 1: Check for follow-up edited by receptionist (highest priority)
  const rec = latestCons?.receptionistFollowup || latestCons?.receptionist_followup;
  if (rec && (rec.followupDate || rec.followup_date)) {
    const formattedDate = formatDateForInput(rec.followupDate || rec.followup_date);
    if (formattedDate) {
      newState.date = formattedDate;
      const isDetox = latestCons?.detox_recommended || latestCons?.detoxRecommended;
      newState.appointmentType = hasCompletedThreeDetoxSessions(patient.id) ? 'Review' : (isDetox ? 'Detox' : 'Review');
      
      const dDocId = latestCons?.detox_doctor_id || latestCons?.detoxDoctorId;
      const rDocId = latestCons?.doctor_id;
      if (dDocId) {
        newState.doctor_id = dDocId;
      } else if (rDocId) {
        newState.doctor_id = rDocId;
      }
      
      if (latestCons.session) {
        newState.session = latestCons.session;
      } else if (lastAppt?.session) {
        newState.session = lastAppt.session;
      }
      return newState;
    }
  }

  // PRIORITY 2: Check for follow-up from detox session (most recent)
  const detoxFollowupDate = latestDetoxSession?.followupDate || latestDetoxSession?.followup_date;
  if (detoxFollowupDate) {
    const formattedDate = formatDateForInput(detoxFollowupDate);
    if (formattedDate) {
      newState.date = formattedDate;
      console.debug('[buildPrefilledPatientForm] Set detox follow-up date:', formattedDate);
    }
    
    // Determine appointment type based on consultation's detox recommendation
    const hasDetoxRecommendation = latestCons?.detox_recommended || latestCons?.detoxRecommended;
    newState.appointmentType = hasCompletedThreeDetoxSessions(patient.id) ? 'Review' : (hasDetoxRecommendation ? 'Detox' : 'Review');
    
    // Use the doctor from the detox session if available
    if (latestDetoxSession.doctorId || latestDetoxSession.doctor_id) {
      newState.doctor_id = latestDetoxSession.doctorId || latestDetoxSession.doctor_id;
    } else if (latestCons?.detox_doctor_id || latestCons?.detoxDoctorId) {
      newState.doctor_id = latestCons.detox_doctor_id || latestCons.detoxDoctorId;
    } else if (latestCons?.doctor_id) {
      newState.doctor_id = latestCons.doctor_id;
    } else if (latestDetoxSession.doctor?.id) {
      newState.doctor_id = latestDetoxSession.doctor.id;
    }
    
    if (latestDetoxSession.sessionType) {
      newState.session = latestDetoxSession.sessionType === 'morning' ? 'FN' : 'AN';
    } else if (lastAppt?.session) {
      newState.session = lastAppt.session;
    }
  }
  // PRIORITY 3: Check for follow-up from consultation
  else {
    const consultationFollowupDate = latestCons?.followup_date || latestCons?.followupDate;
    if (consultationFollowupDate) {
      const formattedDate = formatDateForInput(consultationFollowupDate);
      if (formattedDate) {
        newState.date = formattedDate;
      }
      
      const isDetoxRecommended = latestCons?.detox_recommended || latestCons?.detoxRecommended;
      newState.appointmentType = hasCompletedThreeDetoxSessions(patient.id) ? 'Review' : (isDetoxRecommended ? 'Detox' : 'Review');
      
      const detoxDoctorId = latestCons?.detox_doctor_id || latestCons?.detoxDoctorId;
      const regularDoctorId = latestCons?.doctor_id;
      
      if (detoxDoctorId) {
        newState.doctor_id = detoxDoctorId;
      } else if (regularDoctorId) {
        newState.doctor_id = regularDoctorId;
      }
      
      if (latestCons.session) {
        newState.session = latestCons.session;
      } else if (lastAppt?.session) {
        newState.session = lastAppt.session;
      }
    }
    // PRIORITY 3: Detox recommendation without follow-up date
    else if (latestCons?.detox_recommended || latestCons?.detoxRecommended) {
      newState.appointmentType = hasCompletedThreeDetoxSessions(patient.id) ? 'Review' : 'Detox';
      
      const detoxDoctorId = latestCons?.detox_doctor_id || latestCons?.detoxDoctorId;
      const regularDoctorId = latestCons?.doctor_id;
      
      if (detoxDoctorId) {
        newState.doctor_id = detoxDoctorId;
      } else if (regularDoctorId) {
        newState.doctor_id = regularDoctorId;
      }
      
      if (latestCons.session) {
        newState.session = latestCons.session;
      } else if (lastAppt?.session) {
        newState.session = lastAppt.session;
      }
    }
    // PRIORITY 4: Use last appointment data
    else if (lastAppt) {
      if (lastAppt.appointmentDate) {
        const dateObj = new Date(lastAppt.appointmentDate);
        if (!isNaN(dateObj.getTime())) {
          newState.date = dateObj.toISOString().slice(0, 10);
        }
      }
      
      if (lastAppt.appointmentType) {
        newState.appointmentType = lastAppt.appointmentType;
      }
      
      if (lastAppt.doctorId || lastAppt.doctor_id) {
        newState.doctor_id = lastAppt.doctorId || lastAppt.doctor_id;
      } else if (lastAppt.doctor?.id) {
        newState.doctor_id = lastAppt.doctor.id;
      }
      
      newState.doctor_name = lastAppt.doctor_name || 
                             lastAppt.doctor?.user?.fullName || 
                             lastAppt.doctor?.name || '';
      
      if (lastAppt.session) {
        newState.session = lastAppt.session;
      }
    }
  }

  return newState;
};

  const fetchPatientByPhone = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      setFoundPatient(null);
      setMatchingPatients([]);
      return;
    }

    setIsFetchingPatient(true);
    try {
      const patientResp = await getPatientByPhone(phoneNumber);
      console.log('fetchPatientByPhone result:', patientResp);
      
      if (Array.isArray(patientResp) && patientResp.length > 1) {
        // Multiple patients match - show dropdown for selection
        setMatchingPatients(patientResp);
        setFoundPatient(null);
        setShowPatientFoundAlert(false);
        setIsFetchingPatient(false);
        return;
      }
      
      const patient = Array.isArray(patientResp) ? patientResp[0] : patientResp;
      if (patient) {
        setMatchingPatients([]);
        setFoundPatient(patient);
        setShowPatientFoundAlert(true);
        
        const shouldAutoFill = !formData.name.trim() || formData.name.trim() === String(patient.name || '').trim();
        if (shouldAutoFill) {
          const newState = buildPrefilledPatientForm(patient, formData);
          setFormData(newState);
          
          // Set doctor search term from patient's last appointment
          const patientAppointments = patient.appointments || [];
          const lastAppt = [...patientAppointments].sort((a, b) => {
            const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
            const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
            return dateB - dateA;
          })[0];
          
          if (lastAppt?.doctor?.user?.fullName) {
            setDoctorSearchTerm(lastAppt.doctor.user.fullName);
          } else if (newState.doctor_name) {
            setDoctorSearchTerm(newState.doctor_name);
          } else if (newState.doctor_id) {
            setDoctorSearchTerm(getDoctorLabel(newState.doctor_id));
          } else {
            setDoctorSearchTerm('');
          }
        }
        
        setTimeout(() => setShowPatientFoundAlert(false), 5000);
      } else {
        setFoundPatient(null);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
      setFoundPatient(null);
      setMatchingPatients([]);
    } finally {
      setIsFetchingPatient(false);
    }
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
        setMatchingPatients([]);
      }
    }, 800);
    
    setPhoneDebounce(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formData.phone]);

  useEffect(() => {
    const doc = doctors?.find(d => String(d.id) === String(formData.doctor_id));
    if (doc) {
      const doctorName = doc.user?.fullName || doc.name || `Doctor ${doc.id}`;
      const doctorSpecialty = doc.specialization || doc.designation || '';
      setDoctorSearchTerm(`${doctorName} (${doctorSpecialty}) (${doc.status})`);
    } else if (!formData.doctor_id) {
      setDoctorSearchTerm('');
    }
  }, [formData.doctor_id, doctors]);

  useEffect(() => {
    const handleClickOutside = () => setShowDoctorDropdown(false);
    if (showDoctorDropdown) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showDoctorDropdown]);

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({
      ...prev,
      phone: digits,
      whatsapp: prev.phoneAsWhatsapp ? digits : prev.whatsapp
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

  const chooseDuplicatePatient = (patient) => {
    console.log('[chooseDuplicatePatient] Selected:', patient.name, 'ID:', patient.id);
    
    setMatchingPatients([]);
    setFoundPatient(patient);
    setShowPatientFoundAlert(true);
    
    const newState = buildPrefilledPatientForm(patient, formData);
    console.log('[chooseDuplicatePatient] Form populated with:', newState.name, 'Date:', newState.date);
    
    setFormData(newState);
    
    const patientAppointments = patient.appointments || [];
    const lastAppt = [...patientAppointments].sort((a, b) => {
      const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
      const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
      return dateB - dateA;
    })[0];
    
    if (lastAppt?.doctor?.user?.fullName) {
      setDoctorSearchTerm(lastAppt.doctor.user.fullName);
    } else if (newState.doctor_name) {
      setDoctorSearchTerm(newState.doctor_name);
    } else if (newState.doctor_id) {
      setDoctorSearchTerm(getDoctorLabel(newState.doctor_id));
    } else {
      setDoctorSearchTerm('');
    }
  };

  const createNewPatientForPhone = () => {
    setMatchingPatients([]);
    setFoundPatient(null);
    setShowPatientFoundAlert(false);
    setFormData(prev => ({
      ...prev,
      name: '',
      age: '',
      gender: '',
      location: '',
      address: '',
      whatsapp: prev.phoneAsWhatsapp ? prev.phone : '',
      doctor_id: '',
      date: new Date().toISOString().split('T')[0],
      appointmentType: 'Initial consultation',
      session: 'FN',
      notes: ''
    }));
    setDoctorSearchTerm('');
  };

  const handleAction = async (type) => {
    if (!formData.name.trim()) { toast.warn('Patient Name is required.'); return; }
    if (!formData.age.trim()) { toast.warn('Patient Age is required.'); return; }
    if (!formData.gender) { toast.warn('Patient Gender is required.'); return; }
    if (!formData.location.trim()) { toast.warn('Patient Location is required.'); return; }
    if (!formData.phone.trim()) { toast.warn('Patient Phone is required.'); return; }

    try {
      let patientObj = null;
      const resp = await getPatientByPhone(formData.phone).catch(() => null);
      const matches = Array.isArray(resp) ? resp : (resp ? [resp] : []);
      const firstMatch = matches[0] || null;
      const normalizedName = formData.name.trim();

      const hasNameMatch = matches.some(m => String(m.name || '').trim() === normalizedName);
      const shouldCreateNew = !hasNameMatch && normalizedName !== '';

      if (foundPatient && normalizedName !== String(foundPatient.name || '').trim()) {
        patientObj = await createPatient({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          phone: formData.phone,
          whatsapp: formData.phoneAsWhatsapp ? formData.phone : formData.whatsapp,
          location: formData.location,
          address: formData.address,
          medical_conditions: formData.notes || 'Registered via Reception desk'
        });
      } else if (shouldCreateNew) {
        patientObj = await createPatient({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          phone: formData.phone,
          whatsapp: formData.phoneAsWhatsapp ? formData.phone : formData.whatsapp,
          location: formData.location,
          address: formData.address,
          medical_conditions: formData.notes || 'Registered via Reception desk'
        });
      } else {
        patientObj = foundPatient || firstMatch;
        if (!patientObj) {
          patientObj = await createPatient({
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            phone: formData.phone,
            whatsapp: formData.phoneAsWhatsapp ? formData.phone : formData.whatsapp,
            location: formData.location,
            address: formData.address,
            medical_conditions: formData.notes || 'Registered via Reception desk'
          });
        }
      }

      setPatients(prev => {
        if (!patientObj) return prev;
        const existingIndex = prev.findIndex(p => String(p.id) === String(patientObj.id));
        if (existingIndex !== -1) {
          const copy = [...prev];
          copy[existingIndex] = patientObj;
          return copy;
        }
        return [patientObj, ...prev];
      });

      if (type === 'book' && !formData.doctor_id) {
        toast.warn('Please assign a doctor to book an appointment.'); 
        return;
      }

      const appointmentData = {
        patientId: Number(patientObj.id),
        doctorId: formData.doctor_id ? parseInt(formData.doctor_id) : null,
        appointmentDate: formData.date,
        appointmentType: formData.appointmentType,
        session: formData.session,
        notes: formData.notes,
        status: type === 'waiting' ? 'Waiting' : 'Scheduled'
      };

      const newAppt = await createAppointment(appointmentData);
      
      const doctorObj = allDoctors.find(d => String(d.id) === String(formData.doctor_id));
      const appointmentDateValue = newAppt.appointmentDate || newAppt.date || appointmentData.appointmentDate;
      const normalizedNewAppt = {
        ...newAppt,
        patient: patientObj,
        patientId: Number(patientObj.id),
        patient_id: String(patientObj.id),
        doctor: doctorObj,
        doctorId: formData.doctor_id ? parseInt(formData.doctor_id, 10) : newAppt.doctorId || newAppt.doctor_id,
        doctor_id: formData.doctor_id ? parseInt(formData.doctor_id, 10) : newAppt.doctorId || newAppt.doctor_id,
        doctor_name: doctorObj?.user?.fullName || doctorObj?.name || newAppt.doctor_name,
        appointmentDate: appointmentDateValue,
        date: getAppointmentDateOnly({ appointmentDate: appointmentDateValue })
      };
      setAppointments(prev => [...prev, normalizedNewAppt]);

      if (type === 'book') {
        const docName = doctorObj?.user?.fullName || doctorObj?.name || 'Not Applicable';
        const waLog = {
          id: `WA-${Date.now()}`,
          patient_id: patientObj.id,
          patient_name: patientObj.name,
          phone: patientObj.phone,
          type: 'Booking Confirmation',
          message_text: `Dear ${patientObj.name}, your ${formData.appointmentType} appointment (${formData.session} session) with ${docName} is confirmed for ${formData.date}. - Manthrralaya's Wellness`,
          sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'Delivered',
          template_name: 'appointment_confirm'
        };
        if (setWhatsappLogs) setWhatsappLogs(prev => [...prev, waLog]);
        toast.success(`Appointment confirmed for ${patientObj.name}!`);
      } else {
        toast.success(`Patient ${patientObj.name} added to the Waiting Registry.`);
      }

      clearForm();
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleModalBookConfirm = async (e) => {
    e.preventDefault();
    if (!modalBookingData.doctor_id) { toast.warn('Please assign a doctor.'); return; }
    try {
      const waitingAppt = appointments.find(a => (String(a.patientId || a.patient_id) === String(bookingModalPatient.id)) && a.status === 'Waiting');
      if (waitingAppt) {
        const doctorIdValue = modalBookingData.doctor_id ? parseInt(modalBookingData.doctor_id, 10) : waitingAppt.doctorId || waitingAppt.doctor_id;
        await updateAppointment(waitingAppt.id, {
          doctorId: doctorIdValue,
          appointmentDate: modalBookingData.date || waitingAppt.appointmentDate || waitingAppt.date,
          appointmentType: modalBookingData.appointmentType || waitingAppt.appointmentType,
          session: modalBookingData.session || waitingAppt.session,
          notes: modalBookingData.notes || waitingAppt.notes
        });

        const updatedStatus = await updateAppointmentStatus(waitingAppt.id, 'Scheduled');
        const selectedDoc = allDoctors.find(d => String(d.id) === String(doctorIdValue));
        const appointmentDateValue = modalBookingData.date || waitingAppt.appointmentDate || waitingAppt.date;
        const mergedUpdate = {
          ...waitingAppt,
          ...updatedStatus,
          doctorId: doctorIdValue,
          doctor: selectedDoc || updatedStatus.doctor || waitingAppt.doctor,
          doctor_name: selectedDoc?.user?.fullName || selectedDoc?.name || updatedStatus.doctor_name || updatedStatus.doctor?.user?.fullName || updatedStatus.doctor?.name,
          appointmentDate: appointmentDateValue,
          date: getAppointmentDateOnly({ appointmentDate: appointmentDateValue })
        };

        setAppointments(prev => prev.map(a => a.id === waitingAppt.id ? mergedUpdate : a));
        toast.success(`Appointment successfully scheduled for ${bookingModalPatient.name}!`);
        setBookingModalPatient(null);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleCheckIn = async (apptId) => {
    try {
      const updated = await updateAppointmentStatus(apptId, 'Arrived');
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, ...updated } : a));
      toast.success('Patient checked in successfully');
    } catch (error) {
      toast.error('Check-in failed');
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const updated = await updateAppointmentStatus(apptId, 'Cancelled');
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, ...updated } : a));
      toast.success('Appointment cancelled');
    } catch (error) {
      toast.error('Cancellation failed');
    }
  };

  const handleDeleteWaiting = async (apptId) => {
    if (!window.confirm("Remove this inquiry?")) return;
    try {
      await deleteAppointment(apptId);
      setAppointments(prev => prev.filter(a => a.id !== apptId));
      toast.success('Inquiry removed');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const getAppointmentDateOnly = (appt) => {
    const raw = appt?.appointmentDate || appt?.date;
    if (!raw) return '';
    if (typeof raw === 'string') {
      return raw.includes('T') ? raw.split('T')[0] : raw;
    }
    const dateObj = new Date(raw);
    return isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().slice(0, 10);
  };

  const activeBookings = appointments?.filter(a => {
    if (!a) return false;
    const apptDate = getAppointmentDateOnly(a);
    return a.status !== 'Waiting' && apptDate === filterDate;
  }) || [];

  const waitingList = appointments?.filter(a => a?.status === 'Waiting') || [];

  const filteredActiveBookings = activeBookings.filter(appt => {
    if (!appt) return false;
    const pt = patients?.find(p => String(p.id) === String(appt.patientId || appt.patient_id)) || appt.patient || appt.Patient || {};
    const doc = allDoctors?.find(d => String(d.id) === String(appt.doctorId || appt.doctor_id)) || {};
    const docFullName = doc?.user?.fullName || doc?.name || appt.doctor_name || '';

    const matchesSearch = !searchQuery || 
      pt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pt.phone?.includes(searchQuery) ||
      docFullName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || appt.appointmentType === filterType;
    const matchesDoctor = filterDoctor === 'all' || String(appt.doctorId || appt.doctor_id) === String(filterDoctor);
    const matchesStatus = filterStatus === 'all' || String(appt.status || '').trim() === String(filterStatus).trim();
    
    return matchesSearch && matchesFilter && matchesDoctor && matchesStatus;
  });

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    
    addTemplateHeader(doc, "SCHEDULE REPORT");
    addTemplateFooter(doc);

    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);

    const doctorLabel = filterDoctor === 'all' ? 'All Doctors' : allDoctors.find(d => String(d.id) === String(filterDoctor))?.name || 'Selected Doctor';
    const typeLabel = filterType === 'all' ? 'All Types' : filterType;
    const statusLabel = filterStatus === 'all' ? 'All Statuses' : filterStatus;

    doc.text(`Date: ${filterDate}`, pageWidth - 14, 65, { align: 'right' });
    doc.text(`Doctor: ${doctorLabel}`, 14, 72);
    doc.text(`Type: ${typeLabel}`, 14, 79);
    doc.text(`Status: ${statusLabel}`, 14, 86);

    const tableData = filteredActiveBookings.map((appt, index) => {
      const pt = patients?.find(p => String(p.id) === String(appt.patientId || appt.patient_id)) || appt.patient || {};
      return [
        index + 1,
        pt.name || '0',
        pt.phone ? String(pt.phone).replace(/\D/g, '').slice(-10) : '0',
        appt.session || 'FN',
        appt.appointmentType || '-',
        appt.notes || '-',
        appt.status || '-',
        ''
      ];
    });

    if (tableData.length === 0) {
       tableData.push(['-', '-', '-', '-', '-', '-', '-', '']);
    }

    autoTable(doc, {
      startY: 95,
      head: [['S.No', 'Patient', 'Contact', 'Session', 'Type', 'Notes', 'Status', 'Attended']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 63, 113] },
      styles: { fontSize: 8, overflow: 'linebreak' },
      columnStyles: {
        5: { cellWidth: 50 }
      },
      margin: { bottom: 25 },
      didDrawCell: function(data) {
        if (data.column.index === 7 && data.section === 'body') {
          doc.setDrawColor(100);
          doc.setLineWidth(0.3);
          const boxSize = 3;
          doc.rect(
            data.cell.x + data.cell.width / 2 - boxSize / 2, 
            data.cell.y + data.cell.height / 2 - boxSize / 2, 
            boxSize, 
            boxSize
          );
        }
      }
    });

    doc.save(`Schedule_Report_${filterDate}.pdf`);
  };

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
    if (pt?.age) parts.push(`${pt.age} yrs`);
    if (pt?.location && pt.location !== 'n/a') parts.push(pt.location);
    return parts.length > 0 ? `(${parts.join(' • ')})` : '';
  };

  const formatPhoneWithoutCountryCode = (phone) => {
    if (!phone) return '';
    const digits = phone.toString().replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const normalizePhone = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const phoneDigits = normalizePhone(formData.phone || '');
  const isPhoneValid = phoneDigits.length === 10;
  const phoneValidationMessage = formData.phone.trim().length === 0
    ? ''
    : phoneDigits.length === 10
      ? 'Valid number'
      : phoneDigits.length < 10
        ? `${10 - phoneDigits.length} more digit${10 - phoneDigits.length === 1 ? '' : 's'} needed`
        : `Using last 10 digits`;
  const phoneBorderClass = formData.phone.trim().length === 0
    ? 'border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
    : isPhoneValid
      ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100'
      : 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-100';

  const isSelectingDuplicatePatient = matchingPatients.length > 0;

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
    setMatchingPatients([]);
    setDoctorSearchTerm('');
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="Enter 10 digit mobile"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full bg-slate-50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none transition-all font-medium ${phoneBorderClass}`}
                />
                {isPhoneValid && (
                  <Check className="absolute right-3.5 top-3.5 w-4 h-4 text-emerald-600" />
                )}
              </div>
              {phoneValidationMessage && (
                <p className={`mt-2 text-xs font-semibold ${isPhoneValid ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {phoneValidationMessage}
                </p>
              )}
            </div>
            
            {isSelectingDuplicatePatient && (
              <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900 font-semibold">
                Multiple records were found for this number. Please select the correct profile from the pop-up dialog.
              </div>
            )}
            
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

                {matchingPatients && matchingPatients.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-3">
                      <div className="text-xs font-bold text-slate-600 px-2 pb-2 border-b border-slate-100 mb-2">Multiple patients found — select one:</div>
                      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                        {matchingPatients.map(mp => {
                          const mpAppointments = mp.appointments || [];
                          const lastMpAppt = [...mpAppointments].sort((a, b) => {
                            const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
                            const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
                            return dateB - dateA;
                          })[0];
                          
                          return (
                            <button 
                              key={mp.id} 
                              type="button" 
                              onClick={() => chooseDuplicatePatient(mp)} 
                              className="text-left w-full px-3 py-2 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-bold text-slate-800 text-sm">
                                    {mp.name || 'Unnamed Patient'}
                                    {mp.age && <span className="text-xs text-slate-500 ml-2 font-normal">({mp.age} yrs, {mp.gender || 'N/A'})</span>}
                                  </div>
                                 
                                </div>
                                <div className="text-xs text-slate-400 ml-3">ID: {mp.id}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 p-3">
                      <button 
                        type="button" 
                        onClick={() => setMatchingPatients([])} 
                        className="text-sm text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={createNewPatientForPhone} 
                        className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Create New Patient
                      </button>
                    </div>
                  </div>
                )}
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Schedule Doctor <span className="text-rose-500">*</span></label>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search doctor by name or specialty..."
                    value={doctorSearchTerm}
                    onFocus={() => setShowDoctorDropdown(true)}
                    onChange={(e) => {
                      setDoctorSearchTerm(e.target.value);
                      setShowDoctorDropdown(true);
                      if (formData.doctor_id) setFormData(prev => ({ ...prev, doctor_id: '' }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  />
                  {doctorSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setDoctorSearchTerm('');
                        setFormData(prev => ({ ...prev, doctor_id: '' }));
                        setShowDoctorDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {showDoctorDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto animate-fadeIn">
                    {availableDoctors.length > 0 ? (
                      availableDoctors
                        .filter(d => {
                          const doctorName = d.user?.fullName || d.name || `Doctor ${d.id}`;
                          const doctorSpecialty = d.specialization || d.designation || '';
                          return d.status === 'Available' && 
                            (doctorName.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
                             doctorSpecialty.toLowerCase().includes(doctorSearchTerm.toLowerCase()));
                        })
                        .map(d => {
                          const doctorName = d.user?.fullName || d.name || `Doctor ${d.id}`;
                          const doctorSpecialty = d.specialization || d.designation || 'General Physician';
                          const isAvailable = d.status === 'Available';
                          
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                if (isAvailable) {
                                  const update = { doctor_id: d.id };
                                  if (d.role === 'THERAPIST') update.appointmentType = getFinalAppointmentType(foundPatient?.id, 'Detox');
                                  setFormData({ ...formData, ...update });
                                  setDoctorSearchTerm(`${doctorName} (${doctorSpecialty}) (${d.status})`);
                                  setShowDoctorDropdown(false);
                                }
                              }}
                              disabled={!isAvailable}
                              className="w-full text-left px-4 py-2 text-sm border-b border-slate-100 last:border-0 transition-colors hover:bg-emerald-50 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <span className="font-bold text-slate-800">{doctorName}</span>
                                  <span className="text-slate-500 ml-1 text-xs">({doctorSpecialty})</span>
                                </div>
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap ${
                                  isAvailable 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                    : 'bg-rose-50 border-rose-200 text-rose-600'
                                }`}>
                                  {d.status}
                                </span>
                              </div>
                            </button>
                          );
                        })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 italic">No available doctors found.</div>
                    )}
                    {availableDoctors.length === 0 && doctors.length > 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 italic">No doctors available today.</div>
                    )}
                  </div>
                )}
              </div>
              {formData.doctor_id && doctorSearchTerm && (
                <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg flex items-center justify-between">
                  <span>✓ Selected: {doctorSearchTerm}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDoctorSearchTerm('');
                      setFormData(prev => ({ ...prev, doctor_id: '' }));
                    }}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Appointment Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Appointment Type</label>
                <select value={formData.appointmentType} onChange={e => setFormData({ ...formData, appointmentType: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium">
                  {availableDoctors.find(d => String(d.id) === String(formData.doctor_id))?.role === 'THERAPIST' ? (
                    <option value="Detox">Detox</option>
                  ) : (
                    <>
                      <option value="Initial consultation">Initial Consultation</option>
                      <option value="Detox">Detox</option>
                      <option value="Review">Review</option>
                    </>
                  )}
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
              <button type="button" onClick={() => handleAction('waiting')} disabled={isSelectingDuplicatePatient} className={`bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${isSelectingDuplicatePatient ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <Clock className="w-4 h-4" /> Save to Waiting
              </button>
              <button type="button" onClick={() => handleAction('book')} disabled={isSelectingDuplicatePatient} className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${isSelectingDuplicatePatient ? 'opacity-60 cursor-not-allowed' : ''}`}>
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
                      const pt = patients?.find(p => String(p.id) === String(appt.patientId || appt.patient_id)) || appt.patient || appt.Patient || {};
                      const assignedDoc = allDoctors.find(d => String(d.id) === String(appt.doctorId || appt.doctor_id));
                      const assignedDocName = assignedDoc?.user?.fullName || assignedDoc?.name || appt.doctor_name;
                      
                      const ptCons = consultations.filter(c => String(c.patient_id) === String(pt.id));
                      const latestFollowup = [...ptCons].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                      const fDate = latestFollowup?.followup_date;
                      const fDocId = latestFollowup?.detox_doctor_id || latestFollowup?.doctor_id;
                      const fDoc = allDoctors.find(d => String(d.id) === String(fDocId));
                      const fDocName = fDoc?.user?.fullName || fDoc?.name;

                      return (
                        <tr key={appt.id} className="hover:bg-amber-50/10 transition-colors align-top">
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-slate-800 block text-sm">{pt.name || 'Unknown Patient'}</span>
                            <span className="text-slate-500 text-xs">{formatPhoneWithoutCountryCode(pt.phone) || 'No phone'}</span>
                            
                            {fDate ? (
                              <div className="mt-1.5 p-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                <span className="text-indigo-600 text-[9px] font-bold block uppercase">Recommended Follow-up:</span>
                                <span className="text-slate-700 text-[10px] font-bold block">{new Date(fDate).toLocaleDateString()}</span>
                                {fDocName && (
                                  <span className="text-slate-500 text-[9px] block">With: Dr. {fDocName}</span>
                                )}
                              </div>
                            ) : assignedDocName && (
                              <span className="text-emerald-600 text-[10px] font-bold block uppercase mt-1">For: {assignedDocName}</span>
                            )}
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
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search by patient name, phone, or doctor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                  </div>
                  <button onClick={handleDownloadPdf} className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-5 py-2 rounded-xl border border-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-sm">
                    <Download className="w-4 h-4" /> Download Report
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer" />
                  </div>
                  
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                      <option value="all">All Doctors</option>
                      {availableDoctors.map(d => {
                        const name = d.user?.fullName || d.name || `Doctor ${d.id}`;
                        return <option key={d.id} value={d.id}>Dr. {name}</option>;
                      })}
                    </select>
                  </div>
                  
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                      <option value="all">All Types</option>
                      <option value="Initial consultation">Initial Consultation</option>
                      <option value="Detox">Detox</option>
                      <option value="Review">Review</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                      <option value="all">All Statuses</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Arrived">Arrived</option>
                      <option value="Checked-in">Checked-in</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
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
                      const pt = patients?.find(p => String(p.id) === String(appt.patientId || appt.patient_id)) || appt.patient || appt.Patient || {};
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
                            <strong className="text-slate-800 block">{getAppointmentDateOnly(appt)}</strong>
                            <span className="text-slate-500 block text-[11px]">Session: {appt.session || 'FN'}</span>
                           </td>
                          <td className="py-3 px-4 align-top min-w-0">
                            <span className="font-bold text-slate-800 block text-sm truncate">{pt.name || 'Unknown Patient'}</span>
                            <span className="text-slate-500 font-medium block truncate">{formatPhoneWithoutCountryCode(pt.phone)} {renderPatientMeta(pt)}</span>
                           </td>
                          <td className="py-3 px-4 align-top whitespace-nowrap">
                            <span className={getAppointmentTypeBadge(appt.appointmentType)}>{appt.appointmentType || 'General'}</span>
                           </td>
                          <td className="py-3 px-4 align-top min-w-0 whitespace-nowrap">
                            <span className="font-semibold text-slate-700 block truncate">
                              {appt?.doctor?.user?.fullName ||
                                appt?.doctor?.name ||
                                appt?.doctor_name ||
                                (() => {
                                  const doctor = allDoctors?.find(d => String(d.id) === String(appt.doctorId || appt.doctor_id));
                                  return doctor?.user?.fullName || doctor?.name || '';
                                })() ||
                                'Not Assigned'}
                            </span>
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
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search available doctor..."
                      value={doctorSearchTerm}
                      onFocus={() => setShowDoctorDropdown(true)}
                      onChange={(e) => {
                        setDoctorSearchTerm(e.target.value);
                        setShowDoctorDropdown(true);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {showDoctorDropdown && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {doctors
                        .filter(d => d.status === 'Available' && (d.user?.fullName || d.name || '').toLowerCase().includes(doctorSearchTerm.toLowerCase()))
                        .map(d => {
                          const doctorName = d.user?.fullName || d.name || `Doctor ${d.id}`;
                          const doctorSpecialty = d.specialization || d.designation || 'General Physician';
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                const update = { doctor_id: d.id };
                                if (d.role === 'THERAPIST') update.appointmentType = getFinalAppointmentType(bookingModalPatient?.id, 'Detox');
                                setModalBookingData({ ...modalBookingData, ...update });
                                setDoctorSearchTerm(`${doctorName} (${doctorSpecialty}) (${d.status})`);
                                setShowDoctorDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 border-b border-slate-50 last:border-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1 truncate">
                                  <span className="font-bold text-slate-800">{doctorName}</span>
                                  <span className="text-slate-500 ml-1 text-xs">({doctorSpecialty})</span>
                                </div>
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap ${
                                  d.status === 'Available' 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                    : 'bg-rose-50 border-rose-200 text-rose-600'
                                }`}>
                                   {d.status}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Appointment Date</label>
                  <input type="date" required value={modalBookingData.date} onChange={e => setModalBookingData({ ...modalBookingData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Appointment Type</label>
                  <select required value={modalBookingData.appointmentType} onChange={e => setModalBookingData({ ...modalBookingData, appointmentType: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500">
                    {doctors.find(d => String(d.id) === String(modalBookingData.doctor_id))?.role === 'THERAPIST' ? (
                      hasCompletedThreeDetoxSessions(bookingModalPatient?.id) ? (
                        <option value="Review">Review</option>
                      ) : (
                        <option value="Detox">Detox</option>
                      )
                    ) : (
                      <>
                        <option value="Initial consultation">Initial Consultation</option>
                        <option value="Detox">Detox</option>
                        <option value="Review">Review</option>
                      </>
                    )}
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