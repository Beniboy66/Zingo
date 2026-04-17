import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useModal } from '../../components/Modal';
import Icon from '../../components/Icon';
import './Admin.css';

export default function Concesionarios() {
  const { mostrarConfirmar, mostrarError } = useModal();
  const [concesionarios, setConcesionarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const { data } = await api.get('/admin/concesionarios');
      setConcesionarios(data.datos || []);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const activar = async (id) => {
    try {
      await api.put(`/admin/concesionarios/${id}/activar`);
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Error al activar'); }
  };

  const desactivar = async (id) => {
    if (!await mostrarConfirmar('No podra operar sus rutas hasta que lo reactives.', { titulo: 'Desactivar concesionario', textoAceptar: 'Desactivar', destructivo: true })) return;
    try {
      await api.put(`/admin/concesionarios/${id}/desactivar`);
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Error al desactivar'); }
  };

  if (cargando) return <div className="spinner" />;

  const activos = concesionarios.filter(c => c.estado === 'aprobado');
  const inactivos = concesionarios.filter(c => c.estado !== 'aprobado');

  return (
    <div className="pagina-contenedor fade-in">
      <div className="pagina-header">
        <h1 className="pagina-titulo">Gestion de Concesionarios</h1>
        <span className="contador-badge">{concesionarios.length} total</span>
      </div>

      <div className="resumen-chips">
        <div className="resumen-chip chip-exito">
          <Icon name="check-circle" size={16} color="#2E7D32" />
          <span>{activos.length} activos</span>
        </div>
        <div className="resumen-chip chip-error">
          <Icon name="x-circle" size={16} color="#C62828" />
          <span>{inactivos.length} inactivos</span>
        </div>
      </div>

      {concesionarios.length === 0 ? (
        <div className="vacio-estado card">
          <div className="vacio-icono"><Icon name="building" size={48} color="var(--color-texto-secundario)" /></div>
          <h3>Sin concesionarios</h3>
        </div>
      ) : (
        <div className="concesionarios-lista">
          {concesionarios.map(c => (
            <div key={c._id} className="card concesionario-card">
              <div className="concesionario-header" onClick={() => setExpandido(expandido === c._id ? null : c._id)}>
                <div className="concesionario-info">
                  <div className="concesionario-avatar">
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="concesionario-nombre">{c.nombre}</h3>
                    <div className="concesionario-meta">
                      {c.email} · {c.tipoPersona === 'moral' ? 'Persona Moral' : 'Persona Fisica'}
                    </div>
                  </div>
                </div>
                <div className="concesionario-derecha">
                  <span className={`badge badge-${c.estado}`}>{c.estado}</span>
                  <span className="rutas-count">{c.rutas?.length || 0} rutas</span>
                  <Icon name="chevron-right" size={18} color="var(--color-texto-secundario)"
                    style={{ transform: expandido === c._id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>

              {expandido === c._id && (
                <div className="concesionario-detalle fade-in">
                  <div className="concesionario-datos">
                    <div className="dato-fila">
                      <span className="dato-label">Telefono</span>
                      <span>{c.telefono}</span>
                    </div>
                    <div className="dato-fila">
                      <span className="dato-label">Contacto</span>
                      <span>{c.emailContacto}</span>
                    </div>
                    {c.datosVerificados?.folioTituloConcesion && (
                      <div className="dato-fila">
                        <span className="dato-label">Folio</span>
                        <span>{c.datosVerificados.folioTituloConcesion}</span>
                      </div>
                    )}
                    {c.datosVerificados?.rutaAutorizada && (
                      <div className="dato-fila">
                        <span className="dato-label">Ruta autorizada</span>
                        <span>{c.datosVerificados.rutaAutorizada}</span>
                      </div>
                    )}
                  </div>

                  {c.rutas?.length > 0 && (
                    <div className="concesionario-rutas">
                      <h4>Rutas registradas</h4>
                      {c.rutas.map(r => (
                        <div key={r._id} className="ruta-mini">
                          <div className="ruta-mini-color" style={{ background: r.color }} />
                          <span className="ruta-mini-nombre">{r.nombre}</span>
                          <span className={`badge badge-${r.estado}`}>{r.estado}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="concesionario-acciones">
                    {c.estado === 'aprobado' ? (
                      <button className="btn btn-secundario" onClick={() => desactivar(c._id)}>
                        <Icon name="x-circle" size={15} color="var(--color-texto)" /> Desactivar
                      </button>
                    ) : c.estado === 'suspendido' && (
                      <button className="btn btn-primario" onClick={() => activar(c._id)}>
                        <Icon name="check-circle" size={15} color="#fff" /> Activar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
