import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ElderDashboard from './pages/ElderDashboard';
import FamilyDashboard from './pages/FamilyDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Role-specific landing subdomains (doctor./family./elder.elderping.online)
// land directly on their dashboard instead of the generic login screen.
// Each dashboard already bounces to /login itself if the cached user is
// missing or has the wrong role, so this is just a friendlier entry point,
// not an access control mechanism.
const SUBDOMAIN_LANDING = {
  doctor: '/doctor',
  family: '/family',
  elder: '/elder',
};

const getDefaultRoute = () => {
  const subdomain = window.location.hostname.split('.')[0];
  return SUBDOMAIN_LANDING[subdomain] || '/login';
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/elder"       element={<ElderDashboard />} />
        <Route path="/family"      element={<FamilyDashboard />} />
        <Route path="/doctor"      element={<DoctorDashboard />} />
        <Route path="/admin"       element={<AdminDashboard />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="*"            element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
