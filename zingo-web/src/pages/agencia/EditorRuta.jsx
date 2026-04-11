import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Agencia.css';

const LIBRARIES = ['places'];
const MAPA_CENTRO = { lat: 20.0833, lng: -98.3625 };
const COLORES = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#FF2D55'];
const MODOS = { NINGUNO: 'ninguno', TRAZO: 'trazo', PARADA: 'parada' };

// Project point onto segment AB, return closest point on segment
function puntoEnSegmento(punto, a, b) {
  const dx = b.lng - a.lng, dy = b.lat - a.lat;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { punto: a, dist: (a.lat - punto.lat) ** 2 + (a.lng - punto.lng) ** 2 };
  let t = ((punto.lng - a.lng) * dx + (punto.lat - a.lat) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const proj = { lat: a.lat + t * dy, lng: a.lng + t * dx };
  const dist = (proj.lat - punto.lat) ** 2 + (proj.lng - punto.lng) ** 2;
  return { punto: proj, dist };
}

function snapAPolilinea(punto, polyline) {
  let minDist = Infinity, closest = punto;
  for (let i = 0; i < polyline.length - 1; i++) {
    const { punto: proj, dist } = puntoEnSegmento(punto, polyline[i], polyline[i + 1]);
    if (dist < minDist) { minDist = dist; closest = proj; }
  }
  return closest;
}

export default function EditorRuta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const mapaRef = useRef(null);
  const dsRef = useRef(null); // DirectionsService
  const trazoRef = useRef([]);
  // Segments cache: segmentos[i] = path between waypoints[i] and waypoints[i+1]
  const segmentosRef = useRef([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tarifa, setTarifa] = useState(12);
  const [horarioInicio, setHorarioInicio] = useState('06:00');
  const [horarioFin, setHorarioFin] = useState('22:00');
  const [frecuenciaMin, setFrecuenciaMin] = useState(15);
  const [diasOperacion, setDiasOperacion] = useState('L-D');
  const [color, setColor] = useState('#007AFF');
  const [velocidad, setVelocidad] = useState(20);

  const [modo, setModo] = useState(MODOS.NINGUNO);
  const [waypoints, setWaypoints] = useState([]);
  const [trazo, setTrazo] = useState([]);
  const [calculando, setCalculando] = useState(false);
  const [paradas, setParadas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(!!id);
  const [centroInicial] = useState(MAPA_CENTRO);

  const [nuevaParada, setNuevaParada] = useState(null);
  const [nombreParada, setNombreParada] = useState('');
  const [referenciaParada, setReferenciaParada] = useState('');
  const [esTerminal, setEsTerminal] = useState(false);
  const [techada, setTechada] = useState(false);
  const [iluminacion, setIluminacion] = useState(false);
  const [asientos, setAsientos] = useState(false);
  const [rampa, setRampa] = useState(false);

  useEffect(() => { trazoRef.current = trazo; }, [trazo]);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.get(`/rutas/${id}`),
        api.get(`/paradas/ruta/${id}`)
      ]).then(([rutaRes, paradasRes]) => {
        // Handle both formats: datos = ruta object, or datos = { ruta, paradas }
        const raw = rutaRes.data.datos;
        const ruta = raw.ruta || raw;
        setNombre(ruta.nombre); setDescripcion(ruta.descripcion || '');
        setTarifa(ruta.tarifa); setHorarioInicio(ruta.horarioInicio);
        setHorarioFin(ruta.horarioFin); setFrecuenciaMin(ruta.frecuenciaMin);
        setDiasOperacion(ruta.diasOperacion); setColor(ruta.color);
        setVelocidad(ruta.velocidadPromedioKmh || 20);
        if (ruta.trazo?.coordinates?.length > 0) {
          const coords = ruta.trazo.coordinates.map(([lng, lat]) => ({ lat, lng }));
          setTrazo(coords);
          setWaypoints([coords[0], coords[coords.length - 1]]);
          segmentosRef.current = [coords];
        }
        const paradasData = paradasRes.data.datos || raw.paradas || [];
        setParadas(paradasData.map(p => ({
          _id: p._id, nombre: p.nombre, referencia: p.referencia || '',
          esTerminal: p.esTerminal, orden: p.orden,
          techada: p.techada || false, iluminacion: p.iluminacion || false,
          asientos: p.asientos || false, rampa: p.rampa || false,
          lat: p.ubicacion.coordinates[1], lng: p.ubicacion.coordinates[0]
        })));
      }).catch((err) => {
        console.error('Error cargando ruta:', err);
        alert('Error al cargar la ruta');
        navigate('/agencia/dashboard');
      }).finally(() => setCargando(false));
    }
  }, [id, navigate]);

  // Calculate ONE segment between two points on the road
  const calcularSegmento = useCallback((from, to) => {
    return new Promise((resolve) => {
      if (!dsRef.current) { resolve([]); return; }
      dsRef.current.route({
        origin: new window.google.maps.LatLng(from.lat, from.lng),
        destination: new window.google.maps.LatLng(to.lat, to.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK' && result.routes[0]) {
          const puntos = [];
          for (const step of result.routes[0].legs[0].steps) {
            for (const p of step.path) {
              puntos.push({ lat: p.lat(), lng: p.lng() });
            }
          }
          resolve(puntos);
        } else {
          // Fallback: straight line
          resolve([from, to]);
        }
      });
    });
  }, []);

  // Rebuild trazo from all cached segments
  const reconstruirTrazo = useCallback(() => {
    const todos = [];
    for (const seg of segmentosRef.current) {
      // Skip first point of subsequent segments (it's the same as last of previous)
      const start = todos.length > 0 ? 1 : 0;
      for (let i = start; i < seg.length; i++) {
        todos.push(seg[i]);
      }
    }
    setTrazo(todos);
  }, []);

  // When a new waypoint is added, only calculate the new last segment
  const agregarWaypoint = useCallback(async (punto) => {
    const nuevos = [...waypoints, punto];
    setWaypoints(nuevos);

    if (nuevos.length >= 2) {
      setCalculando(true);
      const from = nuevos[nuevos.length - 2];
      const to = nuevos[nuevos.length - 1];
      const seg = await calcularSegmento(from, to);
      segmentosRef.current.push(seg);
      reconstruirTrazo();
      setCalculando(false);
    }
  }, [waypoints, calcularSegmento, reconstruirTrazo]);

  const deshacerWaypoint = useCallback(() => {
    if (waypoints.length === 0) return;
    const nuevos = waypoints.slice(0, -1);
    setWaypoints(nuevos);
    // Remove last segment
    if (segmentosRef.current.length > 0) {
      segmentosRef.current.pop();
    }
    reconstruirTrazo();
  }, [waypoints, reconstruirTrazo]);

  const limpiarTrazo = useCallback(() => {
    if (!confirm('Limpiar todo el trazo? Las paradas se mantendran.')) return;
    setWaypoints([]);
    segmentosRef.current = [];
    setTrazo([]);
  }, []);

  const limpiarTodo = useCallback(() => {
    if (!confirm('Limpiar trazo Y paradas?')) return;
    setWaypoints([]);
    segmentosRef.current = [];
    setTrazo([]);
    setParadas([]);
  }, []);

  const onMapLoad = useCallback((map) => {
    mapaRef.current = map;
    dsRef.current = new window.google.maps.DirectionsService();
  }, []);

  const onMapClick = useCallback((e) => {
    const punto = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    if (modo === MODOS.TRAZO) {
      agregarWaypoint(punto);
    } else if (modo === MODOS.PARADA) {
      const t = trazoRef.current;
      if (t.length < 2) { alert('Primero traza la ruta'); return; }
      setNuevaParada(snapAPolilinea(punto, t));
      setNombreParada(''); setReferenciaParada('');
      setEsTerminal(false); setTechada(false);
      setIluminacion(false); setAsientos(false); setRampa(false);
    }
  }, [modo, agregarWaypoint]);

  const agregarParada = () => {
    if (!nuevaParada || !nombreParada) return;
    setParadas(prev => [...prev, {
      nombre: nombreParada, referencia: referenciaParada,
      esTerminal, orden: prev.length + 1,
      techada, iluminacion, asientos, rampa,
      lat: nuevaParada.lat, lng: nuevaParada.lng
    }]);
    setNuevaParada(null);
  };

  const eliminarParada = (idx) => {
    setParadas(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, orden: i + 1 })));
  };

  const cambiarModo = (m) => setModo(prev => prev === m ? MODOS.NINGUNO : m);

  const guardar = async (enviarRevision = false) => {
    if (!nombre) return alert('El nombre de la ruta es obligatorio');
    if (trazo.length < 2) return alert('Traza la ruta sobre el mapa');

    setGuardando(true);
    try {
      const datos = {
        nombre, descripcion, tarifa: Number(tarifa), horarioInicio, horarioFin,
        frecuenciaMin: Number(frecuenciaMin), diasOperacion, color,
        velocidadPromedioKmh: Number(velocidad),
        trazo: { type: 'LineString', coordinates: trazo.map(p => [p.lng, p.lat]) },
        estado: enviarRevision ? 'en_revision' : 'borrador'
      };

      let rutaId = id;
      if (id) {
        await api.put(`/rutas/${id}`, datos);
      } else {
        const { data } = await api.post('/rutas', datos);
        rutaId = data.datos._id;
      }

      if (id) {
        const { data: existentes } = await api.get(`/paradas/ruta/${rutaId}`);
        for (const p of (existentes.datos || [])) await api.delete(`/paradas/${p._id}`);
      }
      for (const p of paradas) {
        await api.post('/paradas', {
          rutaId, nombre: p.nombre, orden: p.orden, esTerminal: p.esTerminal,
          referencia: p.referencia, techada: p.techada, iluminacion: p.iluminacion,
          asientos: p.asientos, rampa: p.rampa,
          ubicacion: { type: 'Point', coordinates: [p.lng, p.lat] }
        });
      }
      navigate('/agencia/dashboard');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (!isLoaded || cargando) return <div className="spinner" />;

  return (
    <div className="editor-layout">
      <div className="editor-mapa">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={centroInicial}
          zoom={14}
          onClick={onMapClick}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false, mapTypeControl: false, fullscreenControl: false,
            draggableCursor: modo === MODOS.NINGUNO ? undefined : 'crosshair',
          }}
        >
          {trazo.length >= 2 && (
            <Polyline path={trazo} options={{ strokeColor: color, strokeWeight: 5, strokeOpacity: 0.85 }} />
          )}
          {waypoints.map((p, i) => (
            <Marker key={`w-${i}`} position={p} icon={{
              path: window.google.maps.SymbolPath.CIRCLE, scale: 7,
              fillColor: '#fff', fillOpacity: 1, strokeWeight: 3, strokeColor: color
            }} title={`Punto ${i + 1}`} />
          ))}
          {paradas.map((p, i) => (
            <Marker key={`p-${i}`} position={{ lat: p.lat, lng: p.lng }}
              label={{ text: String(p.orden), color: '#fff', fontSize: '10px', fontWeight: '700' }}
              title={p.nombre}
              icon={p.esTerminal ? undefined : {
                path: window.google.maps.SymbolPath.CIRCLE, scale: 10,
                fillColor: color, fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff'
              }}
            />
          ))}
        </GoogleMap>

        <div className="editor-toolbar">
          <button className={`btn-toolbar ${modo === MODOS.TRAZO ? 'activo-trazo' : ''}`}
            onClick={() => cambiarModo(MODOS.TRAZO)}>
            <Icon name="edit" size={16} color={modo === MODOS.TRAZO ? '#fff' : 'var(--color-texto)'} />
            {modo === MODOS.TRAZO ? 'Trazando...' : 'Trazar Ruta'}
          </button>
          <button className={`btn-toolbar ${modo === MODOS.PARADA ? 'activo' : ''}`}
            onClick={() => cambiarModo(MODOS.PARADA)}>
            <Icon name="location" size={16} color={modo === MODOS.PARADA ? '#fff' : 'var(--color-texto)'} />
            {modo === MODOS.PARADA ? 'Colocando...' : 'Agregar Paradas'}
          </button>
          <div className="toolbar-separador" />
          <button className="btn-toolbar" onClick={deshacerWaypoint} disabled={waypoints.length === 0 || calculando}>
            <Icon name="arrow-up" size={14} color="var(--color-texto)" style={{ transform: 'rotate(-90deg)' }} /> Deshacer
          </button>
          <button className="btn-toolbar" onClick={limpiarTrazo} disabled={(waypoints.length === 0 && trazo.length === 0) || calculando}>
            <Icon name="trash" size={14} color="var(--color-texto)" /> Limpiar trazo
          </button>
          <button className="btn-toolbar" onClick={limpiarTodo}
            disabled={(waypoints.length === 0 && paradas.length === 0 && trazo.length === 0) || calculando}>
            <Icon name="x" size={14} color="var(--color-error)" /> Limpiar todo
          </button>
          {calculando && <span className="toolbar-status">Calculando...</span>}
        </div>

        {modo === MODOS.NINGUNO && waypoints.length === 0 && (
          <div className="editor-hint">
            <Icon name="map" size={16} color="var(--color-primario)" />
            Activa "Trazar Ruta" para empezar a dibujar.
          </div>
        )}
        {modo === MODOS.TRAZO && (
          <div className="editor-hint hint-trazo">
            <Icon name="edit" size={16} color="#fff" />
            Click en el mapa para agregar puntos. La ruta sigue las calles.
          </div>
        )}
        {modo === MODOS.PARADA && (
          <div className="editor-hint hint-parada">
            <Icon name="location" size={16} color="#fff" />
            Click cerca de la ruta para colocar una parada.
          </div>
        )}
      </div>

      <div className="editor-panel">
        <h2>{id ? 'Editar Ruta' : 'Nueva Ruta'}</h2>

        <div className="form-grupo">
          <label>Nombre de la ruta *</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Ruta 1 - Centro a Santiago" />
        </div>
        <div className="form-grupo">
          <label>Descripcion</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe el recorrido..." style={{ minHeight: 60 }} />
        </div>
        <div className="editor-fila">
          <div className="form-grupo"><label>Tarifa ($)</label>
            <input type="number" value={tarifa} onChange={e => setTarifa(e.target.value)} min="0" step="0.5" /></div>
          <div className="form-grupo"><label>Velocidad (km/h)</label>
            <input type="number" value={velocidad} onChange={e => setVelocidad(e.target.value)} min="5" /></div>
        </div>
        <div className="editor-fila">
          <div className="form-grupo"><label>Hora inicio</label>
            <input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} /></div>
          <div className="form-grupo"><label>Hora fin</label>
            <input type="time" value={horarioFin} onChange={e => setHorarioFin(e.target.value)} /></div>
        </div>
        <div className="editor-fila">
          <div className="form-grupo"><label>Frecuencia (min)</label>
            <input type="number" value={frecuenciaMin} onChange={e => setFrecuenciaMin(e.target.value)} min="1" /></div>
          <div className="form-grupo"><label>Dias de operacion</label>
            <select value={diasOperacion} onChange={e => setDiasOperacion(e.target.value)}>
              <option value="L-D">L-D (Toda la semana)</option>
              <option value="L-S">L-S (Lun a Sab)</option>
              <option value="L-V">L-V (Lun a Vie)</option>
            </select></div>
        </div>
        <div className="form-grupo">
          <label>Color de la ruta</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORES.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c,
                border: color === c ? '3px solid var(--color-texto)' : '2px solid transparent',
                cursor: 'pointer', transition: 'border 0.2s'
              }} />
            ))}
          </div>
        </div>

        <div className="paradas-lista">
          <h3>Paradas ({paradas.length})</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-texto-secundario)', marginBottom: 12 }}>
            Activa "Agregar Paradas" y haz click cerca de la ruta.
          </p>
          {paradas.map((p, i) => (
            <div key={i} className="parada-item">
              <div className={`parada-orden ${p.esTerminal ? 'terminal' : ''}`}>{p.orden}</div>
              <div className="parada-info">
                <div className="parada-nombre">
                  {p.nombre}
                  <span className={`parada-tipo-tag ${p.esTerminal ? 'tag-terminal' : 'tag-paso'}`}>
                    {p.esTerminal ? 'Terminal' : 'Paso'}
                  </span>
                </div>
                {p.referencia && <div className="parada-ref">{p.referencia}</div>}
                <div className="parada-amenidades">
                  {p.techada && <span title="Techada">T</span>}
                  {p.iluminacion && <span title="Iluminacion">L</span>}
                  {p.asientos && <span title="Asientos">A</span>}
                  {p.rampa && <span title="Rampa">R</span>}
                </div>
              </div>
              <div className="parada-acciones">
                <button onClick={() => eliminarParada(i)} title="Eliminar">
                  <Icon name="x" size={14} color="var(--color-error)" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="editor-acciones">
          <button className="btn btn-secundario" onClick={() => navigate('/agencia/dashboard')}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando} onClick={() => guardar(false)}>
            {guardando ? 'Guardando...' : 'Guardar Borrador'}
          </button>
          <button className="btn btn-exito" disabled={guardando} onClick={() => guardar(true)}>
            Enviar a Revision
          </button>
        </div>
      </div>

      {nuevaParada && (
        <div className="modal-overlay" onClick={() => setNuevaParada(null)}>
          <div className="modal-contenido fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2>Nueva Parada</h2>
            <div className="form-grupo">
              <label>Nombre de la parada *</label>
              <input value={nombreParada} onChange={e => setNombreParada(e.target.value)} placeholder="Ej: Terminal Centro" autoFocus />
            </div>
            <div className="form-grupo">
              <label>Referencia (opcional)</label>
              <input value={referenciaParada} onChange={e => setReferenciaParada(e.target.value)} placeholder="Ej: Frente a la Farmacia Guadalajara" />
            </div>
            <div className="form-grupo">
              <label>Tipo de parada</label>
              <div className="tipo-parada-selector">
                <button className={`tipo-btn ${!esTerminal ? 'activo' : ''}`} onClick={() => setEsTerminal(false)}>
                  <Icon name="location" size={18} color={!esTerminal ? '#fff' : 'var(--color-texto-secundario)'} />
                  <div><div className="tipo-titulo">Parada de paso</div><div className="tipo-desc">Se detiene solo si hay pasaje</div></div>
                </button>
                <button className={`tipo-btn ${esTerminal ? 'activo terminal' : ''}`} onClick={() => setEsTerminal(true)}>
                  <Icon name="flag" size={18} color={esTerminal ? '#fff' : 'var(--color-texto-secundario)'} />
                  <div><div className="tipo-titulo">Terminal / Estacion</div><div className="tipo-desc">Punto de salida o llegada masiva</div></div>
                </button>
              </div>
            </div>
            <div className="form-grupo">
              <label>Infraestructura (opcional)</label>
              <div className="amenidades-grid">
                <label className={`amenidad-chip ${techada ? 'activo' : ''}`}>
                  <input type="checkbox" checked={techada} onChange={e => setTechada(e.target.checked)} />
                  <Icon name="building" size={16} /> Techada
                </label>
                <label className={`amenidad-chip ${iluminacion ? 'activo' : ''}`}>
                  <input type="checkbox" checked={iluminacion} onChange={e => setIluminacion(e.target.checked)} />
                  <Icon name="eye" size={16} /> Iluminacion
                </label>
                <label className={`amenidad-chip ${asientos ? 'activo' : ''}`}>
                  <input type="checkbox" checked={asientos} onChange={e => setAsientos(e.target.checked)} />
                  <Icon name="users" size={16} /> Asientos
                </label>
                <label className={`amenidad-chip ${rampa ? 'activo' : ''}`}>
                  <input type="checkbox" checked={rampa} onChange={e => setRampa(e.target.checked)} />
                  <Icon name="check-circle" size={16} /> Rampa
                </label>
              </div>
            </div>
            <div className="modal-acciones">
              <button className="btn btn-secundario" onClick={() => setNuevaParada(null)}>Cancelar</button>
              <button className="btn btn-primario" disabled={!nombreParada} onClick={agregarParada}>Agregar Parada</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
