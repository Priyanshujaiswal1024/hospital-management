import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }  from './auth/AuthContext';
import ProtectedRoute             from './components/ProtectedRoute';

import LandingPage    from './pages/LandingPage';
import VerifyOtp      from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import OAuth2Callback from './pages/OAuth2Callback';

// ── patient ──
import PatientLayout      from './pages/patient/PatientLayout';
import PatientProfile     from './pages/patient/PatientProfile';
import CreateProfile      from './pages/patient/CreateProfile';
import Appointments       from './pages/patient/Appointments';
import FindDoctors        from './pages/patient/FindDoctors';
import BookAppointment    from './pages/patient/BookAppointment';
import Departments        from './pages/patient/Departments';
import Prescriptions      from './pages/patient/Prescriptions';
import Bills              from './pages/patient/Bills';
import Insurance          from './pages/patient/Insurance';
import MedicalRecords     from './pages/patient/MedicalRecords';
import Medicines          from './pages/patient/Medicines';

// ── doctor ──
import DoctorLayout         from './pages/doctor/DoctorLayout';
import DoctorDashboard      from './pages/doctor/DoctorDashboard';
import DoctorAppointments   from './pages/doctor/DoctorAppointments';
import SetAvailability      from './pages/doctor/SetAvailability';
import DoctorProfile        from './pages/doctor/DoctorProfile';
import DoctorMedicines      from './pages/doctor/DoctorMedicines';
import DoctorPrescriptions  from './pages/doctor/DoctorPrescriptions';
import DoctorMedicalRecords from './pages/doctor/DoctorMedicalRecords';
import AddPrescription      from './pages/doctor/AddPrescription';
import CreateMedicalRecord  from './pages/doctor/CreateMedicalRecord';
import ViewPrescription     from './pages/doctor/ViewPrescription.jsx';
import ViewMedicalRecord    from './pages/doctor/ViewMedicalRecord';

// ── admin ──
import AdminLayout      from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Admindashboard';
import AdminDoctors     from './pages/admin/AdminDoctors.jsx';
import { AdminPatients, AdminAppointments, AdminDepartments, AdminMedicines, AdminBills } from './pages/admin/AdminPages.jsx';
import AdminProfile     from './pages/admin/AdminProfile';

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  // ✅ Handle BOTH formats
  const role = user.role                          // normal login → "PATIENT"
      || user.roles?.[0]?.replace('ROLE_', '')    // google login → "ROLE_PATIENT"
      || '';

  if (role === 'PATIENT') return <Navigate to="/patient/profile" replace />;
  if (role === 'DOCTOR')  return <Navigate to="/doctor/dashboard" replace />;
  if (role === 'ADMIN')   return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* ── public ── */}
            <Route path="/"                element={<LandingPage />} />
            <Route path="/role-redirect"   element={<RoleRedirect />} />
            <Route path="/verify-otp"      element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/oauth2/callback" element={<OAuth2Callback />} /> {/* ✅ */}

            {/* ── patient: create-profile outside layout ── */}
            <Route path="/patient/create-profile" element={
              <ProtectedRoute allowedRole="PATIENT">
                <CreateProfile />
              </ProtectedRoute>
            } />

            {/* ── patient ── */}
            <Route path="/patient" element={
              <ProtectedRoute allowedRole="PATIENT">
                <PatientLayout />
              </ProtectedRoute>
            }>
              <Route index                         element={<Navigate to="profile" />} />
              <Route path="profile"               element={<PatientProfile />} />
              <Route path="appointments"          element={<Appointments />} />
              <Route path="doctors"               element={<FindDoctors />} />
              <Route path="doctors/:doctorId/book"element={<BookAppointment />} />
              <Route path="departments"           element={<Departments />} />
              <Route path="prescriptions"         element={<Prescriptions />} />
              <Route path="bills"                 element={<Bills />} />
              <Route path="insurance"             element={<Insurance />} />
              <Route path="medical-records"       element={<MedicalRecords />} />
              <Route path="medicines"             element={<Medicines />} />
            </Route>

            {/* ── doctor ── */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRole="DOCTOR">
                <DoctorLayout />
              </ProtectedRoute>
            }>
              <Route index                element={<Navigate to="dashboard" />} />
              <Route path="dashboard"     element={<DoctorDashboard />} />
              <Route path="appointments"  element={<DoctorAppointments />} />
              <Route path="availability"  element={<SetAvailability />} />
              <Route path="profile"       element={<DoctorProfile />} />
              <Route path="medicines"     element={<DoctorMedicines />} />
              <Route path="prescriptions" element={<DoctorPrescriptions />} />
              <Route path="records"       element={<DoctorMedicalRecords />} />

              {/* Create */}
              <Route path="appointments/:appointmentId/prescription" element={<AddPrescription />} />
              <Route path="appointments/:appointmentId/record"       element={<CreateMedicalRecord />} />

              {/* View */}
              <Route path="prescriptions/:prescriptionId" element={<ViewPrescription />} />
              <Route path="medical-records/:recordId"     element={<ViewMedicalRecord />} />
            </Route>

            {/* ── admin ── */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index               element={<Navigate to="dashboard" />} />
              <Route path="dashboard"    element={<AdminDashboard />} />
              <Route path="doctors"      element={<AdminDoctors />} />
              <Route path="patients"     element={<AdminPatients />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="departments"  element={<AdminDepartments />} />
              <Route path="medicines"    element={<AdminMedicines />} />
              <Route path="bills"        element={<AdminBills />} />
              <Route path="profile"      element={<AdminProfile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}