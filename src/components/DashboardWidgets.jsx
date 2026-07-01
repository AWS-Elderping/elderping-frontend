import { useState, useEffect } from 'react';
import { Pill, Activity, Calendar, FileText, AlertTriangle, CheckCircle2, Clock, Upload, ArrowDown, ShieldAlert, XCircle, Sparkles, StickyNote, Trash2 } from 'lucide-react';
import { getNotes, createNote, deleteNote, generateAiNote } from '../api/notesApi';
import { queryAI } from '../api/aiApi';

// ==========================================
// 1. RISK SCORE WIDGET
// ==========================================
export function RiskScoreWidget({ riskScore = 'LOW' }) {
  const normalized = (riskScore || 'LOW').toUpperCase();
  const colors = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-300',
    MEDIUM: 'bg-gray-200 text-gray-800 border-gray-400',
    HIGH: 'bg-gray-700 text-white border-gray-800',
    CRITICAL: 'bg-black text-white border-black animate-pulse'
  };
  const labels = {
    LOW: 'Clinical Status Stable',
    MEDIUM: 'Minor Parameters Warning',
    HIGH: 'Clinical Action Required',
    CRITICAL: 'EMERGENCY ACTION REQUIRED'
  };

  return (
    <div className={`p-6 rounded-2xl border-2 shadow-md flex items-center justify-between ${colors[normalized] || colors.LOW}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-85">Health Risk Assessment</p>
        <p className="text-3xl font-extrabold tracking-tight mt-1">{normalized}</p>
        <p className="text-sm font-semibold mt-2 opacity-90">{labels[normalized] || labels.LOW}</p>
      </div>
      <ShieldAlert className="w-14 h-14 opacity-40" />
    </div>
  );
}

// ==========================================
// 2. HEALTH SUMMARY WIDGET
// ==========================================
export function HealthSummaryWidget({ summary }) {
  const [useImperial, setUseImperial] = useState(false);

  if (!summary) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400">
        No check-in recorded yet. Please complete a check-in to view vitals.
      </div>
    );
  }

  // Unit conversions
  const displayTemp = (c) => {
    if (!c) return '—';
    if (useImperial) {
      return `${((parseFloat(c) * 9) / 5 + 32).toFixed(1)}°F`;
    }
    return `${parseFloat(c).toFixed(1)}°C`;
  };

  const displayWeight = (kg) => {
    if (!kg) return '—';
    if (useImperial) {
      return `${(parseFloat(kg) * 2.20462262).toFixed(1)} lbs`;
    }
    return `${parseFloat(kg).toFixed(1)} kg`;
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-gray-200 shadow-md">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-gray-700" /> Vitals Summary
        </h3>
        <button
          onClick={() => setUseImperial(!useImperial)}
          className="text-xs font-bold text-gray-900 bg-gray-100 border border-gray-200 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Display: {useImperial ? 'Metric (°C/kg)' : 'Imperial (°F/lbs)'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Heart Rate</p>
          <p className="text-2xl font-extrabold text-gray-800 mt-1">
            {summary.heart_rate ? `${summary.heart_rate} bpm` : '—'}
          </p>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Blood Pressure</p>
          <p className="text-2xl font-extrabold text-gray-800 mt-1">
            {summary.blood_pressure || '—'}
          </p>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Oxygen Sat (SpO2)</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {summary.oxygen_saturation ? `${summary.oxygen_saturation}%` : '—'}
          </p>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Blood Sugar</p>
          <p className="text-2xl font-extrabold text-gray-800 mt-1">
            {summary.blood_sugar ? `${summary.blood_sugar} mg/dL` : '—'}
          </p>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Temperature</p>
          <p className="text-2xl font-extrabold text-gray-800 mt-1">
            {displayTemp(summary.temperature_celsius)}
          </p>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Weight (BMI)</p>
          <p className="text-2xl font-extrabold text-gray-800 mt-1">
            {displayWeight(summary.weight_kg)}
            {summary.bmi && (
              <span className="text-xs font-semibold text-gray-400 block mt-0.5">
                BMI: {parseFloat(summary.bmi).toFixed(1)}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. MEDICATION WIDGET
// ==========================================
export function MedicationWidget({ reminders = [], compliance, onMarkTaken, medLoading }) {
  const adherence = compliance?.weeklyAdherence ?? null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Pill className="w-6 h-6 text-gray-700" /> Medications Log
        </h3>
        {adherence !== null && (
          <span className="text-xs font-bold bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full border border-gray-300">
            Adherence Score: {adherence}%
          </span>
        )}
      </div>

      {reminders.length === 0 ? (
        <p className="text-gray-400 text-center py-6 font-medium">No medications scheduled for today.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {reminders.map((r) => (
            <li key={r.id} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="font-extrabold text-gray-800">{r.medication_name}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{r.dosage} &bull; Scheduled {r.scheduled_time?.slice(0, 5) || r.time_of_day?.slice(0, 5)}</p>
              </div>
              {onMarkTaken ? (
                <button
                  id={`med-taken-${r.id}`}
                  onClick={() => !r.taken && onMarkTaken(r)}
                  disabled={r.taken || medLoading === r.id}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    r.taken
                      ? 'bg-gray-800 text-white border border-gray-800 cursor-default'
                      : 'bg-black hover:bg-gray-800 text-white active:scale-95'
                  }`}
                >
                  {medLoading === r.id ? '…' : r.taken ? 'Taken' : 'Mark Taken'}
                </button>
              ) : (
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  r.taken ? 'bg-gray-800 text-white border border-gray-800' : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}>
                  {r.taken ? 'Taken' : 'Pending'}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==========================================
// 4. APPOINTMENT WIDGET
// ==========================================
export function AppointmentWidget({ appointments = [] }) {
  const upcoming = appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <Calendar className="w-6 h-6 text-gray-700" /> Upcoming Appointments
      </h3>

      {upcoming.length === 0 ? (
        <p className="text-gray-400 text-center py-6 font-medium">No appointments scheduled.</p>
      ) : (
        <ul className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
          {upcoming.map((appt) => (
            <li key={appt.id} className="py-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-extrabold text-gray-800 leading-tight">Dr. {appt.doctor_name}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full border border-gray-300">
                  {appt.status}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-500 mt-1">
                {appt.doctor_specialty ? `${appt.doctor_specialty} • ` : ''}
                {appt.clinic_name || appt.hospital_name || 'Clinic'}
              </p>
              <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {new Date(appt.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==========================================
// 5. ALERT WIDGET
// ==========================================
export function AlertWidget({ alerts = [] }) {
  const activeAlerts = alerts.filter(a => !a.is_resolved);
  if (activeAlerts.length === 0) return null;

  return (
    <div className="bg-gray-900 border-2 border-black rounded-2xl p-5 shadow-sm mb-6">
      <h4 className="text-white font-extrabold text-lg flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5.5 h-5.5 text-white" /> Clinical Action Alerts ({activeAlerts.length})
      </h4>
      <ul className="divide-y divide-gray-700 max-h-40 overflow-y-auto">
        {activeAlerts.map(a => (
          <li key={a.id} className="py-2.5 flex items-start gap-2 text-sm text-white font-semibold">
            <span className="mt-0.5">•</span>
            <div>
              <p className="leading-tight">{a.message}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Severity: {a.severity} • {new Date(a.created_at).toLocaleString()}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==========================================
// 6. TIMELINE WIDGET
// ==========================================
export function TimelineWidget({ timeline = [] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <Clock className="w-6 h-6 text-gray-700" /> Chronological Timeline
      </h3>

      {timeline.length === 0 ? (
        <p className="text-gray-400 text-center py-12 font-medium">No events logged yet.</p>
      ) : (
        <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-6 max-h-[500px] overflow-y-auto pr-2">
          {timeline.map((event) => (
            <div key={event.id} className="relative">
              {/* Bullet circle */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-gray-800 border-2 border-white shadow-sm" />

              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {event.eventType}
                </span>
                <h4 className="font-extrabold text-gray-800 text-base leading-tight mt-0.5">{event.title}</h4>
                <p className="text-[10px] text-gray-400 font-medium mt-1">
                  {new Date(event.timestamp).toLocaleString()}
                </p>

                {/* Sub-details rendering */}
                {event.eventType === 'HEALTH_LOG' && (
                  <div className="mt-2 text-xs font-semibold text-gray-600 grid grid-cols-2 gap-x-2 gap-y-1 bg-white p-2.5 rounded-lg border border-gray-100">
                    {event.details.heartRate && <span>HR: {event.details.heartRate} bpm</span>}
                    {event.details.bloodPressure && <span>BP: {event.details.bloodPressure}</span>}
                    {event.details.spo2 && <span>SpO2: {event.details.spo2}%</span>}
                    {event.details.temp && <span>Temp: {parseFloat(event.details.temp).toFixed(1)}°C</span>}
                  </div>
                )}

                {event.eventType === 'NOTE' && (
                  <p className="mt-2 text-sm text-gray-600 italic bg-white p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                    "{event.details.content}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. DOCUMENT WIDGET
// ==========================================
export function DocumentWidget({ documents = [], onUpload, onDownload, onDelete, uploadLoading, elderId }) {
  const [docForm, setDocForm] = useState({ file: null, type: 'PRESCRIPTION' });
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.file || !elderId) return;
    const formData = new FormData();
    formData.append('file', docForm.file);
    formData.append('elderId', elderId);
    formData.append('documentType', docForm.type);

    const success = await onUpload(formData);
    if (success) {
      setDocForm({ file: null, type: 'PRESCRIPTION' });
      // Clear file input
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';
    }
  };

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    await onDownload(doc);
    setDownloadingId(null);
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.file_name}"?`)) return;
    setDeletingId(doc.id);
    await onDelete(doc);
    setDeletingId(null);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-5">
        <FileText className="w-6 h-6 text-gray-700" /> Medical Documents
      </h3>

      {/* Upload Form */}
      {onUpload && (
        <form onSubmit={handleSubmit} className="mb-5 bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="doc-file-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setDocForm({ ...docForm, file: e.target.files[0] })}
              className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-800 hover:file:bg-gray-300 text-gray-600 focus:outline-none"
              required
            />
            <select
              value={docForm.type}
              onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
              className="bg-white border-2 border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none"
            >
              <option value="PRESCRIPTION">Prescription</option>
              <option value="LAB_REPORT">Lab Report</option>
              <option value="MEDICAL_RECORD">Medical Record</option>
              <option value="INSURANCE_DOCUMENT">Insurance Doc</option>
              <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={uploadLoading || !docForm.file}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {uploadLoading ? 'Uploading…' : 'Upload File'}
          </button>
        </form>
      )}

      {documents.length === 0 ? (
        <p className="text-gray-400 text-center py-6 font-medium">No documents uploaded.</p>
      ) : (
        <ul className="divide-y divide-gray-50 max-h-60 overflow-y-auto pr-1">
          {documents.map((doc) => (
            <li key={doc.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-extrabold text-gray-800 leading-snug">{doc.file_name}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">
                  {doc.document_type}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg p-2.5 transition-colors"
                  title="Download secure copy"
                >
                  <ArrowDown className={`w-4 h-4 text-gray-600 ${downloadingId === doc.id ? 'animate-bounce' : ''}`} />
                </button>
                {onDelete && (
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="bg-gray-100 border border-gray-300 hover:bg-gray-200 rounded-lg p-2.5 transition-colors"
                    title="Delete document"
                  >
                    <XCircle className={`w-4 h-4 text-gray-700 ${deletingId === doc.id ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==========================================
// 8. TRENDS CHARTS (SVG PATH IMPLEMENTATIONS)
// ==========================================
export function LineChart({ data = [], dataKey, color, title, unit = '' }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-400 py-6 text-center">No trend data available</div>;
  }

  // Filter & reverse chronological data
  const points = data
    .filter(d => d[dataKey] !== undefined && d[dataKey] !== null)
    .map(d => ({
      val: parseFloat(d[dataKey]),
      date: new Date(d.logged_at || d.created_at)
    }))
    .reverse();

  if (points.length === 0) {
    return <div className="text-gray-400 py-6 text-center font-medium">No measurements logged.</div>;
  }

  const minVal = Math.min(...points.map(p => p.val)) * 0.9;
  const maxVal = Math.max(...points.map(p => p.val)) * 1.1;
  const valRange = maxVal - minVal || 1;

  const width = 400;
  const height = 150;
  const padding = 20;

  const getX = (index) => padding + (index / (points.length - 1 || 1)) * (width - 2 * padding);
  const getY = (val) => height - padding - ((val - minVal) / valRange) * (height - 2 * padding);

  let pathD = '';
  points.forEach((p, idx) => {
    const x = getX(idx);
    const y = getY(p.val);
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1">
      <h4 className="font-bold text-gray-700 text-sm mb-2">{title}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Horizontal Grids */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth={1} />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f3f4f6" strokeWidth={1} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f3f4f6" strokeWidth={1} />
        
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        )}
        
        {points.map((p, idx) => (
          <circle key={idx} cx={getX(idx)} cy={getY(p.val)} r={points.length === 1 ? 6 : 4} fill={color} stroke="#fff" strokeWidth={1.5} />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-wide">
        <span>{points[0].date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
        <span>Latest: <strong style={{ color }}>{points[points.length - 1].val.toFixed(0)}{unit}</strong></span>
        <span>{points[points.length - 1].date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

export function BloodPressureChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-400 py-6 text-center">No BP trend data available</div>;
  }

  const points = data
    .filter(d => d.blood_pressure && d.blood_pressure.includes('/'))
    .map(d => {
      const [sys, dia] = d.blood_pressure.split('/').map(Number);
      return {
        sys,
        dia,
        date: new Date(d.logged_at || d.created_at)
      };
    })
    .reverse();

  if (points.length === 0) {
    return <div className="text-gray-400 py-6 text-center font-medium">No BP readings logged.</div>;
  }

  const sysValues = points.map(p => p.sys);
  const diaValues = points.map(p => p.dia);
  const minVal = Math.min(...diaValues) * 0.8;
  const maxVal = Math.max(...sysValues) * 1.2;
  const valRange = maxVal - minVal || 1;

  const width = 400;
  const height = 150;
  const padding = 20;

  const getX = (index) => padding + (index / (points.length - 1 || 1)) * (width - 2 * padding);
  const getY = (val) => height - padding - ((val - minVal) / valRange) * (height - 2 * padding);

  let sysPath = '';
  let diaPath = '';
  points.forEach((p, idx) => {
    const x = getX(idx);
    const ySys = getY(p.sys);
    const yDia = getY(p.dia);
    if (idx === 0) {
      sysPath = `M ${x} ${ySys}`;
      diaPath = `M ${x} ${yDia}`;
    } else {
      sysPath += ` L ${x} ${ySys}`;
      diaPath += ` L ${x} ${yDia}`;
    }
  });

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1">
      <h4 className="font-bold text-gray-700 text-sm mb-2">Blood Pressure Trend</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth={1} />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f3f4f6" strokeWidth={1} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f3f4f6" strokeWidth={1} />
        
        {points.length > 1 && (
          <>
            <path d={sysPath} fill="none" stroke="#111827" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d={diaPath} fill="none" stroke="#9ca3af" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={getX(idx)} cy={getY(p.sys)} r={4} fill="#111827" stroke="#fff" strokeWidth={1.5} />
            <circle cx={getX(idx)} cy={getY(p.dia)} r={4} fill="#9ca3af" stroke="#fff" strokeWidth={1.5} />
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-wide">
        <span>{points[0].date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
        <span className="flex gap-2">
          <span>Sys: <strong className="text-gray-900">{points[points.length - 1].sys}</strong></span>
          <span>Dia: <strong className="text-gray-500">{points[points.length - 1].dia}</strong></span>
        </span>
        <span>{points[points.length - 1].date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

// ==========================================
// 9. ADHERENCE TREND CHART
// ==========================================
export function AdherenceTrendChart({ weekly, monthly, overall }) {
  const weeklyVal = weekly ?? 0;
  const monthlyVal = monthly ?? 0;
  const overallVal = overall ?? 0;

  if (weekly === null && monthly === null && overall === null) {
    return (
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1 text-center py-6 text-gray-400 font-medium">
        No medication adherence data logged yet.
      </div>
    );
  }

  const width = 400;
  const height = 150;
  const padding = 20;
  const chartHeight = height - 2 * padding;

  const getBarHeight = (pct) => {
    const val = parseFloat(pct || 0);
    return (val / 100) * chartHeight;
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1">
      <h4 className="font-bold text-gray-700 text-sm mb-2">Medication Adherence Trend</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Grids */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth={1} />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f3f4f6" strokeWidth={1} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f3f4f6" strokeWidth={1} />

        {/* Weekly Bar */}
        <rect
          x={60}
          y={height - padding - getBarHeight(weeklyVal)}
          width={40}
          height={getBarHeight(weeklyVal)}
          rx={6}
          fill="url(#weeklyGrad)"
        />
        <text x={80} y={height - padding - getBarHeight(weeklyVal) - 6} textAnchor="middle" className="text-[10px] font-extrabold fill-gray-600">
          {weeklyVal}%
        </text>
        <text x={80} y={height - padding + 12} textAnchor="middle" className="text-[10px] font-bold fill-gray-500">
          Weekly
        </text>

        {/* Monthly Bar */}
        <rect
          x={180}
          y={height - padding - getBarHeight(monthlyVal)}
          width={40}
          height={getBarHeight(monthlyVal)}
          rx={6}
          fill="url(#monthlyGrad)"
        />
        <text x={200} y={height - padding - getBarHeight(monthlyVal) - 6} textAnchor="middle" className="text-[10px] font-extrabold fill-gray-700">
          {monthlyVal}%
        </text>
        <text x={200} y={height - padding + 12} textAnchor="middle" className="text-[10px] font-bold fill-gray-500">
          Monthly
        </text>

        {/* Overall Bar */}
        <rect
          x={300}
          y={height - padding - getBarHeight(overallVal)}
          width={40}
          height={getBarHeight(overallVal)}
          rx={6}
          fill="url(#overallGrad)"
        />
        <text x={320} y={height - padding - getBarHeight(overallVal) - 6} textAnchor="middle" className="text-[10px] font-extrabold fill-gray-900">
          {overallVal}%
        </text>
        <text x={320} y={height - padding + 12} textAnchor="middle" className="text-[10px] font-bold fill-gray-500">
          Overall
        </text>

        {/* Gradients */}
        <defs>
          <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#d1d5db" />
          </linearGradient>
          <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>
          <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ==========================================
// NOTES WIDGET
// ==========================================
export function NotesWidget({ elderId }) {
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [text, setText]           = useState('');
  const [category, setCategory]   = useState('PATIENT');
  const [saving, setSaving]       = useState(false);
  const [aiGen, setAiGen]         = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    if (!elderId) return;
    setLoading(true);
    try {
      const data = await getNotes(elderId);
      setNotes(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [elderId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true); setError('');
    try {
      await createNote({ userId: elderId, elderId, category, content: text });
      setText('');
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleAiNote = async () => {
    setAiGen(true); setError('');
    try {
      await generateAiNote({ elderId });
      await load();
    } catch (err) { setError(err.message); }
    finally { setAiGen(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteNote(id); await load(); }
    catch (err) { setError(err.message); }
  };

  const categoryColors = {
    PATIENT:   'bg-gray-200 text-gray-800',
    FAMILY:    'bg-gray-300 text-gray-900',
    CAREGIVER: 'bg-gray-400 text-white',
    DOCTOR:    'bg-gray-700 text-white',
    AI:        'bg-black text-white',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
        <StickyNote className="w-5 h-5 text-gray-700" /> Clinical Notes
      </h3>

      {error && <p className="text-gray-900 text-sm mb-3 bg-gray-100 px-3 py-2 rounded-lg">{error}</p>}

      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-black"
          >
            <option value="PATIENT">Patient</option>
            <option value="FAMILY">Family</option>
            <option value="CAREGIVER">Caregiver</option>
            <option value="DOCTOR">Doctor</option>
          </select>
          <button
            type="button"
            onClick={handleAiNote}
            disabled={aiGen}
            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {aiGen ? 'Generating…' : 'AI Note'}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="bg-black hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? '…' : 'Add'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-4">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-gray-400 text-sm text-center italic py-4">No notes yet.</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {notes.map(note => (
            <div key={note.id} className="border border-gray-100 rounded-xl p-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryColors[note.note_category] || 'bg-gray-100 text-gray-600'}`}>
                    {note.note_category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {note.author_name || 'Unknown'} · {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button onClick={() => handleDelete(note.id)} className="text-gray-300 hover:text-black transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// AI HEALTH ASSISTANT WIDGET
// ==========================================
export function AIChatWidget({ userId }) {
  const [query, setQuery]       = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading]   = useState(false);
  const [capability, setCap]    = useState('document_qa');
  const [error, setError]       = useState('');

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim() || !userId) return;
    setLoading(true); setResponse(''); setError('');
    try {
      const res = await queryAI({ userId, capability, query });
      setResponse(res.result);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-gray-700" />
        AI Health Assistant
        <span className="ml-auto text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full font-semibold">Nova Lite</span>
      </h3>

      <form onSubmit={handleAsk} className="space-y-3 mb-4">
        <select
          value={capability}
          onChange={e => setCap(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="document_qa">Ask About My Documents</option>
          <option value="qa">General Q&amp;A</option>
          <option value="symptom_check">Symptom Check</option>
          <option value="medication">Medication Advice</option>
          <option value="risk_assessment">Risk Assessment</option>
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask a health question…"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-black hover:bg-gray-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-opacity disabled:opacity-50"
          >
            {loading ? '…' : 'Ask'}
          </button>
        </div>
      </form>

      {error && <p className="text-gray-900 text-sm bg-gray-100 px-3 py-2 rounded-xl mb-3">{error}</p>}

      {response ? (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI Response
          </p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{response}</p>
        </div>
      ) : (
        !error && <p className="text-gray-400 text-sm text-center italic">Ask any health question above.</p>
      )}
    </div>
  );
}
