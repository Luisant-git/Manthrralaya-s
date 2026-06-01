import React, { useState, useEffect } from 'react';
import { Stethoscope, Briefcase, Save, X, Trash2, Edit3, AlertTriangle, RefreshCw, Loader2, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { userApi } from '../api/userApi';

export default function DoctorMasterView() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null); // Doctor object currently being edited
  const [deletingDoctor, setDeletingDoctor] = useState(null); // Doctor object currently being deleted

  // Search, Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Available', 'On Leave'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    designation: '',
    status: 'Available'
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getUsersByRole('DOCTOR');
      setDoctors(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to synchronize doctor directory.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter doctors based on search and status filter
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = !searchTerm.trim() ||
      doc.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStartEdit = (doc) => {
    setEditingDoctor(doc);
    setEditFormData({
      fullName: doc.user?.fullName || '',
      designation: doc.specialization || '',
      status: doc.status
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    try {
      await userApi.updateUser(editingDoctor.user.id, {
        fullName: editingDoctor.user.fullName,
        specialization: editingDoctor.specialization,
        status: editFormData.status,
        email: editingDoctor.user.email,
        role: 'DOCTOR',
        phone: editingDoctor.user.phone
      });
      setEditingDoctor(null);
      loadDoctors();
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmDeleteDoctor = async () => {
    if (deletingDoctor) {
      try {
        await userApi.deleteUser(deletingDoctor.user.id);
        setDeletingDoctor(null);
        loadDoctors();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const toggleStatus = async (doctorId, currentStatus) => {
    const newStatus = currentStatus === 'Available' ? 'On Leave' : 'Available';
    try {
      await userApi.updateDoctorStatus(doctorId, newStatus);
      await loadDoctors();
    } catch (err) {
      console.error('Status update error:', err);
      alert(err.message || 'Failed to update doctor status');
    }
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
            View clinical practitioners and manage availability status.
          </p>
        </div>
        <button 
          onClick={loadDoctors}
          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
          title="Refresh List"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Edit Doctor Modal - Name & Specialization READ-ONLY */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg m-0 font-outfit">Edit Doctor Profile</h3>
                <p className="text-emerald-100 text-xs mt-0.5">Modify details for {editingDoctor.user?.fullName}</p>
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
                  disabled
                  value={editFormData.fullName}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 font-medium cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">Name cannot be edited</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">Specialization / Designation</label>
                <input
                  type="text"
                  disabled
                  value={editFormData.designation}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 font-medium cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">Specialization cannot be edited</p>
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
                Are you sure you want to permanently delete the profile of <strong className="text-slate-800">{deletingDoctor.user?.fullName}</strong> ({deletingDoctor.specialization})? 
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

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <p className="font-medium">Syncing clinical records...</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <p className="text-slate-500">{error}</p>
          <button onClick={loadDoctors} className="mt-4 text-emerald-600 font-bold hover:underline">Try Again</button>
        </div>
      ) : (
        <>
          {/* Search and Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input with Clear Icon */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search doctors by name, specialization or ID..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Status Filter Dropdown */}
                <div className="relative w-full sm:w-48">
                  <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={e => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="Available">Available</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Doctors Grid with #F1F5F9 Background */}
            <div className="p-4 bg-slate-100">
              {paginatedDoctors.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-white rounded-xl">
                  <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No doctors found matching your search.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedDoctors.map(item => {
                      const doc = item;
                      const user = item.user || {};
                      return (
                        <div 
                          key={item.id}
                          className={`bg-white border rounded-2xl p-5 shadow-sm text-left transition-all hover:shadow-md flex flex-col justify-between min-h-[180px] ${
                            doc.status === 'Available' ? 'border-slate-200' : 'border-rose-100 bg-rose-50/10'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <Stethoscope className="w-5 h-5" />
                              </div>
                              <button
                                onClick={() => toggleStatus(item.id, doc.status)}
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
                              <h4 className="font-extrabold text-slate-800 text-base">{user.fullName}</h4>
                              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5 font-medium">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {doc.specialization}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase">
                            <span>Doc ID: {item.id}</span>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleStartEdit(item)}
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
                      <p className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredDoctors.length)}</span> of <span className="font-semibold text-slate-800">{filteredDoctors.length}</span> doctors
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => goToPage(pageNum)}
                                className={`w-10 h-10 rounded-xl text-sm font-semibold transition ${
                                  currentPage === pageNum 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}