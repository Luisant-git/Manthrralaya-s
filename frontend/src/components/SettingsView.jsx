import React, { useState, useEffect } from 'react';
import { Settings, Shield, X, Save, Loader2, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { menuPermissionApi } from '../api/menuPermissionApi';
import { toast } from 'react-toastify';

const MENU_GROUPS = [
  {
    key: 'general',
    label: 'General',
    items: [
      { id: 'dashboard', name: 'Dashboard' },
      { id: 'patients', name: 'Patient Directory' },
      { id: 'follow-ups', name: 'Follow-ups' },
      { id: 'change-my-pin', name: 'Change My PIN' },
    ],
  },
  {
    key: 'scheduling',
    label: 'Scheduling & Care',
    items: [
      { id: 'receptionist-desk', name: 'Appointment Booking' },
      { id: 'doctor-master', name: 'Doctor Master' },
      { id: 'doctor-patients', name: 'Doctor Patients' },
      { id: 'appointments', name: 'Appointments' },
      { id: 'consultations', name: 'Consultations' },
      { id: 'my-patient-records', name: 'My Patient Records' },
      { id: 'detox', name: 'Detox Scheduling' },
      { id: 'admission-scheduling', name: 'Admission Scheduling' },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    items: [
      { id: 'user-management', name: 'Staff Management' },
      { id: 'settings', name: 'Settings' },
    ],
  },
];

const ALL_MENUS = MENU_GROUPS.flatMap(g => g.items);

const ROLES = [
  { role: 'ADMIN', label: 'System Admin', icon: Shield },
  { role: 'DOCTOR', label: 'Doctor', icon: Shield },
  { role: 'RECEPTIONIST', label: 'Receptionist', icon: Shield },
  { role: 'THERAPIST', label: 'Therapist', icon: Shield },
];

const createDefaultPermissions = () => {
  const menus = {};
  ALL_MENUS.forEach(m => { menus[m.id] = false; });
  return { menus };
};

const countGranted = (permissions) => {
  const menus = permissions?.menus || {};
  return ALL_MENUS.filter(m => menus[m.id]).length;
};

export default function SettingsView() {
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setFetching(true);
    try {
      const data = await menuPermissionApi.getAll();
      setPermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      toast.error('Failed to fetch menu permissions');
      setPermissions([]);
    } finally {
      setFetching(false);
    }
  };

  const handleEdit = (role) => {
    const existing = permissions.find(p => p.role === role);
    setSelectedRole(role);
    setEditData(existing?.permissions && existing.permissions.menus
      ? { menus: { ...ALL_MENUS.reduce((acc, m) => { acc[m.id] = !!existing.permissions.menus[m.id]; return acc; }, {}) } }
      : createDefaultPermissions());
  };

  const toggleMenu = (menuId) => {
    setEditData(prev => ({
      menus: { ...prev.menus, [menuId]: !prev.menus[menuId] },
    }));
  };

  const toggleGroup = (group) => {
    setEditData(prev => {
      const allOn = group.items.every(item => prev.menus[item.id]);
      const menus = { ...prev.menus };
      group.items.forEach(item => { menus[item.id] = !allOn; });
      return { menus };
    });
  };

  const selectAll = () => {
    const menus = {};
    ALL_MENUS.forEach(m => { menus[m.id] = true; });
    setEditData({ menus });
  };

  const clearAll = () => {
    setEditData(createDefaultPermissions());
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await menuPermissionApi.upsert(selectedRole, editData);
      await fetchPermissions();
      setSelectedRole(null);
      setEditData(null);
      toast.success(`${selectedRole} menu permissions updated successfully`);
    } catch (error) {
      toast.error(error.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const grantedCount = countGranted(permissions.find(p => p.role === selectedRole)?.permissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-outfit flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" /> Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage role-wise menu permissions. Decide which menus each role can see.
          </p>
        </div>
      </div>

      {/* Role permission table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-700">Role-wise Menu Permissions</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{ALL_MENUS.length} menus</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                {MENU_GROUPS.map(group => (
                  <th key={group.key} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-48">{group.label}</th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {ROLES.map(({ role, label, icon: Icon }) => {
                const perm = permissions.find(p => p.role === role);
                const groupAccess = (group) => {
                  const menus = perm?.permissions?.menus || {};
                  return group.items.some(item => menus[item.id]);
                };
                return (
                  <tr key={role} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{label}</div>
                          <div className="text-xs text-slate-400 font-medium">{role}</div>
                        </div>
                      </div>
                    </td>
                    {MENU_GROUPS.map(group => (
                      <td key={group.key} className="px-6 py-4">
                        {groupAccess(group) ? (
                          <Check className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <X className="w-5 h-5 text-rose-400" />
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(role)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit Permissions <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {fetching && (
            <div className="px-6 py-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading permissions...
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {selectedRole && editData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Permissions — {selectedRole}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{grantedCount} menu(s) currently granted</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedRole(null); setEditData(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1">
              {MENU_GROUPS.map(group => {
                const allOn = group.items.every(item => editData.menus[item.id]);
                const someOn = group.items.some(item => editData.menus[item.id]);
                return (
                  <div key={group.key} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allOn}
                        ref={(el) => { if (el) el.indeterminate = someOn && !allOn; }}
                        onChange={() => toggleGroup(group)}
                        className="w-4 h-4 rounded accent-emerald-600"
                      />
                      <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">{group.label}</span>
                    </label>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.items.map(item => (
                        <label key={item.id} className="flex items-center gap-2.5 cursor-pointer select-none px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-emerald-200 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!editData.menus[item.id]}
                            onChange={() => toggleMenu(item.id)}
                            className="w-4 h-4 rounded accent-emerald-600"
                          />
                          <span className={`text-sm font-medium ${editData.menus[item.id] ? 'text-emerald-800' : 'text-slate-500'}`}>
                            {item.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-slate-500 hover:text-emerald-600 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Grant All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedRole(null); setEditData(null); }}
                  disabled={loading}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!fetching && permissions.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-500 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          No custom permissions saved yet. Every role currently sees its default menu set. Click
          <span className="font-bold text-emerald-600 font-medium">Edit Permissions</span> to customize.
        </div>
      )}
    </div>
  );
}