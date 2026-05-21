import React, { useState } from 'react';
import { Stethoscope, Briefcase, Plus, Save, X, Trash2, Edit3, AlertTriangle } from 'lucide-react';

export default function DoctorMasterView({ doctors, setDoctors }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null); // Doctor object currently being edited
  const [deletingDoctor, setDeletingDoctor] = useState(null); // Doctor object currently being deleted

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    status: 'Available'
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    designation: '',
    status: 'Available'
  });

  const handleAddDoctor = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Name is required');
    if (!formData.designation.trim()) return alert('Designation is required');

    const newDoc = {
      id: `DOC-0${doctors.length + 1}`,
      name: formData.name,
      designation: formData.designation,
      status: formData.status
    };

    setDoctors(prev => [...prev, newDoc]);
    setIsAdding(false);
    setFormData({ name: '', designation: '', status: 'Available' });
  };

  const handleStartEdit = (doc) => {
    setEditingDoctor(doc);
    setEditFormData({
      name: doc.name,
      designation: doc.designation,
      status: doc.status
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) return alert('Name is required');
    if (!editFormData.designation.trim()) return alert('Designation is required');

    setDoctors(prev => prev.map(doc => {
      if (doc.id === editingDoctor.id) {
        return {
          ...doc,
          name: editFormData.name,
          designation: editFormData.designation,
          status: editFormData.status
        };
      }
      return doc;
    }));
    setEditingDoctor(null);
  };

  const confirmDeleteDoctor = () => {
    if (deletingDoctor) {
      setDoctors(prev => prev.filter(doc => doc.id !== deletingDoctor.id));
      setDeletingDoctor(null);
    }
  };

  const toggleStatus = (id) => {
    setDoctors(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          status: doc.status === 'Available' ? 'On Leave' : 'Available'
        };
      }
      return doc;
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Doctor Master Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage clinical practitioners, department specialization, and live status.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Register New Doctor
        </button>
      </div>

      {/* Add New Doctor Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg m-0 font-outfit">Register New Doctor</h3>
                <p className="text-emerald-100 text-xs mt-0.5">Add a new clinical practitioner to the system</p>
              </div>
              <button 
                onClick={() => setIsAdding(false)} 
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddDoctor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Dent"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">Specialization / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Naturopathic Lead"
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="Available">Available / Active</option>
                  <option value="On Leave">On Leave / Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                >
                  Register Practitioner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg m-0 font-outfit">Edit Doctor Profile</h3>
                <p className="text-emerald-100 text-xs mt-0.5">Modify details for {editingDoctor.name}</p>
              </div>
              <button 
                onClick={() => setEditingDoctor(null)} 
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Dent"
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">Specialization / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Naturopathic Lead"
                  value={editFormData.designation}
                  onChange={e => setEditFormData({ ...editFormData, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">Availability Status</label>
                <select
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="Available">Available / Active</option>
                  <option value="On Leave">On Leave / Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-rose-600 text-white p-5 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white shrink-0 animate-bounce" />
              <div>
                <h3 className="font-extrabold text-lg m-0 font-outfit">Delete Practitioner?</h3>
                <p className="text-rose-100 text-xs mt-0.5">Confirm permanent removal from system</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Are you sure you want to permanently delete the profile of <strong className="text-slate-800">{deletingDoctor.name}</strong> ({deletingDoctor.designation})? 
              </p>
              <div className="bg-rose-50 p-3 border border-rose-150 rounded-xl text-xs text-rose-800">
                Warning: This action is irreversible. All scheduling availability for this doctor will be removed.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingDoctor(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                >
                  No, Keep Profile
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteDoctor}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Yes, Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(doc => {
          return (
            <div 
              key={doc.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs text-left transition-all hover:shadow-md flex flex-col justify-between min-h-[180px] ${
                doc.status === 'Available' ? 'border-slate-200' : 'border-rose-100 bg-rose-50/10'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => toggleStatus(doc.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border tracking-wider transition-colors ${
                      doc.status === 'Available' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    }`}
                    title="Click to toggle availability status"
                  >
                    {doc.status}
                  </button>
                </div>

                <div className="mt-4">
                  <h4 className="font-extrabold text-slate-800 text-base">{doc.name}</h4>
                  <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5 font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {doc.designation}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase">
                <span>ID: {doc.id}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleStartEdit(doc)}
                    className="text-emerald-600 hover:text-emerald-700 font-bold tracking-wider flex items-center gap-1 text-[11px]"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => setDeletingDoctor(doc)}
                    className="text-rose-600 hover:text-rose-700 font-bold tracking-wider flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
