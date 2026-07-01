import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, LogOut, RefreshCw, Stethoscope } from 'lucide-react';
import { getCachedUser, logout, getMyPatients } from '../api/authApi';
import {
  getElderDashboard,
  getTimeline,
  uploadDocument,
  downloadDocument,
  deleteDocument
} from '../api/healthApi';
import {
  RiskScoreWidget,
  HealthSummaryWidget,
  MedicationWidget,
  AppointmentWidget,
  TimelineWidget,
  DocumentWidget,
  NotesWidget
} from '../components/DashboardWidgets';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const user = getCachedUser();

  const [patients, setPatients] = useState([]);
  const [selectedElderId, setSelectedElderId] = useState(null);
  const [patientName, setPatientName] = useState('');

  const [dashboardData, setDashboardData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (!user || (user.role || '').toUpperCase() !== 'DOCTOR') navigate('/login', { replace: true });
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await getMyPatients();
      setPatients(data);
      if (data.length > 0 && !selectedElderId) {
        setSelectedElderId(data[0].id);
        setPatientName(data[0].username);
      }
    } catch (err) {
      setFetchError('Could not load assigned patients.');
    }
  }, [selectedElderId]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const fetchData = useCallback(async () => {
    if (!selectedElderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError('');
    try {
      const [data, timelineEvents] = await Promise.all([
        getElderDashboard(selectedElderId),
        getTimeline(selectedElderId)
      ]);
      setDashboardData(data);
      setTimeline(timelineEvents);
    } catch (err) {
      setFetchError(err.message || 'Failed to load patient dashboard.');
    } finally {
      setLastRefresh(new Date());
      setLoading(false);
    }
  }, [selectedElderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePatientChange = (e) => {
    const id = e.target.value;
    setSelectedElderId(id);
    const patient = patients.find(p => String(p.id) === String(id));
    if (patient) setPatientName(patient.username);
  };

  const handleUploadDocument = async (formData) => {
    setUploadLoading(true);
    try {
      await uploadDocument(formData);
      await fetchData();
      return true;
    } catch (err) {
      alert('Document upload failed: ' + (err.response?.data?.error || err.message));
      return false;
    } finally {
      setUploadLoading(false);
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
      alert('Download failed: ' + err.message);
    }
  };

  const handleDeleteDocument = async (doc) => {
    try {
      await deleteDocument(doc.id);
      await fetchData();
    } catch (err) {
      alert('Deletion failed: ' + err.message);
    }
  };

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
            Doctor View
          </span>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <button
            onClick={() => { fetchPatients(); fetchData(); }}
            disabled={loading}
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

        {/* Patient selector */}
        <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 shadow-lg border border-white/60 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-gray-700" /> My Patients
          </h3>
          {patients.length === 0 ? (
            <p className="text-gray-500 italic">No patients assigned yet. A family member must assign you to their elder first.</p>
          ) : (
            <select
              value={selectedElderId || ''}
              onChange={handlePatientChange}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-800 focus:outline-none focus:border-black transition-colors"
            >
              {patients.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
            </select>
          )}
        </div>

        {fetchError && (
          <div className="mb-6 bg-gray-100 border-2 border-gray-800 text-gray-900 rounded-2xl p-5 text-lg font-semibold text-center">
            {fetchError}
          </div>
        )}

        {!selectedElderId ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-lg">
            <Stethoscope className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600">No Patient Selected</h2>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 px-2">
              <div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Patient Record</p>
                <h1 className="text-5xl font-extrabold text-gray-900 capitalize drop-shadow-sm mt-1">
                  {patientName}
                </h1>
              </div>
              <div className="text-right text-sm font-medium text-gray-500 bg-white/60 px-4 py-2 rounded-full shadow-sm">
                Updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-700 gap-3">
                <span className="animate-spin w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full" />
                <p className="text-xl font-bold">Loading patient details...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <RiskScoreWidget riskScore={dashboardData?.riskScore} />
                    <HealthSummaryWidget summary={dashboardData?.vitalsSummary} />
                    <MedicationWidget
                      reminders={dashboardData?.medicationStatus?.reminders || []}
                      compliance={dashboardData?.medicationStatus?.compliance}
                    />
                    <AppointmentWidget appointments={dashboardData?.upcomingAppointments || []} />
                  </div>
                  <div className="space-y-6">
                    <DocumentWidget
                      documents={dashboardData?.medicalDocuments || []}
                      onUpload={handleUploadDocument}
                      onDownload={handleDownloadDocument}
                      onDelete={handleDeleteDocument}
                      uploadLoading={uploadLoading}
                      elderId={selectedElderId}
                    />
                    <TimelineWidget timeline={timeline || []} />
                  </div>
                </div>

                <NotesWidget elderId={selectedElderId} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
