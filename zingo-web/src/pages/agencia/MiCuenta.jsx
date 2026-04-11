import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icon';
import './Agencia.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function MiCuenta() {
  const { usuario } = useAuth();

  if (!usuario) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <h1 className="pagina-titulo">Mi Cuenta</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-borde)' }}>Datos Personales</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Nombre</div>
              <div style={{ fontWeight: 500 }}>{usuario.nombre}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Email</div>
              <div>{usuario.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Rol</div>
              <div><span className="badge badge-aprobado">{usuario.rol === 'agencia' ? 'Concesionario' : usuario.rol}</span></div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Estado</div>
              <div><span className={`badge badge-${usuario.estado}`}>{usuario.estado}</span></div>
            </div>
          </div>
        </div>

        {usuario.datosVerificados && (
          <div className="card">
            <h3 style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-borde)' }}>Datos Verificados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {usuario.datosVerificados.nombreConcesionario && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Concesionario</div>
                  <div style={{ fontWeight: 500 }}>{usuario.datosVerificados.nombreConcesionario}</div>
                </div>
              )}
              {usuario.datosVerificados.nombreEmpresa && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Empresa</div>
                  <div>{usuario.datosVerificados.nombreEmpresa}</div>
                </div>
              )}
              {usuario.datosVerificados.folioTituloConcesion && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Folio Titulo</div>
                  <div>{usuario.datosVerificados.folioTituloConcesion}</div>
                </div>
              )}
              {usuario.datosVerificados.rutaAutorizada && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Ruta Autorizada</div>
                  <div>{usuario.datosVerificados.rutaAutorizada}</div>
                </div>
              )}
              {usuario.datosVerificados.fechaAprobacion && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 2 }}>Fecha Aprobacion</div>
                  <div>{new Date(usuario.datosVerificados.fechaAprobacion).toLocaleDateString('es-MX')}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {usuario.documentos && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-borde)' }}>Documentos Subidos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {usuario.documentos.tituloConcesion?.map((doc, i) => (
                <div key={i} className="documento-item">
                  <span className="documento-nombre">
                    <Icon name="document" size={16} color="var(--color-primario)" />
                    Titulo de Concesion {i + 1}
                  </span>
                  <a href={`${API_BASE}/${doc}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primario)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>Ver PDF</a>
                </div>
              ))}
              {usuario.documentos.identificacion && (
                <div className="documento-item">
                  <span className="documento-nombre">
                    <Icon name="document" size={16} color="var(--color-primario)" />
                    {usuario.tipoPersona === 'moral' ? 'Acta Constitutiva' : 'INE'}
                  </span>
                  <a href={`${API_BASE}/${usuario.documentos.identificacion}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primario)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>Ver PDF</a>
                </div>
              )}
              {usuario.documentos.tarjetaCirculacion && (
                <div className="documento-item">
                  <span className="documento-nombre">
                    <Icon name="document" size={16} color="var(--color-primario)" />
                    Tarjeta de Circulacion
                  </span>
                  <a href={`${API_BASE}/${usuario.documentos.tarjetaCirculacion}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primario)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>Ver PDF</a>
                </div>
              )}
              {usuario.documentos.polizaSeguro && (
                <div className="documento-item">
                  <span className="documento-nombre">
                    <Icon name="document" size={16} color="var(--color-primario)" />
                    Poliza de Seguro
                  </span>
                  <a href={`${API_BASE}/${usuario.documentos.polizaSeguro}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primario)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>Ver PDF</a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
