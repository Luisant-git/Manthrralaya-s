import React, { useState, useEffect } from 'react';
import { 
    UserPlus, Mail, Lock, User, Shield, CheckCircle, AlertCircle, 
    Search, Filter, Trash2, Power, UserCheck, Stethoscope, Phone, 
    ArrowLeft, Briefcase, Edit2, Key, X, AlertTriangle , Eye, 
    EyeOff
} from 'lucide-react';
import { userApi } from '../api/userApi';

export default function UserManagementView() {
    const [staff, setStaff] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('RECEPTIONIST');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [resetPinUser, setResetPinUser] = useState(null);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isReseting, setIsReseting] = useState(false);
    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [resetFeedback, setResetFeedback] = useState({ error: '', success: false });

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: 'RECEPTIONIST',
        pin: '',
        phone: '',
        specialization: ''
    });
    
    const [status, setStatus] = useState({ loading: false, error: '', success: false });

    useEffect(() => {
        loadStaff();
    }, [activeFilter]);

    const loadStaff = async () => {
        try {
            const response = await userApi.getUsersByRole(activeFilter);
            setStaff(response.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await userApi.updateStatus(userId, !currentStatus);
            loadStaff();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEditClick = (staffItem) => {
        const user = staffItem.user || staffItem;
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role || 'RECEPTIONIST',
            pin: '', // Keep empty unless changing
            phone: user.phone || '',
            specialization: staffItem.specialization || ''
        });
        setEditingId(user.id);
        setShowAddForm(true);
    };

    const handleDeleteStaff = async (userId) => {
        if (!window.confirm('Are you sure you want to deactivate this staff member?')) return;
        try {
            await userApi.deleteUser(userId);
            loadStaff();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!formData.fullName.trim() || !formData.email.trim() || !formData.pin.trim()) {
            return setStatus({ ...status, error: 'All fields are required.' });
        }

        setStatus({ loading: true, error: '', success: false });
        try {
            if (editingId) {
                await userApi.updateUser(editingId, formData);
            } else {
                await userApi.createUser(formData.role, formData);
            }
            
            setStatus({ loading: false, error: '', success: true, message: editingId ? 'Staff updated' : 'Staff created' });
            setFormData({ fullName: '', email: '', role: 'RECEPTIONIST', pin: '', phone: '', specialization: '' });
            setEditingId(null);
            setShowAddForm(false);
            loadStaff();
            
            setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 5000);
        } catch (err) {
            setStatus({ loading: false, error: err.message || 'Failed to create user. Please try again.', success: false });
        }
    };

const handleResetPinSubmit = async (e) => {
    e.preventDefault();
    setResetFeedback({ error: '', success: false });

    // Validate PIN
    if (newPin.length !== 4 || isNaN(newPin)) {
        return setResetFeedback({ error: 'PIN must be exactly 4 digits.', success: false });
    }

    // Check if PINs match
    if (newPin !== confirmPin) {
        return setResetFeedback({ error: 'PINs do not match. Please re-enter.', success: false });
    }

    setIsReseting(true);
    try {
        await userApi.resetPin(resetPinUser.id, newPin);
        setResetFeedback({ error: '', success: true });
        setNewPin('');
        setConfirmPin('');
        loadStaff(); // Refresh the list
        
        // Auto-close modal after success
        setTimeout(() => {
            setResetPinUser(null);
            setResetFeedback({ error: '', success: false });
        }, 2000);
    } catch (err) {
        setResetFeedback({ error: err.message || 'Failed to update PIN', success: false });
    } finally {
        setIsReseting(false);
    }
};
    const filteredStaff = staff.filter(s => {
        const user = s.user || s; // Backend returns different structures for Doctor vs User
        return user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
               user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Management</h1>
                    <p className="text-slate-500 text-sm">Manage clinic personnel, access roles, and account security.</p>
                </div>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    {showAddForm ? 'View Staff List' : 'Add New Staff'}
                </button>
            </div>

            {!showAddForm ? (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                    {/* Search and Filters */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all"
                            />
                        </div>
                        <div className="flex bg-white border border-slate-200 p-1 rounded-xl">
                            {['RECEPTIONIST', 'DOCTOR'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => setActiveFilter(role)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === role ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff Member</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                           <tbody className="divide-y divide-slate-50">
    {filteredStaff.map((item) => {
        const user = item.user || item;
        return (
            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-600 text-xs border border-emerald-100">
                            {user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-800">{user.fullName}</div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">{user.role}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 font-medium">{user.email}</div>
                    <div className="text-xs text-slate-400">{user.phone || 'No phone'}</div>
                </td>
                <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        {/* Edit Button */}
                        <button 
                            onClick={() => handleEditClick(item)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Details"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {/* Reset PIN Button */}
                        <button 
                            onClick={() => setResetPinUser(user)}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Reset PIN"
                        >
                            <Key className="w-4 h-4" />
                        </button>
                        
                        {/* Toggle Status Button */}
                        <button 
                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                        >
                            <Power className="w-4 h-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button 
                            onClick={() => handleDeleteStaff(user.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    })}
</tbody>
                        </table>
                        {filteredStaff.length === 0 && (
                            <div className="py-12 text-center text-slate-400 text-sm">No staff members found matching your filters.</div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto animate-fadeIn">
                    <button 
                        onClick={() => { setShowAddForm(false); setEditingId(null); }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Staff List
                    </button>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-6">
                            {editingId ? <Edit2 className="w-5 h-5 text-emerald-600" /> : <UserPlus className="w-5 h-5 text-emerald-600" />}
                            <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Staff Profile' : 'New Staff Registration'}</h2>
                        </div>

                        {status.error && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" /> {status.error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                    Full Legal Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    placeholder="e.g. Sarah Jenkins"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                        Assigned Work Role <span className="text-rose-500">*</span>
                                    </label>
                                    <select 
                                        name="role" 
                                        disabled={!!editingId} // Role shouldn't be changed after creation for data integrity
                                        value={formData.role} 
                                        onChange={handleChange} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium cursor-pointer"
                                    >
                                        <option value="RECEPTIONIST">Receptionist</option>
                                        <option value="DOCTOR">Doctor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                        Phone Number <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                    Official Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="staff@manthrralayas.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                />
                            </div>

                            {formData.role === 'DOCTOR' && (
                                <div className="animate-fadeIn">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                        Medical Specialization <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="specialization"
                                        required
                                        placeholder="e.g. Naturopathic Lead"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                                    />
                                </div>
                            )}

                            {!editingId && (
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                        Security Access PIN (4 Digits) <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        type="password" 
                                        name="pin" 
                                        required 
                                        maxLength={4} 
                                        placeholder="••••" 
                                        value={formData.pin} 
                                        onChange={handleChange} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-lg text-slate-800 text-center tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end pt-4 gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => { setShowAddForm(false); setEditingId(null); }} 
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-6 rounded-lg text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={status.loading} 
                                    className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm ${status.loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {status.loading ? 'Processing...' : (editingId ? 'Update Staff Record' : 'Register Staff Record')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

         {/* PIN Reset Modal - Matching Doctor Master Design */}
{resetPinUser && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
        <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            {/* Header - Enhanced with bold text */}
            <div className="bg-emerald-600 text-white p-5">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="font-extrabold text-lg m-0 font-outfit">Reset Access PIN</h3>
                        <p className="text-white-100 text-xs mt-1">
                            Security credentials update for{' '}
                            <span className="font-bold text-white">
                                {resetPinUser.role}: {resetPinUser.fullName}
                            </span>
                        </p>
                    </div>
                    <button 
                        onClick={() => { 
                            setResetPinUser(null); 
                            setNewPin(''); 
                            setConfirmPin(''); 
                            setResetFeedback({ error: '', success: false }); 
                        }} 
                        className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
   
            
            <form onSubmit={handleResetPinSubmit} className="p-6 space-y-5">
                {resetFeedback.success ? (
                    // Success State
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h4 className="font-extrabold text-lg text-slate-800">PIN Reset Successful!</h4>
                        <p className="text-sm text-slate-500 mt-2">
                            New PIN has been set for {resetPinUser.fullName}
                        </p>
                        <button
                            type="button"
                            onClick={() => { 
                                setResetPinUser(null); 
                                setNewPin(''); 
                                setConfirmPin(''); 
                                setResetFeedback({ error: '', success: false }); 
                            }}
                            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Error Message */}
                        {resetFeedback.error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {resetFeedback.error}
                            </div>
                        )}

                        {/* New PIN Field with Eye Toggle */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">
                                New PIN <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input 
                                    type={showNewPin ? "text" : "password"}
                                    required 
                                    maxLength={4} 
                                    autoFocus
                                    placeholder="••••" 
                                    value={newPin} 
                                    onChange={(e) => {
                                        setNewPin(e.target.value);
                                        setConfirmPin(''); // Reset confirm when new PIN changes
                                        setResetFeedback({ error: '', success: false });
                                    }} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl text-slate-800 text-center tracking-[0.5em] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPin(!showNewPin)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">Enter 4-digit numeric code</p>
                        </div>

                        {/* Confirm PIN Field with Eye Toggle */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-outfit">
                                Confirm New PIN <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPin ? "text" : "password"}
                                    required 
                                    maxLength={4} 
                                    placeholder="••••" 
                                    value={confirmPin} 
                                    onChange={(e) => {
                                        setConfirmPin(e.target.value);
                                        setResetFeedback({ error: '', success: false });
                                    }} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl text-slate-800 text-center tracking-[0.5em] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* PIN Match Indicator - Dynamic */}
                        {newPin && confirmPin && (
                            <div className={`text-sm font-bold flex items-center justify-center gap-2 py-2 rounded-lg ${
                                newPin === confirmPin 
                                    ? 'text-emerald-600 bg-emerald-50' 
                                    : 'text-rose-600 bg-rose-50'
                            }`}>
                                {newPin === confirmPin ? (
                                    <>
                                       
                                        <span>✓ PIN codes match</span>
                                    </>
                                ) : (
                                    <>
                                        
                                        <span>✗ PIN codes do not match</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Validation Tips */}
                        {newPin && newPin.length !== 4 && (
                            <div className="text-amber-600 text-xs flex items-center gap-1 justify-center">
                                <AlertCircle className="w-3 h-3" />
                                PIN must be exactly 4 digits
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => { 
                                    setResetPinUser(null); 
                                    setNewPin(''); 
                                    setConfirmPin(''); 
                                    setResetFeedback({ error: '', success: false }); 
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    isReseting || 
                                    !newPin || 
                                    !confirmPin || 
                                    newPin !== confirmPin || 
                                    newPin.length !== 4
                                }
                                className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2 ${
                                    (isReseting || !newPin || !confirmPin || newPin !== confirmPin || newPin.length !== 4) 
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'hover:shadow-md'
                                }`}
                            >
                                {isReseting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        <Key className="w-4 h-4" />
                                        Reset PIN
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    </div>
)}
        </div>
    );
}