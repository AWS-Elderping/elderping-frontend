import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, Bell, CheckCircle2, XCircle, Pill, TrendingUp,
  User, LogOut, RefreshCw, AlertTriangle, Clock, Link as LinkIcon, Plus
} from 'lucide-react';
import { getCachedUser, logout, getLinkedElders, linkElder, getUserById, listDoctors, assignDoctor } from '../api/authApi';
import { 
  getFamilyDashboard, 
  getTimeline, 
  downloadDocument, 
  deleteDocument 
} from '../api/healthApi';
import { createReminder as addReminder, getReminders } from '../api/reminderApi';
import { createAppointment } from '../api/appointmentApi';
import {
  RiskScoreWidget,
  AlertWidget,
  MedicationWidget,
  AppointmentWidget,
  TimelineWidget,
  DocumentWidget,
  LineChart,
  BloodPressureChart,
  AdherenceTrendChart,
  NotesWidget,
  AIChatWidget
} from '../components/DashboardWidgets';

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const user = getCachedUser();

  const [elders, setElders] = useState([]);
  const [selectedElderId, setSelectedElderId] = useState(null);
  const [elderName, setElderName] = useState('');

  // Consolidated BFF dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [timeline, setTimeline]           = useState([]);
  const [reminders, setReminders]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState('');
  const [lastRefresh, setLastRefresh]     = useState(new Date());

  // Link form
  const [linkCode, setLinkCode] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  // Doctor assignment
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignDoctorLoading, setAssignDoctorLoading] = useState(false);

  // Add Med form
  const [medForm, setMedForm] = useState({ name: '', dosage: '', time: '08:00', frequency: 'DAILY' });
  const [medLoading, setMedLoading] = useState(false);

  // Add Appointment form
  const [apptForm, setApptForm] = useState({ doctorName: '', clinicName: '', date: '', time: '09:00', notes: '' });
  const [apptLoading, setApptLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user || (user.role || '').toUpperCase() !== 'FAMILY') navigate('/login', { replace: true });
  }, []);

  const fetchElders = useCallback(async () => {
    try {
      const data = await getLinkedElders();
      setElders(data);
      if (data.length > 0 && !selectedElderId) {
        setSelectedElderId(data[0].id);
        setElderName(data[0].username);
      }
    } catch (err) {
      setFetchError("Could not load linked elders.");
    }
  }, [selectedElderId]);

  useEffect(() => { fetchElders(); }, [fetchElders]);

  useEffect(() => {
    listDoctors().then(setDoctors).catch(() => setDoctors([]));
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedElderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError('');
    try {
      const [data, timelineEvents, remindersList, uResult] = await Promise.all([
        getFamilyDashboard(selectedElderId),
        getTimeline(selectedElderId),
        getReminders(selectedElderId),
        getUserById(selectedElderId)
      ]);

      setDashboardData(data);
      setTimeline(timelineEvents);
      setReminders(remindersList);
      if (uResult?.username) {
        setElderName(uResult.username);
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to load dashboard.');
    } finally {
      setLastRefresh(new Date());
      setLoading(false);
    }
  }, [selectedElderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLinkElder = async (e) => {
    e.preventDefault();
    if (!linkCode) return;
    setLinkLoading(true);
    try {
      const res = await linkElder(linkCode);
      setLinkCode('');
      await fetchElders();
      setSelectedElderId(res.data?.elderId || res.elderId);
    } catch (err) {
      alert("Failed to link elder: " + (err.response?.data?.error || err.message));
    } finally {
      setLinkLoading(false);
    }
  };

  const handleAddMed = async (e) => {
    e.preventDefault();
    if (!selectedElderId || !medForm.name || !medForm.dosage || !medForm.time) return;
    setMedLoading(true);
    try {
      await addReminder({
        userId: selectedElderId,
        medicationName: medForm.name,
        dosage: medForm.dosage,
        frequency: medForm.frequency,
        scheduledTime: medForm.time + ':00'
      });
      setMedForm({ name: '', dosage: '', time: '08:00', frequency: 'DAILY' });
      fetchData();
    } catch (err) {
      alert("Failed to add medication: " + (err.response?.data?.error || err.message));
    } finally {
      setMedLoading(false);
    }
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!selectedElderId || !apptForm.doctorName || !apptForm.date || !apptForm.time) return;
    setApptLoading(true);
    try {
      await createAppointment({
        elderId: selectedElderId,
        doctorName: apptForm.doctorName,
        clinicName: apptForm.clinicName || undefined,
        scheduledAt: new Date(`${apptForm.date}T${apptForm.time}:00`).toISOString(),
        notes: apptForm.notes || undefined
      });
      setApptForm({ doctorName: '', clinicName: '', date: '', time: '09:00', notes: '' });
      fetchData();
    } catch (err) {
      alert("Failed to add appointment: " + (err.response?.data?.error || err.message));
    } finally {
      setApptLoading(false);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const res = await downloadDocument(doc.id);
      if (res.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.setAttribute('download', res.fileName || doc.file_name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('Download URL not available');
      }
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleAssignDoctor = async (e) => {
    e.preventDefault();
    if (!selectedElderId || !selectedDoctorId) return;
    setAssignDoctorLoading(true);
    try {
      await assignDoctor(selectedElderId, selectedDoctorId);
      alert('Doctor assigned successfully.');
      setSelectedDoctorId('');
    } catch (err) {
      alert('Failed to assign doctor: ' + (err.response?.data?.error || err.message));
    } finally {
      setAssignDoctorLoading(false);
    }
  };

  const handleDeleteDocument = async (doc) => {
    try {
      await deleteDocument(doc.id);
      fetchData();
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleElderChange = (e) => {
    const id = e.target.value;
    setSelectedElderId(id);
    const elder = elders.find(el => String(el.id) === String(id));
    if(elder) setElderName(elder.username);
  };

  const latestLog    = dashboardData?.vitalsHistory?.[0];
  const medsTaken    = reminders.filter((r) => r.taken).length;
  const medsTotal    = reminders.length;
  const latestHR     = dashboardData?.vitalsHistory?.find((l) => l.heart_rate)?.heart_rate;
  const latestBP     = dashboardData?.vitalsHistory?.find((l) => l.blood_pressure)?.blood_pressure;
  const checkIns     = dashboardData?.vitalsHistory?.filter((l) => l.checkin_status === 'feeling_well' || l.status === 'feeling_well').length;
  const latestRisk   = latestLog?.health_risk_score || 'LOW';

  let overallStatus = 'Doing Well';
  let isWarning = false;

  if (latestRisk === 'CRITICAL' || latestRisk === 'HIGH') {
    overallStatus = 'Needs Action';
    isWarning = true;
  } else if (latestHR || latestBP) {
    let sys = 120, dia = 80;
    if (latestBP && latestBP.includes('/')) {
      [sys, dia] = latestBP.split('/').map(Number);
    }
    if (
      (latestHR && (latestHR < 60 || latestHR > 100)) ||
      (latestBP && (sys < 90 || sys > 140 || dia < 60 || dia > 90))
    ) {
      overallStatus = 'Needs Attention';
      isWarning = true;
    }
  }

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* Header */}
      <header className="bg-black text-white px-6 py-5 flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 to-gray-300"></div>
        <div className="flex items-center gap-3 relative z-10">
          <HeartPulse className="w-10 h-10 text-white" />
          <span className="text-3xl font-extrabold tracking-tight drop-shadow-md">ElderPing</span>
          <span className="ml-3 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/30 hidden sm:inline">
            Family View
          </span>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <button
            onClick={fetchData}
            disabled={loading || !selectedElderId}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md border border-white/10"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md border border-white/20"
          >
            <LogOut className="w-5 h-5" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Top Controls: Link Elder, Select Elder, Assign Doctor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 shadow-lg border border-white/60">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-700" /> Monitoring Elder
            </h3>
            {elders.length === 0 ? (
              <p className="text-gray-500 italic">No elders linked yet.</p>
            ) : (
              <select
                value={selectedElderId || ''}
                onChange={handleElderChange}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-800 focus:outline-none focus:border-black transition-colors"
              >
                {elders.map(e => <option key={e.id} value={e.id}>{e.username}</option>)}
              </select>
            )}
          </div>

          <div className="bg-black rounded-[2rem] p-6 shadow-lg text-white">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" /> Link New Elder
            </h3>
            <form onSubmit={handleLinkElder} className="flex gap-3">
              <input
                type="text"
                placeholder="Elder's Invite Code"
                value={linkCode}
                onChange={e => setLinkCode(e.target.value.toUpperCase())}
                className="flex-1 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-gray-400"
              />
              <button
                type="submit"
                disabled={linkLoading}
                className="bg-white text-black hover:bg-gray-100 font-bold px-6 py-3 rounded-xl transition-colors shadow-md disabled:opacity-50"
              >
                {linkLoading ? 'Linking…' : 'Link'}
              </button>
            </form>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 shadow-lg border border-white/60">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-700" /> Assign Doctor
            </h3>
            {!selectedElderId ? (
              <p className="text-gray-500 italic">Select an elder above first.</p>
            ) : doctors.length === 0 ? (
              <p className="text-gray-500 italic">No doctors registered yet.</p>
            ) : (
              <form onSubmit={handleAssignDoctor} className="flex gap-3">
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-black transition-colors"
                >
                  <option value="">Select a doctor…</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.username}</option>)}
                </select>
                <button
                  type="submit"
                  disabled={assignDoctorLoading || !selectedDoctorId}
                  className="bg-black hover:bg-gray-800 text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-md disabled:opacity-50"
                >
                  {assignDoctorLoading ? 'Assigning…' : 'Assign'}
                </button>
              </form>
            )}
          </div>
        </div>

        {!selectedElderId ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-lg">
            <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600">No Elder Selected</h2>
            <p className="text-gray-500 mt-2">Please link an elder using their invite code above.</p>
          </div>
        ) : (
          <>
            {/* Title row */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Status Dashboard</p>
                <h1 className="text-5xl font-extrabold text-gray-900 capitalize drop-shadow-sm mt-1">
                  {elderName}'s Health
                </h1>
              </div>
              <div className="text-right text-sm font-medium text-gray-500 bg-white/60 px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Status hero card */}
            <div className={`rounded-[2rem] shadow-xl p-10 mb-8 flex flex-col md:flex-row md:items-center justify-between text-white relative overflow-hidden border border-white/20 ${
              loading
                ? 'bg-gray-400'
                : !latestLog
                  ? 'bg-gray-500'
                  : isWarning
                    ? 'bg-black'
                    : 'bg-gray-700'
            }`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                  <User className="w-16 h-16" />
                </div>
                <div>
                  <p className="text-xl opacity-90 font-medium tracking-wide">Overall Status</p>
                  <p className="text-6xl font-extrabold mt-1 drop-shadow-md">
                    {loading ? 'Loading…' : latestLog ? overallStatus : 'No Data Yet'}
                  </p>
                  {latestLog && (
                    <p className="opacity-80 font-medium mt-3 bg-black/10 inline-block px-4 py-1.5 rounded-full">
                      Last check-in: {new Date(latestLog.logged_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              {latestLog && !loading && (
                isWarning 
                  ? <AlertTriangle className="w-32 h-32 opacity-20 absolute right-10 bottom-auto pointer-events-none" />
                  : <CheckCircle2 className="w-32 h-32 opacity-20 absolute right-10 bottom-auto pointer-events-none" />
              )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <StatCard icon={HeartPulse} label="Heart Rate" value={latestHR ? `${latestHR} bpm` : null} bgGradient="from-gray-50 to-gray-100" iconColor="text-gray-700" />
              <StatCard icon={TrendingUp} label="Blood Pressure" value={latestBP} bgGradient="from-gray-50 to-gray-100" iconColor="text-gray-700" />
              <StatCard icon={CheckCircle2} label="Check-ins Today" value={checkIns} bgGradient="from-gray-50 to-gray-100" iconColor="text-gray-700" />
              <StatCard icon={Pill} label="Meds Taken" value={medsTotal > 0 ? `${medsTaken}/${medsTotal}` : '—'} bgGradient="from-gray-50 to-gray-100" iconColor="text-gray-700" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-700 gap-3">
                <span className="animate-spin w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full" />
                <p className="text-xl font-bold">Loading dashboard details...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Active Alerts (if any exist) */}
                <AlertWidget alerts={dashboardData?.alerts || []} />

                {/* Primary widgets layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    {/* Add Medication Form */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-lg p-6 border border-white/60">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Plus className="w-6 h-6 text-gray-700" /> Add Medication
                      </h2>
                      <form onSubmit={handleAddMed} className="flex flex-col md:flex-row md:flex-wrap gap-4">
                        <input type="text" placeholder="Medication Name" value={medForm.name} onChange={e=>setMedForm({...medForm, name: e.target.value})} className="flex-1 min-w-[180px] bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:border-black focus:outline-none" required />
                        <input type="text" placeholder="Dosage (e.g. 1 pill)" value={medForm.dosage} onChange={e=>setMedForm({...medForm, dosage: e.target.value})} className="w-full md:w-40 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:border-black focus:outline-none" required />
                        <select value={medForm.frequency} onChange={e=>setMedForm({...medForm, frequency: e.target.value})} className="w-full md:w-36 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:border-black focus:outline-none">
                          <option value="DAILY">Daily</option>
                          <option value="TWICE_DAILY">Twice Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="AS_NEEDED">As Needed</option>
                        </select>
                        <input type="time" value={medForm.time} onChange={e=>setMedForm({...medForm, time: e.target.value})} className="w-full md:w-32 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-black focus:outline-none" required />
                        <button type="submit" disabled={medLoading} className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50">
                          {medLoading ? 'Adding...' : 'Add'}
                        </button>
                      </form>
                    </div>

                    <MedicationWidget 
                      reminders={reminders} 
                      compliance={dashboardData?.medicationAdherence} 
                    />
                  </div>

                  <div className="space-y-6">
                    <RiskScoreWidget riskScore={latestRisk} />

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-lg p-6 border border-white/60">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-gray-700" /> Add Appointment
                      </h2>
                      <form onSubmit={handleAddAppointment} className="flex flex-col gap-3">
                        <input type="text" placeholder="Doctor Name" value={apptForm.doctorName} onChange={e=>setApptForm({...apptForm, doctorName: e.target.value})} className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:border-black focus:outline-none" required />
                        <input type="text" placeholder="Clinic / Hospital (optional)" value={apptForm.clinicName} onChange={e=>setApptForm({...apptForm, clinicName: e.target.value})} className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:border-black focus:outline-none" />
                        <div className="flex gap-3">
                          <input type="date" value={apptForm.date} onChange={e=>setApptForm({...apptForm, date: e.target.value})} className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-black focus:outline-none" required />
                          <input type="time" value={apptForm.time} onChange={e=>setApptForm({...apptForm, time: e.target.value})} className="w-32 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:border-black focus:outline-none" required />
                        </div>
                        <input type="text" placeholder="Notes (optional)" value={apptForm.notes} onChange={e=>setApptForm({...apptForm, notes: e.target.value})} className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:border-black focus:outline-none" />
                        <button type="submit" disabled={apptLoading} className="bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50">
                          {apptLoading ? 'Booking...' : 'Book Appointment'}
                        </button>
                      </form>
                    </div>

                    <AppointmentWidget appointments={dashboardData?.appointments || []} />
                  </div>
                </div>

                {/* Trends, Documents & Timeline Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: SVG charts */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-extrabold text-gray-800 px-1">Vitals & Compliance Trends</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <LineChart
                        data={dashboardData?.vitalsHistory}
                        dataKey="heart_rate"
                        color="#1f2937"
                        title="Heart Rate"
                        unit=" bpm"
                      />
                      <LineChart
                        data={dashboardData?.vitalsHistory}
                        dataKey="blood_sugar"
                        color="#6b7280"
                        title="Blood Sugar"
                        unit=" mg/dL"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <BloodPressureChart data={dashboardData?.vitalsHistory} />
                      <AdherenceTrendChart 
                        weekly={dashboardData?.medicationAdherence?.weeklyAdherence} 
                        monthly={dashboardData?.medicationAdherence?.monthlyAdherence} 
                        overall={dashboardData?.medicationAdherence?.overallAdherence} 
                      />
                    </div>
                  </div>

                  {/* Right Column: Timeline & Documents */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-extrabold text-gray-800 px-1">Activity & Care Records</h3>
                    <DocumentWidget
                      documents={dashboardData?.medicalDocuments || []}
                      onDownload={handleDownloadDocument}
                      onDelete={handleDeleteDocument}
                      elderId={selectedElderId}
                    />
                    <TimelineWidget timeline={timeline || []} />
                  </div>
                </div>

                {/* Notes & AI row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <NotesWidget elderId={selectedElderId} />
                  <AIChatWidget userId={selectedElderId} />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, bgGradient, iconColor }) {
  return (
    <div className={`rounded-2xl shadow-lg p-6 bg-gradient-to-br ${bgGradient} border border-white/40`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg bg-white/60 ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-gray-700 font-bold text-sm uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-4xl font-extrabold text-gray-900 mt-2">{value ?? '—'}</p>
    </div>
  );
}
