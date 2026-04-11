import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Agencia.css';

const TIPOS = {
  mal_estado: 'Mal Estado',
  ruta_no_respetada: 'Ruta No Respetada',
  acoso: 'Acoso',
  inseguridad: 'Inseguridad',
  tarifa_incorrecta: 'Tarifa Incorrecta',
  otro: 'Otro'
};

export default function Estadisticas() {
  const { usuario } = useAuth();
  const [rutas, setRutas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    const cargar = async () => {
      try {
        const { data } = await api.get(`/rutas/agencia/${usuario._id}`);
        const misRutas = data.datos || [];
        setRutas(misRutas);

        const todosReportes = [];
        for (const r of misRutas) {
          try {
            const res = await api.get(`/reportes/ruta/${r._id}`);
            todosReportes.push(...(res.data.datos || []).map(rep => ({ ...rep, rutaNombre: r.nombre })));
          } catch (e) { /* skip */ }
        }
        setReportes(todosReportes);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [usuario]);

  if (cargando) return <div className="spinner" />;

  const totalConsultas = rutas.reduce((acc, r) => acc + (r.consultas || 0), 0);

  return (
    <div className="pagina-contenedor fade-in">
      <h1 className="pagina-titulo">Estadisticas</h1>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primario)' }}>{rutas.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Rutas Totales</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-exito)' }}>{rutas.filter(r => r.estado === 'publicada').length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Rutas Publicadas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-advertencia)' }}>{totalConsultas}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Consultas Totales</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-error)' }}>{reportes.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>Reportes Recibidos</div>
        </div>
      </div>

      {/* Consultas por ruta */}
      <h2 style={{ marginBottom: 16 }}>Consultas por Ruta</h2>
      <div className="card" style={{ marginBottom: 32 }}>
        {rutas.length === 0 ? (
          <p style={{ color: 'var(--color-texto-secundario)', textAlign: 'center', padding: 20 }}>Sin rutas registradas</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rutas.map((r) => {
              const porcentaje = totalConsultas > 0 ? (r.consultas / totalConsultas) * 100 : 0;
              return (
                <div key={r._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{r.nombre}</span>
                    <span style={{ color: 'var(--color-texto-secundario)' }}>{r.consultas} consultas</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--color-fondo)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${porcentaje}%`, background: r.color || 'var(--color-primario)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reportes recibidos */}
      <h2 style={{ marginBottom: 16 }}>Reportes en tus Rutas</h2>
      {reportes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-texto-secundario)' }}>
          <p>No hay reportes en tus rutas</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reportes.map((r) => (
            <div key={r._id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className={`badge badge-${r.estado}`}>{r.estado}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>{r.rutaNombre}</span>
              </div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 4 }}>{TIPOS[r.tipo] || r.tipo}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>{r.descripcion}</p>
              <div style={{ fontSize: '0.8rem', marginTop: 8, color: 'var(--color-texto-secundario)' }}>
                Votos: <span style={{ color: 'var(--color-exito)' }}>+{r.votosFavor}</span> / <span style={{ color: 'var(--color-error)' }}>-{r.votosContra}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
