import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle, LogOut, Terminal, DollarSign, BrainCircuit, CheckCircle, XCircle } from 'lucide-react';
import { getFinopsDashboard, getFinopsRecommendations, applyRecommendation, dismissRecommendation } from '../api/finopsApi';
import { listAuditEvents } from '../api/auditApi';
import { getAiInteractions } from '../api/aiApi';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('finops');
  const [userProfile, setUserProfile] = useState(null);

  const [finopsData, setFinopsData] = useState(null);
  const [finopsLoading, setFinopsLoading] = useState(false);
  const [finopsError, setFinopsError] = useState(null);

  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  const [aiUsage, setAiUsage] = useState([]);
  const [aiUsageLoading, setAiUsageLoading] = useState(false);
  const [aiUsageError, setAiUsageError] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    const user = JSON.parse(raw);
    if (user.role !== 'SUPER_ADMIN') { navigate('/login'); return; }
    setUserProfile(user);

    const loadFinops = async () => {
      setFinopsLoading(true);
      try {
        const dash = await getFinopsDashboard();
        setFinopsData(dash);
      } catch (err) {
        setFinopsError(err.message);
      } finally {
        setFinopsLoading(false);
      }

      setRecsLoading(true);
      try {
        const recs = await getFinopsRecommendations();
        setRecommendations(Array.isArray(recs) ? recs : []);
      } catch (_) {
        // recommendations optional — don't block the page
      } finally {
        setRecsLoading(false);
      }
    };

    loadFinops();
  }, [navigate]);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const result = await listAuditEvents();
      setAuditLogs(result.events || []);
    } catch (err) {
      setAuditError(err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadAiUsage = async () => {
    setAiUsageLoading(true);
    setAiUsageError(null);
    try {
      const result = await getAiInteractions();
      setAiUsage(Array.isArray(result) ? result : []);
    } catch (err) {
      setAiUsageError(err.message);
    } finally {
      setAiUsageLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit' && auditLogs.length === 0 && !auditLoading) loadAuditLogs();
    if (activeTab === 'ai' && aiUsage.length === 0 && !aiUsageLoading) loadAiUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleApply = async (id) => {
    try {
      await applyRecommendation(id);
      setRecommendations(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(`Failed to apply recommendation: ${err.message}`);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissRecommendation(id);
      setRecommendations(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(`Failed to dismiss recommendation: ${err.message}`);
    }
  };

  const getCost = (service) =>
    finopsData?.topCostDrivers?.find(d => d.service === service)?.cost ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-100">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <ShieldAlert className="w-10 h-10 text-white" />
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Console</h1>
          </div>

          <nav className="space-y-4">
            <button
              onClick={() => setActiveTab('finops')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium transition-colors ${activeTab === 'finops' ? 'bg-white text-black' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <DollarSign className="w-6 h-6" /> FinOps Cost Center
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium transition-colors ${activeTab === 'audit' ? 'bg-white text-black' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Terminal className="w-6 h-6" /> Audit Log Ledgers
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium transition-colors ${activeTab === 'ai' ? 'bg-white text-black' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <BrainCircuit className="w-6 h-6" /> Bedrock AI Usage
            </button>
          </nav>
        </div>

        <div>
          <div className="border-t border-slate-800 pt-6 mb-6">
            <div className="text-sm text-slate-400">Signed In As</div>
            <div className="font-semibold text-white">{userProfile?.username || 'Super Admin'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-white text-slate-300 hover:text-black flex items-center justify-center gap-3 py-3 rounded-xl transition-all border border-slate-700"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight">Super Admin Dashboard</h2>
          <p className="text-slate-400 mt-2 text-lg">Cloud governance, security hub telemetry, real-time AWS usage audit logging.</p>
        </header>

        {activeTab === 'finops' && (
          <div className="space-y-8">
            {finopsError && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3 text-white">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{finopsError}</span>
              </div>
            )}

            {/* Cost cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-sm">Monthly Accumulated Cost</div>
                <div className="text-3xl font-bold mt-2">
                  {finopsLoading ? '...' : finopsData ? `$${finopsData.totalMonthlyCost.toFixed(2)}` : '--'}
                </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-sm">EKS Cluster Allocation</div>
                <div className="text-3xl font-bold mt-2">
                  {finopsLoading ? '...' : finopsData ? `$${getCost('EKS').toFixed(2)}` : '--'}
                </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-sm">RDS Multi-AZ Clusters</div>
                <div className="text-3xl font-bold mt-2">
                  {finopsLoading ? '...' : finopsData ? `$${getCost('RDS').toFixed(2)}` : '--'}
                </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <div className="text-slate-400 text-sm">Amazon Bedrock Queries</div>
                <div className="text-3xl font-bold mt-2">
                  {finopsLoading ? '...' : finopsData ? `$${getCost('Bedrock').toFixed(2)}` : '--'}
                </div>
              </div>
            </div>

            {/* Forecast + Recommendation summary */}
            {finopsData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-sm">Monthly Forecast</div>
                  <div className="text-3xl font-bold mt-2">${finopsData.monthlyForecast.toFixed(2)}</div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-sm">Open Optimization Recommendations</div>
                  <div className="text-3xl font-bold mt-2 text-white">
                    {finopsData.recommendationSummary.count}{' '}
                    <span className="text-sm text-slate-400 font-normal">
                      saving up to ${finopsData.recommendationSummary.potentialSavings.toFixed(2)}/mo
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <BrainCircuit className="w-7 h-7" /> AI-Generated Cost Optimizations
              </h3>
              {recsLoading ? (
                <div className="text-slate-400 text-center py-8">Loading recommendations...</div>
              ) : recommendations.length === 0 ? (
                <div className="text-slate-500 text-center py-8">No open recommendations.</div>
              ) : (
                <div className="space-y-6">
                  {recommendations.map(r => (
                    <div key={r.id} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-start">
                      <div className="flex-1 mr-6">
                        <span className="text-white font-bold bg-slate-700 px-3 py-1 rounded-full text-xs uppercase">{r.category}</span>
                        <p className="text-lg font-semibold mt-3 text-slate-200">{r.finding}</p>
                        <p className="text-sm text-slate-400 mt-2">Action: {r.action_item}</p>
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleApply(r.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-200 text-black text-sm font-semibold rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Apply
                          </button>
                          <button
                            onClick={() => handleDismiss(r.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Dismiss
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-500 uppercase block">Estimated Savings</span>
                        <span className="text-2xl font-extrabold text-white block mt-1">
                          ${parseFloat(r.potential_savings || 0).toFixed(2)}/mo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'audit' && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Security Audit Ledgers</h3>
              <button
                onClick={loadAuditLogs}
                disabled={auditLoading}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-white text-slate-300 hover:text-black transition-colors disabled:opacity-50"
              >
                {auditLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {auditError && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6 text-white">{auditError}</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 uppercase text-sm font-semibold">
                    <th className="py-4">Time</th>
                    <th className="py-4">Action</th>
                    <th className="py-4">Entity</th>
                    <th className="py-4">Actor</th>
                    <th className="py-4">Role</th>
                    <th className="py-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 text-lg">
                  {auditLoading ? (
                    <tr><td colSpan="6" className="py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : auditLogs.length === 0 ? (
                    <tr><td colSpan="6" className="py-8 text-center text-slate-500">No audit events recorded yet.</td></tr>
                  ) : auditLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="py-4 font-mono text-slate-200 text-sm">{l.action}</td>
                      <td className="py-4 text-slate-500">{l.resource}</td>
                      <td className="py-4 font-medium">{l.actor_email || l.actor_id}</td>
                      <td className="py-4 text-slate-400 text-sm uppercase">{l.actor_role}</td>
                      <td className="py-4 font-mono text-xs text-slate-400">{l.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'ai' && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">AWS Bedrock Token Transactions</h3>
              <button
                onClick={loadAiUsage}
                disabled={aiUsageLoading}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-white text-slate-300 hover:text-black transition-colors disabled:opacity-50"
              >
                {aiUsageLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {aiUsageError && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6 text-white">{aiUsageError}</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 uppercase text-sm font-semibold">
                    <th className="py-4">Timestamp</th>
                    <th className="py-4">Model ID</th>
                    <th className="py-4">Capability</th>
                    <th className="py-4">Input Tokens</th>
                    <th className="py-4">Output Tokens</th>
                    <th className="py-4">Estimated Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 text-lg">
                  {aiUsageLoading ? (
                    <tr><td colSpan="6" className="py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : aiUsage.length === 0 ? (
                    <tr><td colSpan="6" className="py-8 text-center text-slate-500">No AI usage recorded yet.</td></tr>
                  ) : aiUsage.map(a => (
                    <tr key={a.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4">{new Date(a.created_at).toLocaleTimeString()}</td>
                      <td className="py-4 font-mono text-xs">{a.model_id}</td>
                      <td className="py-4 font-medium uppercase text-sm">{a.capability}</td>
                      <td className="py-4 text-slate-400">{a.input_tokens}</td>
                      <td className="py-4 text-slate-400">{a.output_tokens}</td>
                      <td className="py-4 font-mono text-slate-200 text-sm">${parseFloat(a.estimated_cost || 0).toFixed(5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
