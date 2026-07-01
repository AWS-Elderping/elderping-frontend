import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, UserPlus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { register } from '../api/authApi';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState('family');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await register({ email, password, role });
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-md rounded-full shadow-xl mb-4 border border-white/20">
            <HeartPulse className="w-14 h-14 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">ElderPing</h1>
          <p className="text-white/70 mt-2 text-xl font-medium">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-10 border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-700 to-black"></div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">Register</h2>

          {error && (
            <div className="mb-6 bg-gray-100 border-2 border-gray-800 text-gray-900 rounded-xl p-4 text-lg font-semibold text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-gray-900 border-2 border-black text-white rounded-xl p-4 text-lg font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2" htmlFor="reg-email">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-xl text-gray-800 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  required
                  minLength={6}
                  className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-xl text-gray-800 focus:outline-none focus:border-black transition-colors pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
                </button>
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-3">I am a…</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'elder',  label: 'Elder',  desc: 'Check-in & meds' },
                  { value: 'family', label: 'Family', desc: 'Monitor loved one' },
                  { value: 'doctor', label: 'Doctor', desc: 'Manage patient records' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    id={`role-${opt.value}`}
                    onClick={() => setRole(opt.value)}
                    className={`rounded-2xl border-2 p-4 text-left transition-all ${
                      role === opt.value
                        ? 'border-black bg-gray-100 shadow-md ring-2 ring-black/20'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-lg font-bold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white text-xl font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="animate-spin inline-block w-6 h-6 border-4 border-white/30 border-t-white rounded-full" />
              ) : (
                <UserPlus className="w-6 h-6" />
              )}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-lg mt-8 font-medium">
            Already have an account?{' '}
            <Link id="go-to-login" to="/login" className="text-gray-900 font-bold underline hover:text-black transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
