import React, { useState } from 'react';
import { Search, Stethoscope, Calendar, Activity, Bed, RefreshCw, ClipboardList } from 'lucide-react';

export default function MyPatientRecords({
  patients = [],
  appointments = [],
  consultations = [],
  detoxSessions = [],
  stayManagement = [],
  prescriptions = [],
  dietCharts = [],
  followups = [],
  reviews = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPatient, setExpandedPatient] = useState(null);

  const filteredPatients = patients.filter(pt => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return true;
    return (
      pt.name.toLowerCase().includes(normalized) ||
      pt.id.toLowerCase().includes(normalized) ||
      (pt.phone || '').includes(normalized) ||
      (pt.email || '').toLowerCase().includes(normalized)
    );
  });

  const getPatientRecords = (patientId) => ({
    appointments: appointments.filter(a => a.patient_id === patientId).sort((a, b) => new Date(b.date) - new Date(a.date)),
    consultations: consultations.filter(c => c.patient_id === patientId).sort((a, b) => new Date(b.date) - new Date(a.date)),
    detoxSessions: detoxSessions.filter(d => d.patient_id === patientId).sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)),
    stayManagement: stayManagement.filter(s => s.patient_id === patientId).sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time)),
    prescriptions: prescriptions.filter(pr => pr.patient_id === patientId).sort((a, b) => new Date(b.date) - new Date(a.date)),
    dietCharts: dietCharts.filter(d => d.patient_id === patientId).sort((a, b) => new Date(b.date) - new Date(a.date)),
    followups: followups.filter(f => f.patient_id === patientId).sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)),
    reviews: reviews.filter(r => r.patient_id === patientId).sort((a, b) => new Date(b.date) - new Date(a.date))
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">My Patient Records</h1>
          <p className="text-slate-500 text-sm mt-1">Browse all patient files and review their complete clinic history.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients by name, ID, phone or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid gap-5">
        {filteredPatients.map(pt => {
          const records = getPatientRecords(pt.id);
          const isExpanded = expandedPatient === pt.id;
          return (
            <div key={pt.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedPatient(isExpanded ? null : pt.id)}
                className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-[0.18em] mb-2">
                    <span>{pt.id}</span>
                    <span className="text-slate-300">•</span>
                    <span>{pt.registered_at ? `Registered ${pt.registered_at}` : 'Registration unknown'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{pt.name}</h2>
                  <p className="text-sm text-slate-600 mt-1">{pt.phone} • {pt.email || 'No email'} • {pt.location || pt.address || 'No location'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-slate-600 text-sm">
                  <span className="px-3 py-2 rounded-full bg-white border border-slate-200">Appointments: {records.appointments.length}</span>
                  <span className="px-3 py-2 rounded-full bg-white border border-slate-200">Consultations: {records.consultations.length}</span>
                  <span className="px-3 py-2 rounded-full bg-white border border-slate-200">Follow-ups: {records.followups.length}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="p-5 space-y-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-bold mb-3"><Stethoscope className="w-4 h-4" /> Consultation Summary</div>
                      {records.consultations.length > 0 ? (
                        <ul className="space-y-3 text-sm text-slate-600">
                          {records.consultations.map(c => (
                            <li key={c.id} className="rounded-2xl bg-white border border-slate-200 p-3">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="font-semibold text-slate-800">{c.doctor_name || 'Doctor'}</div>
                                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{c.date}</span>
                              </div>
                              <p className="text-slate-600"><strong className="text-slate-700">Diagnosis:</strong> {c.diagnosis || 'No diagnosis entered'}</p>
                              {c.detox_recommended && (
                                <p className="text-slate-600 mt-1"><strong className="text-slate-700">Detox:</strong> {c.detox_type}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">No consultation history found.</p>
                      )}
                    </div>

                    <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-bold mb-3"><Calendar className="w-4 h-4" /> Appointment Activity</div>
                      {records.appointments.length > 0 ? (
                        <ul className="space-y-3 text-sm text-slate-600">
                          {records.appointments.map(a => (
                            <li key={a.id} className="rounded-2xl bg-white border border-slate-200 p-3">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="font-semibold text-slate-800">{a.appointmentType || 'Appointment'}</div>
                                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{a.date} • {a.time}</span>
                              </div>
                              <p className="text-slate-600"><strong className="text-slate-700">Status:</strong> {a.status || 'Unknown'}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">No appointment history found.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-bold mb-3"><Activity className="w-4 h-4" /> Detox History</div>
                      {records.detoxSessions.length > 0 ? (
                        <ul className="space-y-2 text-sm text-slate-600">
                          {records.detoxSessions.map(d => (
                            <li key={d.id} className="rounded-2xl bg-white border border-slate-200 p-3">
                              <div className="font-semibold text-slate-800">{d.type}</div>
                              <p className="text-slate-500 text-xs">{d.scheduled_date} • {d.status}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">No detox sessions recorded.</p>
                      )}
                    </div>

                    <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-bold mb-3"><Bed className="w-4 h-4" /> Stay Log</div>
                      {records.stayManagement.length > 0 ? (
                        <ul className="space-y-2 text-sm text-slate-600">
                          {records.stayManagement.map(s => (
                            <li key={s.id} className="rounded-2xl bg-white border border-slate-200 p-3">
                              <div className="font-semibold text-slate-800">{s.room_name}</div>
                              <p className="text-slate-500 text-xs">{s.check_in_time}{s.check_out_time ? ` • ${s.check_out_time}` : ''}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">No stay history recorded.</p>
                      )}
                    </div>

                    <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-bold mb-3"><RefreshCw className="w-4 h-4" /> Follow-up Tasks</div>
                      {records.followups.length > 0 ? (
                        <ul className="space-y-2 text-sm text-slate-600">
                          {records.followups.map(f => (
                            <li key={f.id} className="rounded-2xl bg-white border border-slate-200 p-3">
                              <div className="font-semibold text-slate-800">{f.status}</div>
                              <p className="text-slate-500 text-xs">{f.scheduled_date}</p>
                              <p className="text-slate-600 mt-1">{f.notes}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">No follow-ups created.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-700 font-bold mb-3"><ClipboardList className="w-4 h-4" /> Record Details</div>
                    <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-600">
                      <div className="rounded-2xl bg-white border border-slate-200 p-3">
                        <div className="font-semibold text-slate-800">Prescriptions</div>
                        <p className="text-slate-500 mt-1">{records.prescriptions.length} items</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-3">
                        <div className="font-semibold text-slate-800">Diet Charts</div>
                        <p className="text-slate-500 mt-1">{records.dietCharts.length} charts</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-3">
                        <div className="font-semibold text-slate-800">Reviews</div>
                        <p className="text-slate-500 mt-1">{records.reviews.length} feedback entries</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-3">
                        <div className="font-semibold text-slate-800">Clinic Notes</div>
                        <p className="text-slate-500 mt-1">Total records: {records.consultations.length + records.appointments.length + records.detoxSessions.length + records.followups.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredPatients.length === 0 && (
          <div className="py-12 text-center text-slate-500">No patient records match your search.</div>
        )}
      </div>
    </div>
  );
}
