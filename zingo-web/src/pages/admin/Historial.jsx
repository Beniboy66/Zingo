import { useState, useEffect } from 'react';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Admin.css';

export default function Historial() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/admin/historial')
      .then(({ data }) => setHistorial(data.datos || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <h1 className="pagina-titulo">Historial de Cambios</h1>

      {historial.length === 0 ? (
        <div className="vacio-estado card">
          <div className="vacio-icono">
            <Icon name="scroll" size={48} color="var(--color-texto-secundario)" />
          </div>
          <h3>Sin registros</h3>
          <p>Aun no hay cambios registrados.</p>
        </div>
      ) : (
        <div className="card">
          <div className="timeline">
            {historial.map((h) => (
              <div key={h._id} className={`timeline-item ${h.accion.toLowerCase()}`}>
                <div className="timeline-fecha">
                  {new Date(h.createdAt).toLocaleString('es-MX')} — <strong>{h.accion}</strong>
                </div>
                <div className="timeline-desc">{h.descripcion}</div>
                <div className="timeline-tabla">Coleccion: {h.tablaAfectada}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
