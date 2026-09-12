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

      <div className="mt-2">
        {isLoadingFoodCharts ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="font-medium text-sm">Loading food charts...</p>
          </div>
        ) : (
          <>
            {(foodCharts.length > 0 || newEntries.length > 0) && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl mb-4 shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4 w-[120px]">Date</th>
                      <th className="py-2.5 px-4 w-[110px]">Time</th>
                      <th className="py-2.5 px-4 min-w-[200px]">Food Item</th>
                      <th className="py-2.5 px-4 w-[140px]">Provided</th>
                      <th className="py-2.5 px-4 min-w-[150px]">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {foodCharts.map((fc, index) => (
                      <tr key={fc.id} className={fc.isDelivered ? 'bg-emerald-50/30' : 'bg-white hover:bg-slate-50/50 transition-colors'}>
                        <td className="py-3 px-4 text-center align-top">
                          <div className={`inline-flex w-6 h-6 rounded-full items-center justify-center font-bold text-[10px] ${fc.isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top text-slate-700 text-xs font-semibold whitespace-nowrap">
                          {formatDate(fc.date)}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-600 text-xs whitespace-nowrap">
                          {formatTime12Hour(fc.time)}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-700 text-xs">
                          {fc.food}
                        </td>
                        <td className="py-3 px-4 align-top">
                          {fc.isDelivered ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-1 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> {formatTime12Hour(fc.providedTime)}
                            </span>
                          ) : (
                            <input 
                              type="time" 
                              value={deliveryData[fc.id]?.providedTime || ''} 
                              onChange={e => setDeliveryData({...deliveryData, [fc.id]: {...deliveryData[fc.id], providedTime: e.target.value}})}
                              className="w-full border rounded-md px-2 py-1.5 text-xs font-medium bg-white border-slate-300 focus:border-emerald-500 outline-none transition-colors" 
                            />
                          )}
                        </td>
                        <td className="py-3 px-4 align-top">
                          {fc.isDelivered ? (
                            <span className="text-slate-500 text-xs">{fc.remarks || '-'}</span>
                          ) : (
                            <textarea 
                              rows="1"
                              placeholder="Add remarks..."
                              value={deliveryData[fc.id]?.remarks || ''} 
                              onChange={e => setDeliveryData({...deliveryData, [fc.id]: {...deliveryData[fc.id], remarks: e.target.value}})}
                              className="w-full border rounded-md px-2 py-1.5 text-xs font-medium bg-white border-slate-300 focus:border-emerald-500 outline-none transition-colors resize-none leading-tight" 
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    
                    {newEntries.map((entry, idx) => (
                      <tr key={entry.id} className="bg-blue-50/20 group relative border-l-2 border-l-blue-400">
                        <td className="py-3 px-4 text-center align-top relative">
                          <div className="inline-flex w-6 h-6 rounded-full items-center justify-center font-bold text-[10px] bg-blue-100 text-blue-700 relative z-10 group-hover:opacity-0 transition-opacity">
                            {foodCharts.length + idx + 1}
                          </div>
                          <button 
                            onClick={() => setNewEntries(newEntries.filter(n => n.id !== entry.id))}
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-100 transition-all p-1.5 rounded-full z-20"
                            title="Remove Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <input 
                            type="date" 
                            value={entry.date} 
                            onChange={e => setNewEntries(newEntries.map(n => n.id === entry.id ? {...n, date: e.target.value} : n))}
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs font-medium focus:border-blue-500 outline-none transition-colors" 
                          />
                        </td>
                        <td className="py-3 px-4 align-top">
                          <input 
                            type="time" 
                            value={entry.time} 
                            onChange={e => setNewEntries(newEntries.map(n => n.id === entry.id ? {...n, time: e.target.value} : n))}
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs font-medium focus:border-blue-500 outline-none transition-colors" 
                          />
                        </td>
                        <td className="py-3 px-4 align-top">
                          <textarea 
                            rows="2"
                            placeholder="e.g. Green Tea"
                            value={entry.food} 
                            onChange={e => setNewEntries(newEntries.map(n => n.id === entry.id ? {...n, food: e.target.value} : n))}
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs font-medium focus:border-blue-500 outline-none transition-colors resize-none leading-tight" 
                          />
                        </td>
                        <td className="py-3 px-4 align-top">
                          <input type="text" disabled placeholder="-" className="w-full bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5 text-xs text-slate-400 font-medium cursor-not-allowed" />
                        </td>
                        <td className="py-3 px-4 align-top">
                          <textarea rows="1" disabled placeholder="-" className="w-full bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5 text-xs text-slate-400 font-medium resize-none leading-tight cursor-not-allowed" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {!isLoadingFoodCharts && foodCharts.length === 0 && newEntries.length === 0 && (
              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Utensils className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-sm text-slate-500">No food items added yet.</p>
                <p className="text-xs mt-1">Click "+ Add Item" to begin tracking diet.</p>
              </div>
            )}
          </>
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
