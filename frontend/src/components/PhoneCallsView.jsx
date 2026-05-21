import React, { useState } from 'react';
import { PhoneCall, CalendarPlus, CheckCircle, Search } from 'lucide-react';

export default function PhoneCallsView({ phoneCalls, onAddCall, onBookFromCall }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    patient_name: '', phone: '', notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCall = {
      ...formData,
      id: `CALL-${500 + phoneCalls.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      time: '11:00 AM',
      status: 'Inquiry'
    };
    onAddCall(newCall);
    setFormData({ patient_name: '', phone: '', notes: '' });
  };

  const filteredCalls = phoneCalls.filter(c => 
    c.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Inquiries & Phone Leads
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Log incoming patient queries and convert leads to clinic appointments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Log New Call Form */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-5">
            <PhoneCall className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Log Incoming Call</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Caller Name</label>
              <input required type="text" value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Inquiry Details</label>
              <textarea required rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"></textarea>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm">
              Save Lead
            </button>
          </form>
        </div>

        {/* Lead Registry Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Call Directory</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-3 px-4">Date/Time</th>
                  <th className="py-3 px-4">Caller</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCalls.map(call => (
                  <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{call.date}</span>
                      <span className="text-slate-500 text-xs">{call.time}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{call.patient_name}</span>
                      <span className="text-slate-500 text-xs">{call.phone}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {call.notes}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {call.status === 'Booked' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle className="w-4 h-4" /> Booked
                        </span>
                      ) : (
                        <button 
                          onClick={() => onBookFromCall(call)}
                          className="bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-300 font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs shadow-sm"
                        >
                          <CalendarPlus className="w-4 h-4" /> Convert to Appt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCalls.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-500 text-sm">
                      No calls found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
