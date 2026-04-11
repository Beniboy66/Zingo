import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Agencia.css';

export default function Avisos() {
  const { usuario } = useAuth();
  const [rutas, setRutas] = useState([]);
  const [rutaId, setRutaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState('informativo');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      api.get(`/rutas/agencia/${usuario._id}`)
        .then(({ data }) => setRutas(data.datos || []))
        .catch(() => {});
    }
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setEnviando(true);
    try {
      const datos = { rutaId: rutaId || undefined, titulo, mensaje, tipo };
      if (fechaExpiracion) datos.fechaExpiracion = fechaExpiracion;
      await api.post('/avisos', datos);
      setExito('Aviso publicado correctamente');
      setTitulo('');
      setMensaje('');
      setRutaId('');
      setFechaExpiracion('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al publicar aviso');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pagina-contenedor fade-in">
      <h1 className="pagina-titulo">Publicar Aviso</h1>

      <form onSubmit={handleSubmit} className="aviso-form">
        {exito && <div className="auth-exito">{exito}</div>}
        {error && <div className="auth-error">{error}</div>}

        <div className="form-grupo">
          <label>Ruta (opcional)</label>
          <select value={rutaId} onChange={(e) => setRutaId(e.target.value)}>
            <option value="">Aviso general</option>
            {rutas.map((r) => (
              <option key={r._id} value={r._id}>{r.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-grupo">
          <label>Tipo de aviso</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="informativo">Informativo</option>
            <option value="suspension">Suspension</option>
            <option value="desvio">Desvio</option>
            <option value="retraso">Retraso</option>
          </select>
        </div>

        <div className="form-grupo">
          <label>Titulo *</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Servicio reducido" required />
        </div>

        <div className="form-grupo">
          <label>Mensaje *</label>
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Detalla el aviso..." required />
        </div>

        <div className="form-grupo">
          <label>Fecha de expiracion (opcional)</label>
          <input type="datetime-local" value={fechaExpiracion} onChange={(e) => setFechaExpiracion(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primario" disabled={enviando} style={{ width: '100%', marginTop: 8 }}>
          {enviando ? 'Publicando...' : 'Publicar Aviso'}
        </button>
      </form>
    </div>
  );
}
