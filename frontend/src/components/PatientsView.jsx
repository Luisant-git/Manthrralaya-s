import React, { useState } from 'react';
import { Search, Plus, UserPlus, Activity, FileText } from 'lucide-react';

export default function PatientsView({ patients, onAddPatient, onSelectPatient }) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Patient Form State
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', age: '', gender: 'Male', blood_group: 'A+', medical_conditions: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPt = {
      ...formData,
      id: `P-${100 + patients.length + 1}`,
      registered_at: new Date().toISOString().split('T')[0]
    };
    onAddPatient(newPt);
    setIsAdding(false);
    setFormData({ name: '', phone: '', email: '', age: '', gender: 'Male', blood_group: 'A+', medical_conditions: '' });
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left max-w-3xl mx-auto">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">New Patient Registration</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Age</label>
                <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Blood Group</label>
                <select value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Medical Conditions / Chief Complaint</label>
                <textarea required rows="3" value={formData.medical_conditions} onChange={e => setFormData({...formData, medical_conditions: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"></textarea>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-sm transition-colors">
                Register Patient
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
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
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Primary Condition</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(pt => (
                  <tr key={pt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-emerald-600">{pt.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{pt.name}</td>
                    <td className="py-3 px-4 text-slate-600">{pt.phone}</td>
                    <td className="py-3 px-4 text-slate-600">{pt.age}y • {pt.gender} • <span className="text-red-500 font-medium">{pt.blood_group}</span></td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]">{pt.medical_conditions}</td>
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
                    <td colSpan="6" className="py-12 text-center text-slate-500">
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
