import { useState, useEffect } from 'react';
import api from '../services/api';
import Icon from '../components/Icon';

const ICONOS = {
  ruta_creada: 'map',
  ruta_actualizada: 'edit',
  ruta_eliminada: 'trash',
  reporte_nuevo: 'flag',
  reporte_validado: 'check-circle',
  cuenta_nueva: 'person-add',
  cuenta_aprobada: 'check-circle',
  cuenta_rechazada: 'x-circle',
  aviso_nuevo: 'megaphone',
};

const COLORES = {
  ruta_creada: '#1565C0',
  ruta_actualizada: '#F57F17',
  ruta_eliminada: '#C62828',
  reporte_nuevo: '#E65100',
  reporte_validado: '#2E7D32',
  cuenta_nueva: '#1565C0',
  cuenta_aprobada: '#2E7D32',
  cuenta_rechazada: '#C62828',
  aviso_nuevo: '#6A1B9A',
};

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const { data } = await api.get('/notificaciones');
      // Handle both formats: datos = [...] or datos = { notificaciones: [...], noLeidas }
      const lista = Array.isArray(data.datos) ? data.datos : (data.datos?.notificaciones || []);
      setNotificaciones(lista);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setCargando(false);
    }
  };

  const marcarLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}`);
      setNotificaciones((prev) => prev.map((n) => n._id === id ? { ...n, leida: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const marcarTodas = async () => {
    try {
      await api.put('/notificaciones/leer-todas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Notificaciones</h1>
        {notificaciones.some((n) => !n.leida) && (
          <button className="btn btn-secundario" onClick={marcarTodas}>Marcar todas como leidas</button>
        )}
      </div>

      {notificaciones.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--color-texto-secundario)' }}>
          <Icon name="bell" size={48} color="var(--color-texto-secundario)" style={{ margin: '0 auto 12px' }} />
          <h3>Sin notificaciones</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notificaciones.map((n) => (
            <div
              key={n._id}
              className="card"
              style={{
                padding: '16px 20px',
                cursor: n.leida ? 'default' : 'pointer',
                opacity: n.leida ? 0.7 : 1,
                borderLeft: n.leida ? 'none' : '3px solid var(--color-primario)'
              }}
              onClick={() => !n.leida && marcarLeida(n._id)}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: n.leida ? 'var(--color-fondo)' : '#E8F0FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon
                    name={ICONOS[n.tipo] || 'bell'}
                    size={18}
                    color={n.leida ? 'var(--color-texto-secundario)' : (COLORES[n.tipo] || 'var(--color-primario)')}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.titulo}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', marginTop: 4 }}>{n.mensaje}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', marginTop: 6 }}>
                    {new Date(n.createdAt).toLocaleString('es-MX')}
                  </div>
                </div>
                {!n.leida && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primario)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
