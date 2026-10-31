import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PortalLayout from './components/PortalLayout';
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DoctorDashboardPage = lazy(() => import('./pages/doctor/DoctorDashboardPage'));
const ConnectionCodePage = lazy(() => import('./pages/patient/ConnectionCodePage'));
const DoctorSearchPage = lazy(() => import('./pages/patient/DoctorSearchPage'));
const PatientDashboardPage = lazy(() => import('./pages/patient/PatientDashboardPage'));
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/shared/SettingsPage'));
const AppointmentsPage = lazy(() => import('./pages/shared/AppointmentsPage'));
const AIInsightsPage = lazy(() => import('./pages/shared/AIInsightsPage'));
const MedicalHistoryPage = lazy(() => import('./pages/patient/MedicalHistoryPage'));
const EmergencyPage = lazy(() => import('./pages/patient/EmergencyPage'));
const MedicineOverviewPage = lazy(() => import('./pages/patient/MedicineOverviewPage'));
const PatientAnalyticsPage = lazy(() => import('./pages/patient/PatientAnalyticsPage'));
const PatientManagementPage = lazy(() => import('./pages/doctor/PatientManagementPage'));
const DoctorAnalyticsPage = lazy(() => import('./pages/doctor/DoctorAnalyticsPage'));
const MedicineCatalogPage = lazy(() => import('./pages/doctor/MedicineCatalogPage'));
const PrescriptionsPage = lazy(() => import('./pages/doctor/PrescriptionsPage'));

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center text-slate-500">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <PortalLayout />;
};

const RoleRoute = ({ allowedRole, children }) => {
  const { user } = useAuth();
  if (user?.role !== allowedRole) return <Navigate to={user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  return children;
};

export default function App() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading MEDICO…</div>}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'} replace /> : <LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/doctor/dashboard" element={<RoleRoute allowedRole="DOCTOR"><DoctorDashboardPage /></RoleRoute>} />
        <Route path="/doctor/patient-queue" element={<RoleRoute allowedRole="DOCTOR"><PatientManagementPage queueOnly /></RoleRoute>} />
        <Route path="/doctor/patients" element={<RoleRoute allowedRole="DOCTOR"><PatientManagementPage /></RoleRoute>} />
        <Route path="/doctor/appointments" element={<RoleRoute allowedRole="DOCTOR"><AppointmentsPage /></RoleRoute>} />
        <Route path="/doctor/prescriptions" element={<RoleRoute allowedRole="DOCTOR"><PrescriptionsPage /></RoleRoute>} />
        <Route path="/doctor/medicines" element={<RoleRoute allowedRole="DOCTOR"><MedicineCatalogPage /></RoleRoute>} />
        <Route path="/doctor/analytics" element={<RoleRoute allowedRole="DOCTOR"><DoctorAnalyticsPage /></RoleRoute>} />
        <Route path="/doctor/insights" element={<RoleRoute allowedRole="DOCTOR"><AIInsightsPage /></RoleRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/patient/dashboard" element={<RoleRoute allowedRole="PATIENT"><PatientDashboardPage /></RoleRoute>} />
        <Route path="/patient/search-doctors" element={<RoleRoute allowedRole="PATIENT"><DoctorSearchPage /></RoleRoute>} />
        <Route path="/patient/connection-code" element={<RoleRoute allowedRole="PATIENT"><ConnectionCodePage /></RoleRoute>} />
        <Route path="/patient/medicines" element={<RoleRoute allowedRole="PATIENT"><MedicineOverviewPage /></RoleRoute>} />
        <Route path="/patient/appointments" element={<RoleRoute allowedRole="PATIENT"><AppointmentsPage /></RoleRoute>} />
        <Route path="/patient/history" element={<RoleRoute allowedRole="PATIENT"><MedicalHistoryPage /></RoleRoute>} />
        <Route path="/patient/emergency" element={<RoleRoute allowedRole="PATIENT"><EmergencyPage /></RoleRoute>} />
        <Route path="/patient/analytics" element={<RoleRoute allowedRole="PATIENT"><PatientAnalyticsPage /></RoleRoute>} />
        <Route path="/patient/ai-insights" element={<RoleRoute allowedRole="PATIENT"><AIInsightsPage /></RoleRoute>} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
