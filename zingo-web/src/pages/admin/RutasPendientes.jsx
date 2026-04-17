import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import api from '../../services/api';
import { useModal } from '../../components/Modal';
import Icon from '../../components/Icon';
import './Admin.css';

export default function RutasPendientes() {
  const { mostrarError } = useModal();
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);
  const [paradas, setParadas] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Modales
  const [modalAprobar, setModalAprobar] = useState(false);
  const [modalRechazar, setModalRechazar] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Formulario aprobar
  const [notasAprobacion, setNotasAprobacion] = useState('');

  // Formulario rechazar
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [categoriaRechazo, setCategoriaRechazo] = useState('');

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const { data } = await api.get('/admin/rutas-pendientes');
      setRutas(data.datos || []);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const verDetalle = async (ruta) => {
    setSeleccionada(ruta);
    setCargandoDetalle(true);
    try {
      const { data } = await api.get(`/paradas/ruta/${ruta._id}`);
      setParadas(data.datos || []);
    } catch (err) { setParadas([]); }
    finally { setCargandoDetalle(false); }
  };

  const cerrarDetalle = () => {
    setSeleccionada(null);
    setParadas([]);
  };

  const abrirModalAprobar = () => {
    setNotasAprobacion('');
    setModalAprobar(true);
  };

  const abrirModalRechazar = () => {
    setMotivoRechazo('');
    setCategoriaRechazo('');
    setModalRechazar(true);
  };

  const handleAprobar = async () => {
    setProcesando(true);
    try {
      await api.put(`/admin/rutas/${seleccionada._id}/aprobar`);
      setModalAprobar(false);
      cerrarDetalle();
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Error al aprobar.'); }
    finally { setProcesando(false); }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) return;
    setProcesando(true);
    const motivo = categoriaRechazo
      ? `${categoriaRechazo}: ${motivoRechazo}`
      : motivoRechazo;
    try {
      await api.put(`/admin/rutas/${seleccionada._id}/rechazar`, { motivo });
      setModalRechazar(false);
      cerrarDetalle();
      cargar();
    } catch (err) { mostrarError(err.response?.data?.mensaje || 'Error al rechazar.'); }
    finally { setProcesando(false); }
  };

  if (cargando) return <div className="spinner" />;

  // Detail view
  if (seleccionada) {
    const coords = seleccionada.trazo?.coordinates?.map(([lng, lat]) => ({ lat, lng })) || [];

    return (
      <div className="pagina-contenedor fade-in">
        <button className="btn btn-secundario" onClick={cerrarDetalle} style={{ marginBottom: 16 }}>
          ← Volver a la lista
        </button>

        <div className="pagina-header">
          <h1 className="pagina-titulo">{seleccionada.nombre}</h1>
          <span className={`badge ${seleccionada.estado === 'edicion_pendiente' ? 'badge-edicion' : 'badge-en-revision'}`}>
            {seleccionada.estado === 'edicion_pendiente' ? 'Edicion de ruta publicada' : 'Nueva ruta en revision'}
          </span>
        </div>

        {isLoaded && coords.length > 0 && (
          <div className="revision-mapa">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={coords[0]}
              zoom={14}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            >
              <Polyline path={coords} options={{ strokeColor: seleccionada.color, strokeWeight: 5, strokeOpacity: 0.85 }} />
              {paradas.map((p) => (
                <Marker key={p._id}
                  position={{ lat: p.ubicacion.coordinates[1], lng: p.ubicacion.coordinates[0] }}
                  title={p.nombre}
                  label={{ text: String(p.orden), color: '#fff', fontSize: '10px', fontWeight: '700' }}
                  icon={p.esTerminal ? undefined : {
                    path: window.google.maps.SymbolPath.CIRCLE, scale: 10,
                    fillColor: seleccionada.color, fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff'
                  }}
                />
              ))}
            </GoogleMap>
          </div>
        )}

        <div className="revision-grid">
          <div className="card">
            <h3 style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-borde)' }}>Datos de la Ruta</h3>
            <div className="revision-datos">
              <div className="revision-dato"><span className="dato-label">Agencia</span><span>{seleccionada.agenciaId?.nombre || 'N/A'}</span></div>
              <div className="revision-dato"><span className="dato-label">Descripcion</span><span>{seleccionada.descripcion || 'Sin descripcion'}</span></div>
              <div className="revision-dato"><span className="dato-label">Tarifa</span><span>${seleccionada.tarifa}</span></div>
              <div className="revision-dato"><span className="dato-label">Horario</span><span>{seleccionada.horarioInicio} - {seleccionada.horarioFin}</span></div>
              <div className="revision-dato"><span className="dato-label">Frecuencia</span><span>Cada {seleccionada.frecuenciaMin} min</span></div>
              <div className="revision-dato"><span className="dato-label">Dias</span><span>{seleccionada.diasOperacion}</span></div>
              <div className="revision-dato"><span className="dato-label">Velocidad</span><span>{seleccionada.velocidadPromedioKmh} km/h</span></div>
              <div className="revision-dato">
                <span className="dato-label">Color</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: seleccionada.color }} />
                  {seleccionada.color}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-borde)' }}>
              Paradas ({paradas.length})
            </h3>
            {cargandoDetalle ? <div className="spinner" /> : (
              paradas.length === 0 ? (
                <p style={{ color: 'var(--color-texto-secundario)', textAlign: 'center', padding: 20 }}>Sin paradas registradas</p>
              ) : (
                <div className="revision-paradas">
                  {paradas.map(p => (
                    <div key={p._id} className="revision-parada-item">
                      <div className={`parada-orden ${p.esTerminal ? 'terminal' : ''}`}>{p.orden}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                          {p.nombre}
                          <span className={`parada-tipo-tag ${p.esTerminal ? 'tag-terminal' : 'tag-paso'}`}>
                            {p.esTerminal ? 'Terminal' : 'Paso'}
                          </span>
                        </div>
                        {p.referencia && <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginTop: 2 }}>{p.referencia}</div>}
                        {(p.techada || p.iluminacion || p.asientos || p.rampa) && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            {p.techada && <span className="amenidad-mini">Techada</span>}
                            {p.iluminacion && <span className="amenidad-mini">Iluminada</span>}
                            {p.asientos && <span className="amenidad-mini">Asientos</span>}
                            {p.rampa && <span className="amenidad-mini">Rampa</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="revision-acciones">
          <button className="btn btn-primario" style={{ flex: 1 }} onClick={abrirModalAprobar}>
            <Icon name="check" size={16} color="#fff" /> Aprobar y Publicar
          </button>
          <button className="btn btn-secundario" style={{ flex: 1 }} onClick={abrirModalRechazar}>
            <Icon name="x" size={16} color="var(--color-texto)" /> Rechazar
          </button>
        </div>

        {/* Modal Aprobar */}
        {modalAprobar && (
          <div className="modal-overlay" onClick={() => setModalAprobar(false)}>
            <div className="modal-contenido fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-icono-header modal-icono-exito">
                <Icon name="check-circle" size={32} color="#2E7D32" />
              </div>
              <h2 style={{ textAlign: 'center' }}>
                {seleccionada.estado === 'edicion_pendiente' ? 'Aprobar Cambios' : 'Aprobar Ruta'}
              </h2>
              <p style={{ textAlign: 'center', color: 'var(--color-texto-secundario)', fontSize: '0.9rem', marginBottom: 20 }}>
                {seleccionada.estado === 'edicion_pendiente'
                  ? <>Los cambios de la ruta <strong>"{seleccionada.nombre}"</strong> de <strong>{seleccionada.agenciaId?.nombre}</strong> se aplicaran a la ruta publicada.</>
                  : <>La ruta <strong>"{seleccionada.nombre}"</strong> de <strong>{seleccionada.agenciaId?.nombre}</strong> sera visible para todos los usuarios en la app movil y el mapa publico.</>
                }
              </p>

              <div className="modal-resumen">
                <div className="modal-resumen-fila">
                  <Icon name="map" size={16} color="var(--color-texto-secundario)" />
                  <span>{seleccionada.nombre}</span>
                </div>
                <div className="modal-resumen-fila">
                  <Icon name="building" size={16} color="var(--color-texto-secundario)" />
                  <span>{seleccionada.agenciaId?.nombre}</span>
                </div>
                <div className="modal-resumen-fila">
                  <Icon name="location" size={16} color="var(--color-texto-secundario)" />
                  <span>{paradas.length} paradas registradas</span>
                </div>
              </div>

              <div className="form-grupo">
                <label>Notas internas (opcional)</label>
                <textarea value={notasAprobacion} onChange={e => setNotasAprobacion(e.target.value)}
                  placeholder="Observaciones sobre la aprobacion..." style={{ minHeight: 70 }} />
              </div>

              <div className="modal-acciones">
                <button className="btn btn-secundario" onClick={() => setModalAprobar(false)} disabled={procesando}>Cancelar</button>
                <button className="btn btn-primario" onClick={handleAprobar} disabled={procesando}>
                  <Icon name="check" size={15} color="#fff" />
                  {procesando ? 'Aprobando...' : 'Confirmar Aprobacion'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Rechazar */}
        {modalRechazar && (
          <div className="modal-overlay" onClick={() => setModalRechazar(false)}>
            <div className="modal-contenido fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-icono-header modal-icono-error">
                <Icon name="x-circle" size={32} color="#C62828" />
              </div>
              <h2 style={{ textAlign: 'center' }}>
                {seleccionada.estado === 'edicion_pendiente' ? 'Rechazar Cambios' : 'Rechazar Ruta'}
              </h2>
              <p style={{ textAlign: 'center', color: 'var(--color-texto-secundario)', fontSize: '0.9rem', marginBottom: 20 }}>
                {seleccionada.estado === 'edicion_pendiente'
                  ? <>Los cambios de <strong>"{seleccionada.nombre}"</strong> seran descartados. La ruta seguira publicada con su version anterior.</>
                  : <>La ruta <strong>"{seleccionada.nombre}"</strong> sera devuelta a borrador. El concesionario podra corregirla y reenviarla.</>
                }
              </p>

              <div className="form-grupo">
                <label>Categoria del rechazo</label>
                <div className="rechazo-categorias">
                  {[
                    { valor: 'Trazo incorrecto', icono: 'map' },
                    { valor: 'Datos incompletos', icono: 'clipboard' },
                    { valor: 'Sin paradas', icono: 'location' },
                    { valor: 'Ruta duplicada', icono: 'flag' },
                    { valor: 'Documentacion pendiente', icono: 'document' },
                    { valor: 'Otro', icono: 'edit' },
                  ].map(cat => (
                    <button key={cat.valor}
                      className={`rechazo-cat-btn ${categoriaRechazo === cat.valor ? 'activo' : ''}`}
                      onClick={() => setCategoriaRechazo(categoriaRechazo === cat.valor ? '' : cat.valor)}>
                      <Icon name={cat.icono} size={15} color={categoriaRechazo === cat.valor ? '#fff' : 'var(--color-texto-secundario)'} />
                      {cat.valor}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grupo">
                <label>Motivo del rechazo *</label>
                <textarea value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)}
                  placeholder="Explica al concesionario que debe corregir para que la ruta sea aprobada..."
                  style={{ minHeight: 100 }} autoFocus />
              </div>

              <div className="modal-acciones">
                <button className="btn btn-secundario" onClick={() => setModalRechazar(false)} disabled={procesando}>Cancelar</button>
                <button className="btn btn-primario" onClick={handleRechazar}
                  disabled={procesando || !motivoRechazo.trim()}
                  style={{ background: 'var(--color-texto-secundario)' }}>
                  <Icon name="x" size={15} color="#fff" />
                  {procesando ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="pagina-contenedor fade-in">
      <div className="pagina-header">
        <h1 className="pagina-titulo">Rutas por Revisar</h1>
        {rutas.length > 0 && <span className="contador-badge">{rutas.length} pendientes</span>}
      </div>

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
            <div key={ruta._id} className="card ruta-revision-card" onClick={() => verDetalle(ruta)}>
              {isLoaded && ruta.trazo?.coordinates?.length > 0 && (
                <div className="ruta-preview-mapa">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={{
                      lat: ruta.trazo.coordinates[Math.floor(ruta.trazo.coordinates.length / 2)][1],
                      lng: ruta.trazo.coordinates[Math.floor(ruta.trazo.coordinates.length / 2)][0]
                    }}
                    zoom={13}
                    options={{ disableDefaultUI: true, gestureHandling: 'none', clickableIcons: false }}
                  >
                    <Polyline
                      path={ruta.trazo.coordinates.map(([lng, lat]) => ({ lat, lng }))}
                      options={{ strokeColor: ruta.color, strokeWeight: 3, strokeOpacity: 0.9 }}
                    />
                  </GoogleMap>
                </div>
              )}
              <div className="ruta-revision-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 24, borderRadius: 3, background: ruta.color }} />
                    {ruta.nombre}
                  </h3>
                  <span className={`badge ${ruta.estado === 'edicion_pendiente' ? 'badge-edicion' : 'badge-en-revision'}`}>
                    {ruta.estado === 'edicion_pendiente' ? 'Edicion' : 'Nueva'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>
                  <div>{ruta.agenciaId?.nombre || 'Sin agencia'} · ${ruta.tarifa} · {ruta.horarioInicio}-{ruta.horarioFin}</div>
                  <div>Cada {ruta.frecuenciaMin} min · {ruta.diasOperacion}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: '0.82rem', color: 'var(--color-primario)', fontWeight: 500 }}>
                  Revisar detalle <Icon name="chevron-right" size={14} color="var(--color-primario)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
