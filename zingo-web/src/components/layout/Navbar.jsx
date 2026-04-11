import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (usuario) {
      api.get('/notificaciones')
        .then(({ data }) => setNotificacionesNoLeidas(data.noLeidas || 0))
        .catch(() => {});
    }
  }, [usuario, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const esAdmin = usuario?.rol === 'super_admin';
  const esAgencia = usuario?.rol === 'agencia';

  const enlaces = esAdmin ? [
    { ruta: '/admin/dashboard', texto: 'Dashboard' },
    { ruta: '/admin/solicitudes', texto: 'Solicitudes' },
    { ruta: '/admin/rutas-pendientes', texto: 'Rutas' },
    { ruta: '/admin/reportes', texto: 'Reportes' },
    { ruta: '/admin/historial', texto: 'Historial' },
  ] : esAgencia ? [
    { ruta: '/agencia/dashboard', texto: 'Mis Rutas' },
    { ruta: '/agencia/editor', texto: 'Nueva Ruta' },
    { ruta: '/agencia/avisos', texto: 'Avisos' },
    { ruta: '/agencia/estadisticas', texto: 'Estadisticas' },
    { ruta: '/agencia/cuenta', texto: 'Mi Cuenta' },
  ] : [];

  return (
    <nav className="navbar">
      <div className="navbar-contenido">
        <Link to="/" className="navbar-logo">
          <span className="logo-texto">Zingo</span>
        </Link>

        <div className={`navbar-enlaces ${menuAbierto ? 'abierto' : ''}`}>
          {enlaces.map((e) => (
            <Link
              key={e.ruta}
              to={e.ruta}
              className={`navbar-enlace ${location.pathname === e.ruta ? 'activo' : ''}`}
              onClick={() => setMenuAbierto(false)}
            >
              {e.texto}
            </Link>
          ))}
        </div>

        <div className="navbar-acciones">
          {usuario && (
            <>
              <Link to="/notificaciones" className="navbar-notificaciones">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificacionesNoLeidas > 0 && (
                  <span className="badge-notificacion">{notificacionesNoLeidas}</span>
                )}
              </Link>
              <div className="navbar-usuario">
                <span className="navbar-nombre">{usuario.nombre}</span>
                <button onClick={handleLogout} className="btn-logout">Salir</button>
              </div>
            </>
          )}
        </div>

        <button className="navbar-menu-toggle" onClick={() => setMenuAbierto(!menuAbierto)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuAbierto ? <path d="M18 6L6 18M6 6l12 12" /> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
          </svg>
        </button>
      </div>
    </nav>
  );
}
