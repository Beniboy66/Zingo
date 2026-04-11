import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';

// Auth
import Login from './pages/auth/Login';
import Solicitud from './pages/auth/Solicitud';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import Solicitudes from './pages/admin/Solicitudes';
import SolicitudDetalle from './pages/admin/SolicitudDetalle';
import RutasPendientes from './pages/admin/RutasPendientes';
import Reportes from './pages/admin/Reportes';
import Historial from './pages/admin/Historial';
import Usuarios from './pages/admin/Usuarios';
import Concesionarios from './pages/admin/Concesionarios';
import SupervisionMapa from './pages/admin/SupervisionMapa';
import Moderacion from './pages/admin/Moderacion';

// Agencia
import AgenciaDashboard from './pages/agencia/Dashboard';
import EditorRuta from './pages/agencia/EditorRuta';
import Avisos from './pages/agencia/Avisos';
import AgenciaEstadisticas from './pages/agencia/Estadisticas';
import MiCuenta from './pages/agencia/MiCuenta';

// Compartido
import Notificaciones from './pages/Notificaciones';

function RutaProtegida({ children, roles }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="spinner" />;
  if (!usuario) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/login" />;
  return children;
}

function RedireccionInicio() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="spinner" />;
  if (!usuario) return <Navigate to="/login" />;
  if (usuario.rol === 'super_admin') return <Navigate to="/admin/dashboard" />;
  if (usuario.rol === 'agencia') return <Navigate to="/agencia/dashboard" />;
  return <Navigate to="/login" />;
}

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Publicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/solicitud" element={<Solicitud />} />

      {/* Redireccion raiz */}
      <Route path="/" element={<RedireccionInicio />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><AdminDashboard /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/solicitudes" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><Solicitudes /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/solicitudes/:id" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><SolicitudDetalle /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/rutas-pendientes" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><RutasPendientes /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/reportes" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><Reportes /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/usuarios" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><Usuarios /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/concesionarios" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><Concesionarios /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/supervision" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><SupervisionMapa /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/moderacion" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><Moderacion /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/admin/historial" element={
        <RutaProtegida roles={['super_admin']}>
          <AppLayout><Historial /></AppLayout>
        </RutaProtegida>
      } />

      {/* Agencia */}
      <Route path="/agencia/dashboard" element={
        <RutaProtegida roles={['agencia']}>
          <AppLayout><AgenciaDashboard /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/agencia/editor" element={
        <RutaProtegida roles={['agencia']}>
          <AppLayout><EditorRuta /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/agencia/editor/:id" element={
        <RutaProtegida roles={['agencia']}>
          <AppLayout><EditorRuta /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/agencia/avisos" element={
        <RutaProtegida roles={['agencia']}>
          <AppLayout><Avisos /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/agencia/estadisticas" element={
        <RutaProtegida roles={['agencia']}>
          <AppLayout><AgenciaEstadisticas /></AppLayout>
        </RutaProtegida>
      } />
      <Route path="/agencia/cuenta" element={
        <RutaProtegida roles={['agencia']}>
          <AppLayout><MiCuenta /></AppLayout>
        </RutaProtegida>
      } />

      {/* Compartido */}
      <Route path="/notificaciones" element={
        <RutaProtegida roles={['super_admin', 'agencia']}>
          <AppLayout><Notificaciones /></AppLayout>
        </RutaProtegida>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
