import React, { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, Activity, FileText, Eye, X, Loader2, RefreshCw } from 'lucide-react';
import { getAllPatients, createPatient } from '../api/patientApi';
import { toast } from 'react-toastify';

import { updateReceptionistFollowup } from '../api/consultationApi';

export default function PatientsView({ appointments = [], followups = [], consultations = [], onAddPatient, onSelectPatient }) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [viewingPatient, setViewingPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const appointmentTabs = [
    { id: 'all', label: 'All' },
    { id: 'consultation', label: 'Consultation', type: 'Initial consultation' },
    { id: 'detox', label: 'Detox', type: 'Detox' },
    { id: 'followup', label: 'Follow-up', type: 'Followup' }
  ];

  // Fetch patients from backend
  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllPatients();
      const patientsData = Array.isArray(response) ? response : response.data || [];
      setPatients(patientsData);
      console.log('Patients fetched:', patientsData);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const getLatestAppointmentType = (patientId) => {
    const sorted = appointments
      .filter(a => a.patientId === patientId && a.appointmentType)
      .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    return sorted[0]?.appointmentType || 'No appointment type';
  };

  const getNextFollowup = (patientId) => {
    return followups
      .filter(f => f.patient_id === patientId && f.status === 'Pending')
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0] || null;
  };

  const matchesTypeFilter = (patient) => {
    if (selectedTab === 'all') return true;
    const tab = appointmentTabs.find(t => t.id === selectedTab);
    if (!tab) return true;
    if (tab.id === 'followup') {
      return followups.some(f => f.patient_id === patient.id && f.status === 'Pending');
    }
    return appointments.some(appt => appt.patientId === patient.id && appt.appointmentType === tab.type);
  };

  // New Patient Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    location: '',
    address: '',
    phone: '',
    phoneAsWhatsapp: true,
    whatsapp: '',
    medical_conditions: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isUpdatingFollowup, setIsUpdatingFollowup] = useState(false);
  const [receptionistEditMode, setReceptionistEditMode] = useState(false);
  const [receptionistFollowupDate, setReceptionistFollowupDate] = useState('');
  const [receptionistFollowupNotes, setReceptionistFollowupNotes] = useState('');
  const [receptionistChecked, setReceptionistChecked] = useState(false);

  // Editing modal state (per-row follow-up editor)
  const [editingPatient, setEditingPatient] = useState(null);
  const [editingConsultationId, setEditingConsultationId] = useState(null);
  const [editingFollowupDate, setEditingFollowupDate] = useState('');
  const [editingFollowupNotes, setEditingFollowupNotes] = useState('');
  const [editingFollowupStatus, setEditingFollowupStatus] = useState('Pending');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) { toast.warn('Patient Name is required.'); return; }
    if (!formData.age) { toast.warn('Age is required.'); return; }
    if (!formData.gender) { toast.warn('Gender is required.'); return; }
    if (!formData.location.trim()) { toast.warn('Location is required.'); return; }
    if (!formData.phone.trim()) { toast.warn('Phone Number is required.'); return; }
    
    setIsSubmitting(true);
    
    try {
      const newPatient = await createPatient({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        whatsapp: formData.phoneAsWhatsapp ? formData.phone : formData.whatsapp,
        location: formData.location,
        address: formData.address || '',
        medical_conditions: formData.medical_conditions || ''
      });
      
      await fetchPatients();
      
      if (onAddPatient) {
        onAddPatient(newPatient);
      }
      
      setIsAdding(false);
      setFormData({
        name: '',
        age: '',
        gender: '',
        location: '',
        address: '',
        phone: '',
        phoneAsWhatsapp: true,
        whatsapp: '',
        medical_conditions: ''
      });
      toast.success('Patient registered successfully!');
    } catch (err) {
      console.error('Error creating patient:', err);
      toast.error(err.message || 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  // When viewingPatient changes, prefill receptionist followup fields from consultations
  useEffect(() => {
    if (!viewingPatient) return;
    const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(viewingPatient.id));
    const latestCons = [...ptCons].sort((a, b) => new Date(b.consultationDate || b.date || b.followup_date || 0) - new Date(a.consultationDate || a.date || a.followup_date || 0))[0];
    const rec = latestCons?.receptionistFollowup || latestCons?.receptionist_followup || null;
    setReceptionistFollowupDate(rec?.followupDate || rec?.followup_date || latestCons?.followup_date || latestCons?.followupDate || '');
    setReceptionistFollowupNotes(rec?.notes || rec?.notes_text || latestCons?.followup_remarks || latestCons?.followupRemarks || '');
    setReceptionistChecked(Boolean(rec));
  }, [viewingPatient, consultations]);

  const filteredPatients = patients.filter(p => 
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm) ||
    p.id?.toString().includes(searchTerm)) &&
    matchesTypeFilter(p)
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
        <span className="text-slate-500">Loading patients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-rose-600 mb-4">{error}</div>
        <button 
          onClick={fetchPatients} 
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Patient Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage patient intakes, demographics, and clinical records.
          </p>
        </div>
        {/* <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          {isAdding ? <FileText className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'View Directory' : 'New Intake Registration'}
        </button> */}
      </div>

      {isAdding ? (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left max-w-2xl mx-auto">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">New Patient Registration</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Patient Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Patient Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jessica Smith"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 29"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Address</label>
              <input
                type="text"
                placeholder="Full residential address (optional)"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Phone No */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Checkbox: click phone as whatsapp */}
            <div className="flex items-center space-x-2.5 py-1">
              <input
                id="phoneAsWhatsappIntake"
                type="checkbox"
                checked={formData.phoneAsWhatsapp}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="phoneAsWhatsappIntake" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                Use Phone number as WhatsApp number
              </label>
            </div>

            {/* WhatsApp Input (Only if checkbox is false) */}
            {!formData.phoneAsWhatsapp && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required={!formData.phoneAsWhatsapp}
                  placeholder="WhatsApp No with country code"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
            )}

            {/* Primary Medical Conditions */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Primary Medical Conditions</label>
              <textarea
                rows="2"
                placeholder="Patient symptoms, specific requests, or details..."
                value={formData.medical_conditions}
                onChange={e => setFormData({ ...formData, medical_conditions: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all font-medium"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Registering...' : 'Register Intake Record'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-4 pt-4 pb-2 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-wrap gap-2">
              {appointmentTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar with Clear Icon */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID or phone number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone No</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Age</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Next Follow-up Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(pt => (
                  <tr key={pt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-emerald-600">P-{pt.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{pt.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pt.phone?.replace(/\D/g, '').slice(-10)}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{(pt.whatsapp || pt.phone)?.replace(/\D/g, '').slice(-10)}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {getLatestAppointmentType(pt.id)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pt.age}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pt.gender || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pt.location || 'n/a'}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium max-w-[200px] truncate">
                      {getNextFollowup(pt.id)?.scheduled_date || 'No follow-up'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => setViewingPatient(pt)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-blue-200"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                        <button
                          onClick={() => {
                            console.log('Edit click for patient', pt.id);
                            // open edit modal for this patient immediately
                            setEditingPatient(pt);

                            // prefill editing fields defensively
                            try {
                              const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(pt.id));
                              const latestCons = [...ptCons].sort((a,b)=> new Date(b.consultationDate || b.date || b.followup_date || 0) - new Date(a.consultationDate || a.date || a.followup_date || 0))[0];
                              const rec = latestCons?.receptionistFollowup || latestCons?.receptionist_followup || null;
                              setEditingConsultationId(latestCons?.id || latestCons?.consultationId || latestCons?.consultation_id || null);
                              setEditingFollowupDate(rec?.followupDate || rec?.followup_date || latestCons?.followup_date || latestCons?.followupDate || '');
                              setEditingFollowupNotes(rec?.notes || latestCons?.followup_remarks || latestCons?.followupRemarks || '');
                              setEditingFollowupStatus(rec?.status || 'Pending');
                            } catch (err) {
                              console.error('Error preparing followup edit:', err);
                              setEditingConsultationId(null);
                              setEditingFollowupDate('');
                              setEditingFollowupNotes('');
                              setEditingFollowupStatus('Pending');
                            }
                          }}
                          className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-semibold px-2 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-slate-200"
                        >
                          <Activity className="w-4 h-4" /> Edit
                        </button>
                        <button 
                          onClick={() => onSelectPatient && onSelectPatient(pt)}
                          className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-emerald-200"
                        >
                          <Activity className="w-4 h-4" /> Timeline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-500">
                      No patients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Patient Details Modal */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden text-left animate-scaleIn">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                  {viewingPatient.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{viewingPatient.name}</h2>
                  <p className="text-slate-500 text-sm font-medium">P-{viewingPatient.id} • Registered {viewingPatient.createdAt ? new Date(viewingPatient.createdAt).toISOString().split('T')[0] : 'N/A'}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPatient(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">Personal Information</h3>
              <ul className="mb-4">
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Age</span>
                  <span className="font-medium text-slate-800 text-sm">{viewingPatient.age || 'N/A'} yrs</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Gender</span>
                  <span className="font-medium text-slate-800 text-sm">{viewingPatient.gender || 'N/A'}</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Phone Number</span>
                  <span className="font-medium text-slate-800 text-sm">{viewingPatient.phone?.replace(/\D/g, '').slice(-10) || 'N/A'}</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">WhatsApp</span>
                  <span className="font-medium text-slate-800 text-sm">{(viewingPatient.whatsapp || viewingPatient.phone)?.replace(/\D/g, '').slice(-10) || 'N/A'}</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Location</span>
                  <span className="font-medium text-slate-800 text-sm">{viewingPatient.location || 'N/A'}</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-start sm:items-center py-1 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Address</span>
                  <span className="font-medium text-slate-800 text-sm sm:text-right sm:max-w-[70%]">{viewingPatient.address || 'N/A'}</span>
                </li>
              </ul>

              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">Clinical Details</h3>
              <ul className="mb-4">
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Appointment Type</span>
                  <span className="font-medium text-slate-800 text-sm">{getLatestAppointmentType(viewingPatient.id)}</span>
                </li>
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 uppercase mb-1 sm:mb-0">Next Follow-up Date</span>
                  <span className="font-medium text-slate-800 text-sm">{getNextFollowup(viewingPatient.id)?.scheduled_date || 'No follow-up'}</span>
                </li>
              </ul>
              {/* Receptionist edit controls */}
              <div className="mb-4">
                <button
                  onClick={() => setReceptionistEditMode(prev => !prev)}
                  className="text-sm text-emerald-600 font-semibold underline mb-2"
                >
                  {receptionistEditMode ? 'Cancel follow-up edit' : 'Edit follow-up (Receptionist)'}
                </button>

                {receptionistEditMode && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={receptionistChecked} onChange={e => setReceptionistChecked(e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm font-medium text-slate-700">Mark as receptionist-updated</span>
                    </label>

                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <input
                        type="date"
                        value={receptionistFollowupDate ? new Date(receptionistFollowupDate).toISOString().split('T')[0] : ''}
                        onChange={e => setReceptionistFollowupDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Short notes"
                        value={receptionistFollowupNotes}
                        onChange={e => setReceptionistFollowupNotes(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={async () => {
                          // find latest consultation id for this patient
                          const ptCons = consultations.filter(c => String(c.patient_id || c.patientId) === String(viewingPatient.id));
                          const latestCons = [...ptCons].sort((a, b) => new Date(b.consultationDate || b.date || b.followup_date || 0) - new Date(a.consultationDate || a.date || a.followup_date || 0))[0];
                          if (!latestCons) {
                            toast.error('No consultation found to attach follow-up to.');
                            return;
                          }
                          const consultationId = latestCons.id || latestCons.consultationId || latestCons.consultation_id;
                          if (!consultationId) {
                            toast.error('Consultation identifier not available.');
                            return;
                          }
                          setIsUpdatingFollowup(true);
                          try {
                            await updateReceptionistFollowup(consultationId, {
                              followupDate: receptionistFollowupDate || undefined,
                              notes: receptionistFollowupNotes || undefined,
                              receptionistUpdated: receptionistChecked
                            });
                            toast.success('Receptionist follow-up updated');
                            // refresh patient list
                            await fetchPatients();
                            setReceptionistEditMode(false);
                          } catch (err) {
                            console.error(err);
                            toast.error(err.message || 'Failed to update follow-up');
                          } finally {
                            setIsUpdatingFollowup(false);
                          }
                        }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                        disabled={isUpdatingFollowup}
                      >
                        {isUpdatingFollowup ? 'Saving...' : 'Save Follow-up'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Follow-up Modal (separate neat UI) */}
                {editingPatient && (
                  <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-left">
                      <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <h3 className="text-lg font-bold">Edit Follow-up — {editingPatient.name}</h3>
                        <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded"> <X className="w-5 h-5"/> </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Status</label>
                          <select value={editingFollowupStatus} onChange={e=>setEditingFollowupStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Follow-up Date</label>
                          <input type="date" value={editingFollowupDate ? new Date(editingFollowupDate).toISOString().split('T')[0] : ''} onChange={e=>setEditingFollowupDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Notes</label>
                          <textarea rows={3} value={editingFollowupNotes} onChange={e=>setEditingFollowupNotes(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
                        </div>
                      </div>
                      <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                        <button className="text-rose-600 font-semibold" onClick={async ()=>{
                          // remove followup (set null)
                          if (!editingConsultationId) { toast.error('No consultation to remove follow-up from'); return; }
                          try {
                            setIsUpdatingFollowup(true);
                            await updateReceptionistFollowup(editingConsultationId, { followupDate: null, notes: null, status: 'Pending' });
                            toast.success('Follow-up removed');
                            await fetchPatients();
                            setEditingPatient(null);
                          } catch (err) {
                            toast.error(err.message || 'Failed to remove follow-up');
                          } finally { setIsUpdatingFollowup(false); }
                        }}>Remove Follow-up</button>
                        <div className="flex items-center gap-2">
                          <button onClick={()=>setEditingPatient(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg">Cancel</button>
                          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg" onClick={async ()=>{
                            if (!editingConsultationId) { toast.error('No consultation available to save'); return; }
                            try {
                              setIsUpdatingFollowup(true);
                              await updateReceptionistFollowup(editingConsultationId, { followupDate: editingFollowupDate || undefined, notes: editingFollowupNotes || undefined, status: editingFollowupStatus || undefined });
                              toast.success('Follow-up saved');
                              await fetchPatients();
                              setEditingPatient(null);
                            } catch (err) {
                              console.error(err);
                              toast.error(err.message || 'Failed to save follow-up');
                            } finally { setIsUpdatingFollowup(false); }
                          }}>{isUpdatingFollowup ? 'Saving...' : 'Save'}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Primary Medical Conditions / Notes</span>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {viewingPatient.medical_conditions || 'No specific medical conditions recorded.'}
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setViewingPatient(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}