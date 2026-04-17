import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import api from '../../services/api';
import { useModal } from '../../components/Modal';
import Icon from '../../components/Icon';
import './Admin.css';

const MAPA_CENTRO = { lat: 20.0833, lng: -98.3625 };
const MAPA_ESTILO = { width: '100%', height: '100%' };

export default function SupervisionMapa() {
  const { mostrarError } = useModal();
  const [rutas, setRutas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [panelAbierto, setPanelAbierto] = useState('rutas');
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const mapaRef = useRef(null);

  // Modales
  const [modalActivar, setModalActivar] = useState(null);
  const [modalDesactivar, setModalDesactivar] = useState(null);
  const [modalEliminarParada, setModalEliminarParada] = useState(null);
  const [motivoDesactivar, setMotivoDesactivar] = useState('');
  const [procesando, setProcesando] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const [rutasRes, paradasRes] = await Promise.all([
        api.get('/admin/rutas-todas'),
        api.get('/admin/paradas-todas')
      ]);
      setRutas(rutasRes.data.datos || []);
      setParadas(paradasRes.data.datos || []);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const handleActivar = async () => {
    if (!modalActivar) return;
    setProcesando(true);
    try {
      await api.put(`/admin/rutas/${modalActivar._id}/activar`);
      setModalActivar(null);
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Ocurrio un error.'); }
    finally { setProcesando(false); }
  };

  const handleDesactivar = async () => {
    if (!modalDesactivar) return;
    setProcesando(true);
    try {
      await api.put(`/admin/rutas/${modalDesactivar._id}/desactivar`);
      setModalDesactivar(null);
      setMotivoDesactivar('');
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Ocurrio un error.'); }
    finally { setProcesando(false); }
  };

  const handleEliminarParada = async () => {
    if (!modalEliminarParada) return;
    setProcesando(true);
    try {
      await api.delete(`/admin/paradas/${modalEliminarParada._id}`);
      setModalEliminarParada(null);
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Ocurrio un error.'); }
    finally { setProcesando(false); }
  };

  const onMapLoad = useCallback((map) => { mapaRef.current = map; }, []);

  const centrarEnRuta = (ruta) => {
    setRutaSeleccionada(ruta._id);
    if (ruta.trazo?.coordinates?.length > 0 && mapaRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      ruta.trazo.coordinates.forEach(([lng, lat]) => bounds.extend({ lat, lng }));
      mapaRef.current.fitBounds(bounds, 60);
    }
  };

  const paradasDeRuta = rutaSeleccionada
    ? paradas.filter(p => (p.rutaId?._id || p.rutaId) === rutaSeleccionada)
    : paradas;

  // Get ruta info for selected route
  const rutaInfo = rutaSeleccionada ? rutas.find(r => r._id === rutaSeleccionada) : null;

  if (cargando) return <div className="spinner" />;

  return (
    <div className="supervision-layout">
      {/* Panel lateral */}
      <div className="supervision-panel">
        <div className="panel-tabs">
          <button className={`panel-tab ${panelAbierto === 'rutas' ? 'activo' : ''}`} onClick={() => { setPanelAbierto('rutas'); setRutaSeleccionada(null); }}>
            <Icon name="map" size={16} /> Rutas ({rutas.length})
          </button>
          <button className={`panel-tab ${panelAbierto === 'paradas' ? 'activo' : ''}`} onClick={() => setPanelAbierto('paradas')}>
            <Icon name="location" size={16} /> Paradas ({paradasDeRuta.length})
          </button>
        </div>

        <div className="panel-contenido">
          {panelAbierto === 'rutas' && (
            <div className="panel-lista">
              {rutas.map(r => (
                <div key={r._id} className={`panel-item ${rutaSeleccionada === r._id ? 'seleccionado' : ''}`}
                  onClick={() => centrarEnRuta(r)}>
                  <div className="panel-item-izq">
                    <div className="ruta-mini-color" style={{ background: r.color, width: 4, height: 32, borderRadius: 2 }} />
                    <div>
                      <div className="panel-item-nombre">{r.nombre}</div>
                      <div className="panel-item-meta">
                        {r.agenciaId?.nombre || 'Sin agencia'} · <span className={`estado-texto estado-${r.estado}`}>{r.estado}</span>
                      </div>
                    </div>
                  </div>
                  <div className="panel-item-acciones" onClick={e => e.stopPropagation()}>
                    {r.estado === 'publicada' && (
                      <button className="btn-mini btn-mini-error" onClick={() => { setModalDesactivar(r); setMotivoDesactivar(''); }} title="Desactivar">
                        <Icon name="x" size={14} />
                      </button>
                    )}
                    {r.estado === 'despublicada' && (
                      <button className="btn-mini btn-mini-exito" onClick={() => setModalActivar(r)} title="Activar">
                        <Icon name="check" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {panelAbierto === 'paradas' && (
            <div className="panel-lista">
              {rutaSeleccionada && (
                <div className="panel-filtro-activo">
                  <span>Filtrando: {rutaInfo?.nombre}</span>
                  <button onClick={() => setRutaSeleccionada(null)}>
                    <Icon name="x" size={14} /> Limpiar
                  </button>
                </div>
              )}
              {paradasDeRuta.map(p => (
                <div key={p._id} className="panel-item">
                  <div className="panel-item-izq">
                    <div className="parada-orden-mini">{p.orden}</div>
                    <div>
                      <div className="panel-item-nombre">{p.nombre} {p.esTerminal ? '(Terminal)' : ''}</div>
                      <div className="panel-item-meta">{p.rutaId?.nombre || 'Sin ruta'}</div>
                    </div>
                  </div>
                  <button className="btn-mini btn-mini-error" onClick={() => setModalEliminarParada(p)} title="Eliminar">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mapa */}
      <div className="supervision-mapa">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={MAPA_ESTILO}
            center={MAPA_CENTRO}
            zoom={13}
            onLoad={onMapLoad}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
          >
            {rutas.map(r => {
              if (!r.trazo?.coordinates?.length) return null;
              const path = r.trazo.coordinates.map(([lng, lat]) => ({ lat, lng }));
              const esSeleccionada = rutaSeleccionada === r._id;
              return (
                <Polyline key={r._id} path={path}
                  options={{
                    strokeColor: r.estado === 'despublicada' ? '#999' : r.color,
                    strokeWeight: esSeleccionada ? 6 : 3,
                    strokeOpacity: r.estado === 'despublicada' ? 0.4 : (esSeleccionada ? 1 : 0.7),
                  }}
                  onClick={() => centrarEnRuta(r)}
                />
              );
            })}
            {paradasDeRuta.map(p => (
              <Marker key={p._id}
                position={{ lat: p.ubicacion.coordinates[1], lng: p.ubicacion.coordinates[0] }}
                title={p.nombre}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: p.esTerminal ? 8 : 5,
                  fillColor: p.esTerminal ? '#FF3B30' : (p.rutaId?.color || '#007AFF'),
                  fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2,
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Modal Activar Ruta */}
      {modalActivar && (
        <div className="modal-overlay" onClick={() => setModalActivar(null)}>
          <div className="modal-contenido fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-icono-header modal-icono-exito">
              <Icon name="check-circle" size={32} color="#2E7D32" />
            </div>
            <h2 style={{ textAlign: 'center' }}>Publicar Ruta</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-texto-secundario)', fontSize: '0.9rem', marginBottom: 20 }}>
              La ruta sera visible para todos los usuarios en la app movil y el mapa publico.
            </p>
            <div className="modal-resumen">
              <div className="modal-resumen-fila">
                <div style={{ width: 12, height: 12, borderRadius: 3, background: modalActivar.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{modalActivar.nombre}</span>
              </div>
              <div className="modal-resumen-fila">
                <Icon name="building" size={16} color="var(--color-texto-secundario)" />
                <span>{modalActivar.agenciaId?.nombre || 'Sin agencia'}</span>
              </div>
              <div className="modal-resumen-fila">
                <Icon name="cash-outline" size={16} color="var(--color-texto-secundario)" />
                <span>${modalActivar.tarifa} · {modalActivar.horarioInicio} - {modalActivar.horarioFin} · c/{modalActivar.frecuenciaMin} min</span>
              </div>
            </div>
            <div className="modal-acciones">
              <button className="btn btn-secundario" onClick={() => setModalActivar(null)} disabled={procesando}>Cancelar</button>
              <button className="btn btn-primario" onClick={handleActivar} disabled={procesando}>
                <Icon name="check" size={15} color="#fff" />
                {procesando ? 'Publicando...' : 'Confirmar Publicacion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Desactivar Ruta */}
      {modalDesactivar && (
        <div className="modal-overlay" onClick={() => setModalDesactivar(null)}>
          <div className="modal-contenido fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-icono-header modal-icono-error">
              <Icon name="x-circle" size={32} color="#C62828" />
            </div>
            <h2 style={{ textAlign: 'center' }}>Desactivar Ruta</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-texto-secundario)', fontSize: '0.9rem', marginBottom: 20 }}>
              La ruta dejara de ser visible para los usuarios. Podras reactivarla en cualquier momento.
            </p>
            <div className="modal-resumen">
              <div className="modal-resumen-fila">
                <div style={{ width: 12, height: 12, borderRadius: 3, background: modalDesactivar.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{modalDesactivar.nombre}</span>
              </div>
              <div className="modal-resumen-fila">
                <Icon name="building" size={16} color="var(--color-texto-secundario)" />
                <span>{modalDesactivar.agenciaId?.nombre || 'Sin agencia'}</span>
              </div>
            </div>

            <div className="form-grupo">
              <label>Motivo de la desactivacion</label>
              <div className="rechazo-categorias">
                {['Mantenimiento', 'Baja demanda', 'Queja de usuarios', 'Documentacion vencida', 'Otro'].map(cat => (
                  <button key={cat}
                    className={`rechazo-cat-btn ${motivoDesactivar === cat ? 'activo' : ''}`}
                    onClick={() => setMotivoDesactivar(motivoDesactivar === cat ? '' : cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-acciones">
              <button className="btn btn-secundario" onClick={() => setModalDesactivar(null)} disabled={procesando}>Cancelar</button>
              <button className="btn btn-primario" onClick={handleDesactivar} disabled={procesando}
                style={{ background: 'var(--color-texto-secundario)' }}>
                <Icon name="x" size={15} color="#fff" />
                {procesando ? 'Desactivando...' : 'Confirmar Desactivacion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Parada */}
      {modalEliminarParada && (
        <div className="modal-overlay" onClick={() => setModalEliminarParada(null)}>
          <div className="modal-contenido fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-icono-header modal-icono-error">
              <Icon name="trash" size={28} color="#C62828" />
            </div>
            <h2 style={{ textAlign: 'center' }}>Eliminar Parada</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-texto-secundario)', fontSize: '0.9rem', marginBottom: 20 }}>
              Esta accion no se puede deshacer. La parada sera eliminada permanentemente.
            </p>
            <div className="modal-resumen">
              <div className="modal-resumen-fila">
                <Icon name="location" size={16} color="var(--color-texto-secundario)" />
                <span style={{ fontWeight: 600 }}>{modalEliminarParada.nombre}</span>
                {modalEliminarParada.esTerminal && <span className="badge badge-en-revision" style={{ fontSize: '0.7rem' }}>Terminal</span>}
              </div>
              <div className="modal-resumen-fila">
                <Icon name="map" size={16} color="var(--color-texto-secundario)" />
                <span>{modalEliminarParada.rutaId?.nombre || 'Sin ruta'}</span>
              </div>
            </div>
            <div className="modal-acciones">
              <button className="btn btn-secundario" onClick={() => setModalEliminarParada(null)} disabled={procesando}>Cancelar</button>
              <button className="btn btn-primario" onClick={handleEliminarParada} disabled={procesando}
                style={{ background: 'var(--color-texto-secundario)' }}>
                <Icon name="trash" size={15} color="#fff" />
                {procesando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
