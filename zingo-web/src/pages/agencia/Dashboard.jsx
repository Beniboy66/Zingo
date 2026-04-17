import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useModal } from '../../components/Modal';
import Icon from '../../components/Icon';
import './Agencia.css';

const ESTADOS = {
  borrador: 'Borrador',
  en_revision: 'En Revision',
  publicada: 'Publicada',
  despublicada: 'Despublicada',
  edicion_pendiente: 'Edicion Pendiente'
};

export default function AgenciaDashboard() {
  const { usuario } = useAuth();
  const { mostrarConfirmar, mostrarError } = useModal();
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (usuario) {
      api.get(`/rutas/agencia/${usuario._id}`)
        .then(({ data }) => setRutas(data.datos || []))
        .catch(() => {})
        .finally(() => setCargando(false));
    }
  }, [usuario]);

  const eliminarRuta = async (id) => {
    if (!await mostrarConfirmar('Se eliminara la ruta y todas sus paradas. Esta accion no se puede deshacer.', { titulo: 'Eliminar ruta', textoAceptar: 'Eliminar', destructivo: true })) return;
    try {
      await api.delete(`/rutas/${id}`);
      setRutas((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      mostrarError(err.response?.data?.mensaje || 'Error al eliminar la ruta.');
    }
  };

  const enviarRevision = async (id) => {
    try {
      await api.put(`/rutas/${id}`, { estado: 'en_revision' });
      setRutas((prev) => prev.map((r) => r._id === id ? { ...r, estado: 'en_revision' } : r));
    } catch (err) {
      mostrarError(err.response?.data?.mensaje || 'Error al enviar a revision.');
    }
  };

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Mis Rutas</h1>
        <Link to="/agencia/editor" className="btn btn-primario">+ Nueva Ruta</Link>
      </div>

      {rutas.length === 0 ? (
        <div className="vacio-estado card">
          <div className="vacio-icono">
            <Icon name="map" size={48} color="var(--color-texto-secundario)" />
          </div>
          <h3>Sin rutas</h3>
          <p>Crea tu primera ruta haciendo click en "Nueva Ruta".</p>
        </div>
      ) : (
        <div className="grid-cards">
          {rutas.map((ruta) => (
            <div key={ruta._id} className="ruta-card">
              <div className="ruta-card-header">
                <div className="ruta-color" style={{ background: ruta.color }} />
                <div>
                  <h3 style={{ fontSize: '1rem' }}>{ruta.nombre}</h3>
                  <span className={`badge badge-${ruta.estado.replace(' ', '-')}`}>
                    {ESTADOS[ruta.estado]}
                  </span>
                </div>
              </div>
              <div className="ruta-card-body">
                <div>Tarifa: ${ruta.tarifa}</div>
                <div>Horario: {ruta.horarioInicio} - {ruta.horarioFin}</div>
                <div>Frecuencia: Cada {ruta.frecuenciaMin} min</div>
                <div>Dias: {ruta.diasOperacion}</div>
                <div>Consultas: {ruta.consultas}</div>
              </div>
              <div className="ruta-card-footer">
                <Link to={`/agencia/editor/${ruta._id}`} className="btn btn-secundario">Editar</Link>
                {ruta.estado === 'borrador' && (
                  <button className="btn btn-primario" onClick={() => enviarRevision(ruta._id)}>Enviar a Revision</button>
                )}
                <button className="btn btn-error" onClick={() => eliminarRuta(ruta._id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
