import { useState, useEffect } from 'react';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Admin.css';

export default function RutasPendientes() {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const { data } = await api.get('/admin/rutas-pendientes');
      setRutas(data.datos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const aprobar = async (id) => {
    try {
      await api.put(`/admin/rutas/${id}/aprobar`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error');
    }
  };

  const rechazar = async (id) => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;
    try {
      await api.put(`/admin/rutas/${id}/rechazar`, { motivo });
      cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error');
    }
  };

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <h1 className="pagina-titulo">Rutas por Revisar</h1>

      {rutas.length === 0 ? (
        <div className="vacio-estado card">
          <div className="vacio-icono">
            <Icon name="map" size={48} color="var(--color-texto-secundario)" />
          </div>
          <h3>Sin rutas pendientes</h3>
          <p>No hay rutas en revision por el momento.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {rutas.map((ruta) => (
            <div key={ruta._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3>{ruta.nombre}</h3>
                <span className="badge badge-en-revision">En revision</span>
              </div>
              <p style={{ color: 'var(--color-texto-secundario)', fontSize: '0.85rem', marginBottom: 12 }}>
                {ruta.descripcion || 'Sin descripcion'}
              </p>
              <div style={{ fontSize: '0.85rem', marginBottom: 16 }}>
                <div><strong>Tarifa:</strong> ${ruta.tarifa}</div>
                <div><strong>Horario:</strong> {ruta.horarioInicio} - {ruta.horarioFin}</div>
                <div><strong>Frecuencia:</strong> Cada {ruta.frecuenciaMin} min</div>
                <div><strong>Dias:</strong> {ruta.diasOperacion}</div>
                <div><strong>Agencia:</strong> {ruta.agenciaId?.nombre || 'N/A'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-exito" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => aprobar(ruta._id)}>
                  <Icon name="check" size={15} color="#fff" /> Aprobar
                </button>
                <button className="btn btn-error" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => rechazar(ruta._id)}>
                  <Icon name="x" size={15} color="#fff" /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
