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

const ESTADOS_COLOR = {
  pendiente: '#E65100',
  validado: '#2E7D32',
  rechazado: '#C62828',
  resuelto: '#1565C0'
};

export default function Moderacion() {
  const { mostrarConfirmar, mostrarError } = useModal();
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const { data } = await api.get('/admin/reportes-todos');
      setReportes(data.datos || []);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const resolver = async (id) => {
    try {
      await api.put(`/admin/reportes/${id}/resolver`);
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Error al resolver'); }
  };

  const eliminar = async (id) => {
    if (!await mostrarConfirmar('Esta accion no se puede deshacer.', { titulo: 'Eliminar reporte', textoAceptar: 'Eliminar', destructivo: true })) return;
    try {
      await api.delete(`/admin/reportes/${id}`);
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Error al eliminar'); }
  };

  const filtrados = reportes.filter(r => {
    if (filtroEstado && r.estado !== filtroEstado) return false;
    if (filtroTipo && r.tipo !== filtroTipo) return false;
    return true;
  });

  const conteo = {
    pendiente: reportes.filter(r => r.estado === 'pendiente').length,
    validado: reportes.filter(r => r.estado === 'validado').length,
    resuelto: reportes.filter(r => r.estado === 'resuelto').length,
  };

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <div className="pagina-header">
        <h1 className="pagina-titulo">Moderacion de Contenido</h1>
        <span className="contador-badge">{filtrados.length} reportes</span>
      </div>

      <div className="resumen-chips">
        <div className="resumen-chip chip-advertencia">
          <Icon name="flag" size={16} color="#E65100" />
          <span>{conteo.pendiente} pendientes</span>
        </div>
        <div className="resumen-chip chip-exito">
          <Icon name="check-circle" size={16} color="#2E7D32" />
          <span>{conteo.validado} validados</span>
        </div>
        <div className="resumen-chip chip-primario">
          <Icon name="check" size={16} color="#1565C0" />
          <span>{conteo.resuelto} resueltos</span>
        </div>
      </div>

      <div className="filtros-barra">
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="validado">Validado</option>
          <option value="rechazado">Rechazado</option>
          <option value="resuelto">Resuelto</option>
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="vacio-estado card">
          <div className="vacio-icono"><Icon name="flag" size={48} color="var(--color-texto-secundario)" /></div>
          <h3>Sin reportes</h3>
          <p>No hay reportes con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="reportes-grid">
          {filtrados.map(r => (
            <div key={r._id} className="card reporte-card-mod">
              <div className="reporte-top">
                <span className={`badge badge-${r.estado}`}>{r.estado}</span>
                <span className="badge badge-en-revision">{TIPOS[r.tipo] || r.tipo}</span>
              </div>

              <div className="reporte-ruta">
                {r.rutaId?.color && <div className="ruta-mini-color" style={{ background: r.rutaId.color }} />}
                <span>{r.rutaId?.nombre || 'Ruta eliminada'}</span>
              </div>

              <p className="reporte-desc">{r.descripcion}</p>

              <div className="reporte-meta">
                <div className="reporte-autor">
                  <Icon name="person-add" size={14} color="var(--color-texto-secundario)" />
                  <span>{r.usuarioId?.nombre || 'Anonimo'}</span>
                </div>
                <div className="reporte-votos">
                  <Icon name="arrow-up" size={14} color="var(--color-exito)" />
                  <span style={{ color: 'var(--color-exito)' }}>{r.votosFavor}</span>
                  <Icon name="arrow-down" size={14} color="var(--color-error)" style={{ marginLeft: 6 }} />
                  <span style={{ color: 'var(--color-error)' }}>{r.votosContra}</span>
                </div>
              </div>

              <div className="reporte-fecha">
                {new Date(r.createdAt).toLocaleString('es-MX')}
              </div>

              <div className="reporte-acciones">
                {r.estado !== 'resuelto' && (
                  <button className="btn btn-primario" onClick={() => resolver(r._id)}>
                    <Icon name="check" size={14} color="#fff" /> Resolver
                  </button>
                )}
                <button className="btn btn-secundario" onClick={() => eliminar(r._id)}>
                  <Icon name="trash" size={14} color="var(--color-texto-secundario)" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
