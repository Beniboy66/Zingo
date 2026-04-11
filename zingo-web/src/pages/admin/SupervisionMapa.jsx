import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Admin.css';

const MAPA_CENTRO = { lat: 20.0833, lng: -98.3625 };
const MAPA_ESTILO = { width: '100%', height: '100%' };

export default function SupervisionMapa() {
  const [rutas, setRutas] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [panelAbierto, setPanelAbierto] = useState('rutas');
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const mapaRef = useRef(null);

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

  const desactivarRuta = async (id) => {
    if (!confirm('Desactivar esta ruta?')) return;
    try {
      await api.put(`/admin/rutas/${id}/desactivar`);
      cargar();
    } catch (err) { alert(err.response?.data?.mensaje || 'Error'); }
  };

  const activarRuta = async (id) => {
    try {
      await api.put(`/admin/rutas/${id}/activar`);
      cargar();
    } catch (err) { alert(err.response?.data?.mensaje || 'Error'); }
  };

  const eliminarParada = async (id) => {
    if (!confirm('Eliminar esta parada permanentemente?')) return;
    try {
      await api.delete(`/admin/paradas/${id}`);
      cargar();
    } catch (err) { alert(err.response?.data?.mensaje || 'Error'); }
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
                    {r.estado === 'publicada' ? (
                      <button className="btn-mini btn-mini-error" onClick={() => desactivarRuta(r._id)} title="Desactivar">
                        <Icon name="x" size={14} />
                      </button>
                    ) : r.estado === 'despublicada' && (
                      <button className="btn-mini btn-mini-exito" onClick={() => activarRuta(r._id)} title="Activar">
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
                  <span>Filtrando por ruta seleccionada</span>
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
                  <button className="btn-mini btn-mini-error" onClick={() => eliminarParada(p._id)} title="Eliminar">
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
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {rutas.map(r => {
              if (!r.trazo?.coordinates?.length) return null;
              const path = r.trazo.coordinates.map(([lng, lat]) => ({ lat, lng }));
              const esSeleccionada = rutaSeleccionada === r._id;
              return (
                <Polyline
                  key={r._id}
                  path={path}
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
              <Marker
                key={p._id}
                position={{ lat: p.ubicacion.coordinates[1], lng: p.ubicacion.coordinates[0] }}
                title={p.nombre}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: p.esTerminal ? 8 : 5,
                  fillColor: p.esTerminal ? '#FF3B30' : (p.rutaId?.color || '#007AFF'),
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
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
    </div>
  );
}
