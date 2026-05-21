import React, { useState } from 'react';
import { MessageSquare, Send, CheckCheck, Phone, RefreshCw, Smartphone, ListFilter } from 'lucide-react';

export default function WhatsAppHubView({
  whatsappLogs,
  patients,
  onSendCustomMessage
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[1]?.id || ''); 
  const [typedMessage, setTypedMessage] = useState('');
  
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0] || {};
  const activeChats = whatsappLogs.filter(log => log.patient_id === activePatient.id);

  const templates = [
    {
      id: 'appointment_confirm',
      name: 'Booking Confirmation',
      text: `Dear {{name}}, your appointment with Dr. Evelyn Carter is confirmed for Today at 11:30 AM. Reply HELP for queries. - Manthrralaya's Wellness`
    },
    {
      id: 'detox_prep_reminder',
      name: 'Session Reminder',
      text: `Hello {{name}}, your Deep Tissue Cell Detox session is scheduled for Tomorrow. Please begin your liquid fasting protocol. - Manthrralaya's Wellness`
    },
    {
      id: 'document_delivery_pdf',
      name: 'PDF Document Delivery',
      text: `Dear {{name}}, here is your customized Diet Chart and Prescription from Dr. Evelyn Carter. Please download and follow the instructions. - Manthrralaya's Wellness`
    },
    {
      id: 'feedback_review',
      name: 'Review Rating Request',
      text: `Hello {{name}}, we hope you had a rejuvenating stay. How would you rate your experience? Please leave a review. - Manthrralaya's Wellness`
    }
  ];

  const handleSendTemplate = (template) => {
    let msgText = template.text.replace('{{name}}', activePatient.name);
    const newLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`,
      patient_id: activePatient.id,
      patient_name: activePatient.name,
      phone: activePatient.phone,
      type: template.name,
      message_text: msgText,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Delivered',
      template_name: template.id
    };
    onSendCustomMessage(newLog);
  };

  const handleSendCustomText = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    const newLog = {
      id: `WA-${900 + whatsappLogs.length + 1}`,
      patient_id: activePatient.id,
      patient_name: activePatient.name,
      phone: activePatient.phone,
      type: 'Direct Message',
      message_text: typedMessage,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Sent',
      template_name: 'custom_chat'
    };
    onSendCustomMessage(newLog);
    setTypedMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            WhatsApp CRM Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Audit automated notifications and interact via Meta Cloud API simulation.
          </p>
        </div>
        <span className="bg-white border border-slate-200 text-emerald-600 font-bold px-4 py-2 rounded-full text-xs flex items-center gap-2 shadow-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Webhook Listener Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Meta Cloud Logs Audit Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <ListFilter className="w-5 h-5 text-emerald-600" /> Outbound Delivery Registry
            </h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Meta API Sandbox</span>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider sticky top-0">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Message Preview</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {whatsappLogs.slice().reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-sm">{log.patient_name}</div>
                      <div className="text-xs text-slate-500">{log.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate text-sm">
                      {log.message_text}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-sm whitespace-nowrap">
                      {log.sent_at.split(' ')[1]}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                        log.status === 'Read' ? 'text-blue-600' :
                        log.status === 'Delivered' ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        <CheckCheck className="w-4 h-4" /> {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Smartphone Chat Simulator Widget */}
        <div className="space-y-4">
          
          {/* Active Chat picker */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <label className="block text-xs text-slate-500 font-bold uppercase mb-2">Simulate Phone Line</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
              ))}
            </select>
          </div>

          {/* Smartphone Simulator */}
          <div className="bg-slate-100 border-[8px] border-slate-800 rounded-[40px] overflow-hidden shadow-2xl relative h-[560px] flex flex-col justify-between mx-auto max-w-[320px]">
            {/* Phone Notch/Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 relative shadow-sm z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-b-xl"></div>
              <div className="flex items-center space-x-3 mt-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-sm border border-emerald-200">
                  {activePatient.name?.charAt(0)}
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-slate-800 block leading-tight">{activePatient.name}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block uppercase tracking-wide">Online</span>
                </div>
              </div>
              <Phone className="w-5 h-5 text-emerald-600 mt-2" />
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col bg-[#efeae2]">
              <span className="text-[10px] bg-slate-200/80 text-slate-600 font-bold self-center px-3 py-1 rounded-full shadow-sm">
                Meta Sandbox Conversation
              </span>

              {activeChats.map(chat => (
                <div
                  key={chat.id}
                  className={`max-w-[85%] rounded-2xl p-3 text-sm text-left relative flex flex-col shadow-sm ${
                    chat.template_name === 'custom_chat'
                      ? 'bg-emerald-100 text-slate-800 self-end rounded-tr-none border border-emerald-200'
                      : 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none'
                  }`}
                >
                  <span className="font-bold text-[10px] text-emerald-700 block mb-1">
                    {chat.type}
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{chat.message_text}</p>
                  <span className="text-[9px] text-slate-500 self-end mt-1.5 font-semibold flex items-center gap-1">
                    {chat.sent_at.split(' ')[1] || 'Today'} <CheckCheck className={`w-3.5 h-3.5 ${chat.status === 'Read' ? 'text-blue-500' : 'text-slate-400'}`} />
                  </span>
                </div>
              ))}

              {activeChats.length === 0 && (
                <div className="text-center text-slate-500 italic text-sm my-auto bg-white/50 p-3 rounded-xl border border-slate-200/50">
                  No chat logs recorded yet. Send a template below.
                </div>
              )}
            </div>

            {/* Template Quick Triggers */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 text-left z-10">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2 px-1">Meta API Triggers:</span>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSendTemplate(t)}
                    className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg p-2 text-[10px] font-bold text-left transition-colors shadow-sm truncate"
                  >
                    🚀 {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Box */}
            <form onSubmit={handleSendCustomText} className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 z-10 pb-4">
              <input
                type="text"
                placeholder="Type message..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="flex-1 bg-white border border-slate-300 text-sm text-slate-800 rounded-full py-2.5 px-4 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4 ml-1" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
