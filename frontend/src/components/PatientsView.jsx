import React, { useState } from 'react';
import { Search, Plus, UserPlus, Activity, FileText } from 'lucide-react';

export default function PatientsView({ patients, appointments = [], onAddPatient, onSelectPatient }) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  
  const appointmentTabs = [
    { id: 'all', label: 'All' },
    { id: 'consultation', label: 'Consultation', type: 'Initial consultation' },
    { id: 'detox', label: 'Detox', type: 'Detox' },
    { id: 'followup', label: 'Follow-up', type: 'Review' }
  ];

  const getLatestAppointmentType = (patientId) => {
    const sorted = appointments
      .filter(a => a.patient_id === patientId && a.appointmentType)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0]?.appointmentType || 'No appointment type';
  };

  const matchesTypeFilter = (patient) => {
    if (selectedTab === 'all') return true;
    const tab = appointmentTabs.find(t => t.id === selectedTab);
    if (!tab) return true;
    return appointments.some(appt => appt.patient_id === patient.id && appt.appointmentType === tab.type);
  };

  // New Patient Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    location: '',
    address: '',
    phone: '',
    phoneAsWhatsapp: true,
    whatsapp: '',
    medical_conditions: ''
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPt = {
      id: `P-${100 + patients.length + 1}`,
      name: formData.name,
      age: parseInt(formData.age) || 30,
      gender: 'Other',
      blood_group: 'O+',
      phone: formData.phone,
      whatsapp: formData.phoneAsWhatsapp ? formData.phone : formData.whatsapp,
      location: formData.location,
      address: formData.address || 'n/a',
      medical_conditions: formData.medical_conditions || 'Registered via Intake form',
      email: 'n/a',
      registered_at: new Date().toISOString().split('T')[0]
    };
    onAddPatient(newPt);
    setIsAdding(false);
    setFormData({
      name: '',
      age: '',
      location: '',
      address: '',
      phone: '',
      phoneAsWhatsapp: true,
      whatsapp: '',
      medical_conditions: ''
    });
  };

  const filteredPatients = patients.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    matchesTypeFilter(p)
  );

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
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          {isAdding ? <FileText className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'View Directory' : 'New Intake Registration'}
        </button>
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

            <div className="grid grid-cols-2 gap-4">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm"
              >
                Register Intake Record
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

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID or phone number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
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
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(pt => (
                  <tr key={pt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-emerald-600">{pt.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{pt.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pt.phone}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pt.whatsapp || pt.phone}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {getLatestAppointmentType(pt.id)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pt.age}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pt.location || 'n/a'}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium max-w-[150px] truncate" title={pt.address}>{pt.address || 'n/a'}</td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={() => onSelectPatient(pt)}
                        className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-emerald-200"
                      >
                        <Activity className="w-4 h-4" /> Timeline
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-500">
                      No patients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
