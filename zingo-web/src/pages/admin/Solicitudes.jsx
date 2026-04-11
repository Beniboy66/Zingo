import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Admin.css';

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const { data } = await api.get('/admin/solicitudes');
      setSolicitudes(data.datos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <h1 className="pagina-titulo">Solicitudes Pendientes</h1>

      {solicitudes.length === 0 ? (
        <div className="vacio-estado card">
          <div className="vacio-icono">
            <Icon name="clipboard" size={48} color="var(--color-texto-secundario)" />
          </div>
          <h3>Sin solicitudes pendientes</h3>
          <p>No hay solicitudes de agencia por revisar.</p>
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Contacto</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.nombre}</strong></td>
                  <td>
                    <span className="badge badge-en-revision">
                      {s.tipoPersona === 'moral' ? 'Moral' : 'Fisica'}
                    </span>
                  </td>
                  <td>{s.emailContacto}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString('es-MX')}</td>
                  <td>
                    <Link to={`/admin/solicitudes/${s._id}`} className="btn btn-primario" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                      Revisar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
