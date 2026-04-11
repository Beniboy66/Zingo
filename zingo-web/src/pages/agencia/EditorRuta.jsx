import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Agencia.css';

const LIBRARIES = ['drawing'];
const MAPA_CENTRO = { lat: 20.0833, lng: -98.3625 };
const COLORES = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#FF2D55'];

export default function EditorRuta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const mapaRef = useRef(null);

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

  const [trazo, setTrazo] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [modoParada, setModoParada] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(!!id);

  // Modal para nueva parada
  const [nuevaParada, setNuevaParada] = useState(null);
  const [nombreParada, setNombreParada] = useState('');
  const [referenciaParada, setReferenciaParada] = useState('');
  const [esTerminal, setEsTerminal] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.get(`/rutas/${id}`),
        api.get(`/paradas/ruta/${id}`)
      ]).then(([rutaRes, paradasRes]) => {
        const ruta = rutaRes.data.datos;
        setNombre(ruta.nombre);
        setDescripcion(ruta.descripcion || '');
        setTarifa(ruta.tarifa);
        setHorarioInicio(ruta.horarioInicio);
        setHorarioFin(ruta.horarioFin);
        setFrecuenciaMin(ruta.frecuenciaMin);
        setDiasOperacion(ruta.diasOperacion);
        setColor(ruta.color);
        setVelocidad(ruta.velocidadPromedioKmh || 20);
        if (ruta.trazo?.coordinates) {
          setTrazo(ruta.trazo.coordinates.map(([lng, lat]) => ({ lat, lng })));
        }
        setParadas((paradasRes.data.datos || []).map((p) => ({
          _id: p._id,
          nombre: p.nombre,
          referencia: p.referencia || '',
          esTerminal: p.esTerminal,
          orden: p.orden,
          lat: p.ubicacion.coordinates[1],
          lng: p.ubicacion.coordinates[0]
        })));
      }).catch(() => navigate('/agencia/dashboard'))
        .finally(() => setCargando(false));
    }
  }, [id, navigate]);

  const onMapClick = useCallback((e) => {
    const punto = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    if (modoParada) {
      setNuevaParada(punto);
      setNombreParada('');
      setReferenciaParada('');
      setEsTerminal(false);
    } else {
      setTrazo((prev) => [...prev, punto]);
    }
  }, [modoParada]);

  const agregarParada = () => {
    if (!nuevaParada || !nombreParada) return;
    setParadas((prev) => [...prev, {
      nombre: nombreParada,
      referencia: referenciaParada,
      esTerminal,
      orden: prev.length + 1,
      lat: nuevaParada.lat,
      lng: nuevaParada.lng
    }]);
    setNuevaParada(null);
  };

  const eliminarParada = (idx) => {
    setParadas((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, orden: i + 1 })));
  };

  const deshacerTrazo = () => {
    setTrazo((prev) => prev.slice(0, -1));
  };

  const limpiarTrazo = () => {
    if (confirm('¿Limpiar todo el trazo?')) {
      setTrazo([]);
    }
  };

  const guardar = async (enviarRevision = false) => {
    if (!nombre) return alert('El nombre de la ruta es obligatorio');
    if (trazo.length < 2) return alert('Dibuja el trazo de la ruta en el mapa (al menos 2 puntos)');

    setGuardando(true);
    try {
      const datos = {
        nombre,
        descripcion,
        tarifa: Number(tarifa),
        horarioInicio,
        horarioFin,
        frecuenciaMin: Number(frecuenciaMin),
        diasOperacion,
        color,
        velocidadPromedioKmh: Number(velocidad),
        trazo: {
          type: 'LineString',
          coordinates: trazo.map((p) => [p.lng, p.lat])
        },
        estado: enviarRevision ? 'en_revision' : 'borrador'
      };

      let rutaId = id;
      if (id) {
        await api.put(`/rutas/${id}`, datos);
      } else {
        const { data } = await api.post('/rutas', datos);
        rutaId = data.datos._id;
      }

      // Guardar paradas
      if (id) {
        // Eliminar paradas existentes y recrear
        const { data: paradasExistentes } = await api.get(`/paradas/ruta/${rutaId}`);
        for (const p of (paradasExistentes.datos || [])) {
          await api.delete(`/paradas/${p._id}`);
        }
      }
      for (const p of paradas) {
        await api.post('/paradas', {
          rutaId,
          nombre: p.nombre,
          orden: p.orden,
          esTerminal: p.esTerminal,
          referencia: p.referencia,
          ubicacion: {
            type: 'Point',
            coordinates: [p.lng, p.lat]
          }
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
      {/* Mapa */}
      <div className="editor-mapa">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={trazo.length > 0 ? trazo[0] : MAPA_CENTRO}
          zoom={14}
          onClick={onMapClick}
          onLoad={(map) => { mapaRef.current = map; }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {trazo.length >= 2 && (
            <Polyline
              path={trazo}
              options={{ strokeColor: color, strokeWeight: 4, strokeOpacity: 0.9 }}
            />
          )}
          {trazo.map((p, i) => (
            <Marker
              key={`t-${i}`}
              position={p}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 4,
                fillColor: color,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#fff'
              }}
            />
          ))}
          {paradas.map((p, i) => (
            <Marker
              key={`p-${i}`}
              position={{ lat: p.lat, lng: p.lng }}
              label={{ text: String(p.orden), color: '#fff', fontSize: '10px', fontWeight: '700' }}
              title={p.nombre}
            />
          ))}
        </GoogleMap>

        {/* Controles del mapa */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 10 }}>
          <button
            className={`btn ${modoParada ? 'btn-exito' : 'btn-secundario'}`}
            onClick={() => setModoParada(!modoParada)}
            style={{ background: modoParada ? 'var(--color-exito)' : 'white', fontSize: '0.85rem' }}
          >
            {modoParada ? '📍 Modo Parada (ON)' : '📍 Agregar Paradas'}
          </button>
          <button className="btn btn-secundario" onClick={deshacerTrazo} style={{ background: 'white', fontSize: '0.85rem' }}>
            ↩ Deshacer
          </button>
          <button className="btn btn-secundario" onClick={limpiarTrazo} style={{ background: 'white', fontSize: '0.85rem' }}>
            🗑 Limpiar
          </button>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="editor-panel">
        <h2>{id ? 'Editar Ruta' : 'Nueva Ruta'}</h2>

        <div className="form-grupo">
          <label>Nombre de la ruta *</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Ruta 1 - Centro a Santiago" />
        </div>

        <div className="form-grupo">
          <label>Descripcion</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe el recorrido..." style={{ minHeight: 60 }} />
        </div>

        <div className="editor-fila">
          <div className="form-grupo">
            <label>Tarifa ($)</label>
            <input type="number" value={tarifa} onChange={(e) => setTarifa(e.target.value)} min="0" step="0.5" />
          </div>
          <div className="form-grupo">
            <label>Velocidad (km/h)</label>
            <input type="number" value={velocidad} onChange={(e) => setVelocidad(e.target.value)} min="5" />
          </div>
        </div>

        <div className="editor-fila">
          <div className="form-grupo">
            <label>Hora inicio</label>
            <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
          </div>
          <div className="form-grupo">
            <label>Hora fin</label>
            <input type="time" value={horarioFin} onChange={(e) => setHorarioFin(e.target.value)} />
          </div>
        </div>

        <div className="editor-fila">
          <div className="form-grupo">
            <label>Frecuencia (min)</label>
            <input type="number" value={frecuenciaMin} onChange={(e) => setFrecuenciaMin(e.target.value)} min="1" />
          </div>
          <div className="form-grupo">
            <label>Dias de operacion</label>
            <select value={diasOperacion} onChange={(e) => setDiasOperacion(e.target.value)}>
              <option value="L-D">L-D (Toda la semana)</option>
              <option value="L-S">L-S (Lun a Sab)</option>
              <option value="L-V">L-V (Lun a Vie)</option>
            </select>
          </div>
        </div>

        <div className="form-grupo">
          <label>Color de la ruta</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORES.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--color-texto)' : '2px solid transparent',
                  cursor: 'pointer', transition: 'border 0.2s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Lista de paradas */}
        <div className="paradas-lista">
          <h3>Paradas ({paradas.length})</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 12 }}>
            Activa "Agregar Paradas" y haz click en el mapa.
          </p>
          {paradas.map((p, i) => (
            <div key={i} className="parada-item">
              <div className="parada-orden">{p.orden}</div>
              <div className="parada-info">
                <div className="parada-nombre">{p.nombre} {p.esTerminal ? '(Terminal)' : ''}</div>
                {p.referencia && <div className="parada-ref">{p.referencia}</div>}
              </div>
              <div className="parada-acciones">
                <button onClick={() => eliminarParada(i)} title="Eliminar">✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones */}
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

      {/* Modal nueva parada */}
      {nuevaParada && (
        <div className="modal-overlay" onClick={() => setNuevaParada(null)}>
          <div className="modal-contenido fade-in" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Parada</h2>
            <div className="form-grupo">
              <label>Nombre de la parada *</label>
              <input value={nombreParada} onChange={(e) => setNombreParada(e.target.value)} placeholder="Ej: Terminal Centro" autoFocus />
            </div>
            <div className="form-grupo">
              <label>Referencia</label>
              <input value={referenciaParada} onChange={(e) => setReferenciaParada(e.target.value)} placeholder="Ej: Frente al mercado" />
            </div>
            <div className="form-grupo">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={esTerminal} onChange={(e) => setEsTerminal(e.target.checked)} style={{ width: 'auto' }} />
                Es terminal (inicio o fin de ruta)
              </label>
            </div>
            <div className="modal-acciones">
              <button className="btn btn-secundario" onClick={() => setNuevaParada(null)}>Cancelar</button>
              <button className="btn btn-primario" disabled={!nombreParada} onClick={agregarParada}>Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
