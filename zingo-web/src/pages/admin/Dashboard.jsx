import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/admin/estadisticas')
      .then(({ data }) => setStats(data.datos))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <h1 className="pagina-titulo">Dashboard</h1>

      <div className="stats-grid">
        <Link to="/admin/solicitudes" className="stat-card">
          <div className="stat-icono" style={{ background: '#FFF3E0' }}>
            <Icon name="clipboard" size={22} color="#E65100" />
          </div>
          <div className="stat-info">
            <span className="stat-numero">{stats?.agenciasPendientes || 0}</span>
            <span className="stat-label">Solicitudes Pendientes</span>
          </div>
        </Link>

        <Link to="/admin/rutas-pendientes" className="stat-card">
          <div className="stat-icono" style={{ background: '#E3F2FD' }}>
            <Icon name="map" size={22} color="#1565C0" />
          </div>
          <div className="stat-info">
            <span className="stat-numero">{stats?.rutasPorRevisar || 0}</span>
            <span className="stat-label">Rutas por Revisar</span>
          </div>
        </Link>

        <Link to="/admin/reportes" className="stat-card">
          <div className="stat-icono" style={{ background: '#FFEBEE' }}>
            <Icon name="flag" size={22} color="#C62828" />
          </div>
          <div className="stat-info">
            <span className="stat-numero">{stats?.reportesPendientes || 0}</span>
            <span className="stat-label">Reportes Activos</span>
          </div>
        </Link>

        <div className="stat-card">
          <div className="stat-icono" style={{ background: '#E8F5E9' }}>
            <Icon name="building" size={22} color="#2E7D32" />
          </div>
          <div className="stat-info">
            <span className="stat-numero">{stats?.totalAgencias || 0}</span>
            <span className="stat-label">Agencias Registradas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icono" style={{ background: '#F3E5F5' }}>
            <Icon name="bus" size={22} color="#6A1B9A" />
          </div>
          <div className="stat-info">
            <span className="stat-numero">{stats?.rutasPublicadas || 0}</span>
            <span className="stat-label">Rutas Publicadas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icono" style={{ background: '#E0F2F1' }}>
            <Icon name="users" size={22} color="#00695C" />
          </div>
          <div className="stat-info">
            <span className="stat-numero">{stats?.totalUsuarios || 0}</span>
            <span className="stat-label">Usuarios</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icono" style={{ background: '#FFF8E1' }}>
            <Icon name="eye" size={22} color="#F57F17" />
          </div>
          <div className="stat-info">
            <span className="stat-numero">{stats?.consultasTotales || 0}</span>
            <span className="stat-label">Consultas Totales</span>
          </div>
        </div>
      </div>
    </div>
  );
}
