import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useModal } from '../../components/Modal';
import Icon from '../../components/Icon';
import './Admin.css';

const TIPOS = {
  mal_estado: 'Mal Estado',
  ruta_no_respetada: 'Ruta No Respetada',
  acoso: 'Acoso',
  inseguridad: 'Inseguridad',
  tarifa_incorrecta: 'Tarifa Incorrecta',
  otro: 'Otro'
};

export default function Reportes() {
  const { mostrarError } = useModal();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [rutas, setRutas] = useState([]);
  const [filtroRuta, setFiltroRuta] = useState('');

  useEffect(() => {
    api.get('/rutas').then(({ data }) => setRutas(data.datos || [])).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [filtroRuta]);

  const cargar = async () => {
    setCargando(true);
    try {
      if (filtroRuta) {
        const { data } = await api.get(`/reportes/ruta/${filtroRuta}`);
        setReportes(data.datos || []);
      } else {
        const todasRutas = rutas.length > 0 ? rutas : (await api.get('/rutas')).data.datos || [];
        const todos = [];
        for (const r of todasRutas) {
          try {
            const { data } = await api.get(`/reportes/ruta/${r._id}`);
            todos.push(...(data.datos || []));
          } catch (e) { /* skip */ }
        }
        setReportes(todos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstado = async (id, estado) => {
    try {
      await api.put(`/reportes/${id}`, { estado });
      cargar();
    } catch (err) {
      mostrarError(err.response?.data?.mensaje || 'Error al actualizar');
    }
  };

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <h1 className="pagina-titulo">Reportes de Usuarios</h1>

      <div className="filtros-barra">
        <select value={filtroRuta} onChange={(e) => setFiltroRuta(e.target.value)}>
          <option value="">Todas las rutas</option>
          {rutas.map((r) => (
            <option key={r._id} value={r._id}>{r.nombre}</option>
          ))}
        </select>
      </div>

      {reportes.length === 0 ? (
        <div className="vacio-estado card">
          <div className="vacio-icono">
            <Icon name="flag" size={48} color="var(--color-texto-secundario)" />
          </div>
          <h3>Sin reportes</h3>
          <p>No hay reportes registrados.</p>
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripcion</th>
                <th>Votos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((r) => (
                <tr key={r._id}>
                  <td><span className="badge badge-en-revision">{TIPOS[r.tipo] || r.tipo}</span></td>
                  <td style={{ maxWidth: 300 }}>{r.descripcion}</td>
                  <td>
                    <span className="votos-inline">
                      <Icon name="arrow-up" size={14} color="var(--color-exito)" />
                      <span style={{ color: 'var(--color-exito)' }}>{r.votosFavor}</span>
                      <Icon name="arrow-down" size={14} color="var(--color-error)" style={{ marginLeft: 8 }} />
                      <span style={{ color: 'var(--color-error)' }}>{r.votosContra}</span>
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.estado}`}>{r.estado}</span>
                  </td>
                  <td>
                    <div className="tabla-acciones">
                      {r.estado === 'pendiente' && (
                        <>
                          <button className="btn btn-primario" onClick={() => actualizarEstado(r._id, 'validado')}>Validar</button>
                          <button className="btn btn-secundario" onClick={() => actualizarEstado(r._id, 'rechazado')}>Rechazar</button>
                        </>
                      )}
                      {r.estado === 'validado' && (
                        <button className="btn btn-primario" onClick={() => actualizarEstado(r._id, 'resuelto')}>Resuelto</button>
                      )}
                    </div>
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
