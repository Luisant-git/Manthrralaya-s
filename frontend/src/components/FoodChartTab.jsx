import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, Utensils, Plus, Trash2, Save } from 'lucide-react';
import { createFoodChart, getFoodChartsByPatient, updateFoodChart } from '../api/foodChartApi';
import { toast } from 'react-toastify';

export default function FoodChartTab({ consultation, patient }) {
  const [foodCharts, setFoodCharts] = useState([]);
  const [isLoadingFoodCharts, setIsLoadingFoodCharts] = useState(false);
  const [newEntries, setNewEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryData, setDeliveryData] = useState({});
  const bottomRef = useRef(null);

  const loadFoodCharts = async (pId) => {
    setIsLoadingFoodCharts(true);
    try {
      const data = await getFoodChartsByPatient(pId);
      // Sort by date desc, time desc
      const sortedData = (data || []).sort((a, b) => {
        if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
        return b.time.localeCompare(a.time);
      });
      setFoodCharts(sortedData);
    } catch (err) {
      toast.error('Error loading food charts');
    }
    setIsLoadingFoodCharts(false);
  };

  useEffect(() => {
    if (patient && (patient.id || patient.patient_id || patient.patientId)) {
      const pId = patient.id || patient.patient_id || patient.patientId;
      loadFoodCharts(pId);
      setNewEntries([]);
      setDeliveryData({});
    } else {
      setFoodCharts([]);
    }
  }, [patient]);

  const handleSaveAll = async () => {
    setIsSubmitting(true);
    let successCount = 0;
    try {
      for (const entry of newEntries) {
        if (entry.date && entry.time && entry.food) {
          await createFoodChart({
            patientId: patient.id || patient.patient_id || patient.patientId,
            consultationId: consultation.id,
            date: entry.date,
            time: entry.time,
            food: entry.food
          });
          successCount++;
        }
      }
      for (const fc of foodCharts) {
        const dData = deliveryData[fc.id];
        if (!fc.isDelivered && dData?.providedTime) {
          await updateFoodChart(fc.id, {
            isDelivered: true,
            providedTime: dData.providedTime,
            remarks: dData.remarks
          });
          successCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`Successfully saved ${successCount} entries`);
      }
      setNewEntries([]);
      const pId = patient.id || patient.patient_id || patient.patientId;
      if (pId) loadFoodCharts(pId);
    } catch (err) {
      toast.error(err.message || 'Error saving food chart');
    }
    setIsSubmitting(false);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  };

  if (!consultation) {
    return <div className="p-6 text-center text-slate-500 font-medium">No consultation selected to add food charts.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Food Chart Entries</h3>
          <p className="text-xs text-slate-500 mt-0.5">Add food items with provided time.</p>
        </div>
        <button 
          onClick={() => {
            setNewEntries([...newEntries, { id: Date.now(), date: new Date().toISOString().split('T')[0], time: '', food: '' }]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
          }}
          className="flex items-center gap-1.5 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-4 py-1.5 rounded-lg font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="space-y-3">
        {isLoadingFoodCharts ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="font-medium text-sm">Loading food charts...</p>
          </div>
        ) : (
          <>
            {foodCharts.map((fc, index) => (
              <div key={fc.id} className={`border ${fc.isDelivered ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100 bg-slate-50'} rounded-lg p-3 flex gap-3 relative transition-colors`}>
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${fc.isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100/50 text-[#0d644e]'}`}>
                  {index + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Date</label>
                    <input type="text" value={formatDate(fc.date)} disabled className="w-full bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-500 font-medium" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Time</label>
                    <input type="text" value={formatTime12Hour(fc.time)} disabled className="w-full bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-500 font-medium" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Food Item</label>
                    <textarea value={fc.food} disabled rows="2" className="w-full bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-500 font-medium resize-none leading-tight" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Provided {fc.isDelivered ? '' : <span className="text-rose-500">*</span>}</label>
                    {fc.isDelivered ? (
                      <input 
                        type="text" 
                        value={formatTime12Hour(fc.providedTime)} 
                        disabled 
                        className="w-full border rounded-md px-2 py-1 text-xs font-medium transition-colors bg-emerald-50/50 border-emerald-200 text-emerald-700" 
                      />
                    ) : (
                      <input 
                        type="time" 
                        value={deliveryData[fc.id]?.providedTime || ''} 
                        onChange={e => setDeliveryData({...deliveryData, [fc.id]: {...deliveryData[fc.id], providedTime: e.target.value}})}
                        className="w-full border rounded-md px-2 py-1 text-xs font-medium transition-colors bg-white border-slate-300 focus:border-[#0d644e] outline-none" 
                      />
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Remarks</label>
                    <textarea 
                      rows="2"
                      placeholder="-"
                      value={fc.isDelivered ? (fc.remarks || '') : (deliveryData[fc.id]?.remarks || '')} 
                      onChange={e => !fc.isDelivered && setDeliveryData({...deliveryData, [fc.id]: {...deliveryData[fc.id], remarks: e.target.value}})}
                      disabled={fc.isDelivered}
                      className={`w-full border rounded-md px-2 py-1 text-xs font-medium transition-colors resize-none leading-tight ${fc.isDelivered ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white border-slate-300 focus:border-[#0d644e] outline-none'}`} 
                    />
                  </div>
                </div>
              </div>
            ))}

            {newEntries.map((entry, idx) => (
              <div key={entry.id} className="border border-emerald-200 bg-white shadow-sm rounded-lg p-3 flex gap-3 relative">
                <div className="shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                  {foodCharts.length + idx + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Date <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      value={entry.date} 
                      onChange={e => setNewEntries(newEntries.map(n => n.id === entry.id ? {...n, date: e.target.value} : n))}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-medium focus:border-[#0d644e] outline-none transition-colors" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Time <span className="text-rose-500">*</span></label>
                    <input 
                      type="time" 
                      value={entry.time} 
                      onChange={e => setNewEntries(newEntries.map(n => n.id === entry.id ? {...n, time: e.target.value} : n))}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-medium focus:border-[#0d644e] outline-none transition-colors" 
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Food Item <span className="text-rose-500">*</span></label>
                    <textarea 
                      rows="2"
                      placeholder="e.g. Green Tea"
                      value={entry.food} 
                      onChange={e => setNewEntries(newEntries.map(n => n.id === entry.id ? {...n, food: e.target.value} : n))}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-medium focus:border-[#0d644e] outline-none transition-colors resize-none leading-tight" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5 uppercase tracking-wide">Provided <span className="text-rose-200">*</span></label>
                    <input type="text" disabled placeholder="Time" className="w-full bg-slate-50 border border-slate-100 rounded-md px-2 py-1 text-xs text-slate-400 font-medium" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5 uppercase tracking-wide">Remarks</label>
                    <textarea rows="2" disabled placeholder="-" className="w-full bg-slate-50 border border-slate-100 rounded-md px-2 py-1 text-xs text-slate-400 font-medium resize-none leading-tight" />
                  </div>
                </div>
                <button 
                  onClick={() => setNewEntries(newEntries.filter(n => n.id !== entry.id))}
                  className="absolute -right-2 -top-2 w-6 h-6 bg-white shadow-sm border border-rose-100 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </>
        )}
        
        {!isLoadingFoodCharts && foodCharts.length === 0 && newEntries.length === 0 && (
           <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
             <Utensils className="w-8 h-8 mx-auto mb-2 text-slate-300" />
             <p className="font-medium text-sm">No food items yet. Click "+ Add Item" to begin.</p>
           </div>
        )}
        <div ref={bottomRef} />
      </div>
      
      <div className="mt-4 bg-blue-50/50 text-blue-700 p-3 rounded-lg text-xs border border-blue-100 flex items-center justify-between font-medium">
         <div className="flex items-center gap-2">
           <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">i</div>
           Add multiple food items to track patient diet.
         </div>
         <button 
           onClick={handleSaveAll}
           disabled={isSubmitting || (newEntries.length === 0 && foodCharts.every(fc => fc.isDelivered || !deliveryData[fc.id]?.providedTime))}
           className="px-4 py-1.5 bg-emerald-600 text-white rounded-md font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
           Save
         </button>
      </div>
    </div>
  );
}
