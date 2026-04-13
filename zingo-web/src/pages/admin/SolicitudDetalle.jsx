import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Admin.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function SolicitudDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [solicitud, setSolicitud] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalAprobar, setModalAprobar] = useState(false);
  const [modalRechazar, setModalRechazar] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [nombreConcesionario, setNombreConcesionario] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [folioTitulo, setFolioTitulo] = useState('');
  const [rutaAutorizada, setRutaAutorizada] = useState('');
  const [notasAdmin, setNotasAdmin] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  useEffect(() => {
    api.get(`/admin/solicitudes/${id}`)
      .then(({ data }) => {
        const s = data.datos;
        setSolicitud(s);
        setNombreConcesionario(s.nombre);
        if (s.tipoPersona === 'moral') setNombreEmpresa(s.nombre);
      })
      .catch(() => navigate('/admin/solicitudes'))
      .finally(() => setCargando(false));
  }, [id, navigate]);

  const handleAprobar = async () => {
    setProcesando(true);
    try {
      await api.put(`/admin/solicitudes/${id}/aprobar`, {
        nombreConcesionario,
        nombreEmpresa,
        folioTituloConcesion: folioTitulo,
        rutaAutorizada,
        notasAdmin
      });
      navigate('/admin/solicitudes');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al aprobar');
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo) return;
    setProcesando(true);
    try {
      await api.put(`/admin/solicitudes/${id}/rechazar`, { motivo: motivoRechazo });
      navigate('/admin/solicitudes');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al rechazar');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <div className="spinner" />;
  if (!solicitud) return null;

  return (
    <div className="pagina-contenedor fade-in">
      <button className="btn btn-secundario" onClick={() => navigate('/admin/solicitudes')} style={{ marginBottom: 20 }}>
        ← Volver
      </button>

      <h1 className="pagina-titulo">Solicitud de {solicitud.nombre}</h1>

      <div className="detalle-grid">
        <div className="detalle-seccion">
          <h3>Informacion de Contacto</h3>
          <div className="detalle-campo">
            <span className="label">Nombre</span>
            <span>{solicitud.nombre}</span>
          </div>
          <div className="detalle-campo">
            <span className="label">Tipo</span>
            <span>{solicitud.tipoPersona === 'moral' ? 'Persona Moral' : 'Persona Fisica'}</span>
          </div>
          <div className="detalle-campo">
            <span className="label">Telefono</span>
            <span>{solicitud.telefono}</span>
          </div>
          <div className="detalle-campo">
            <span className="label">Email contacto</span>
            <span>{solicitud.emailContacto}</span>
          </div>
          <div className="detalle-campo">
            <span className="label">Email login</span>
            <span>{solicitud.email}</span>
          </div>
          <div className="detalle-campo">
            <span className="label">Fecha solicitud</span>
            <span>{new Date(solicitud.createdAt).toLocaleString('es-MX')}</span>
          </div>
        </div>

        <div className="detalle-seccion">
          <h3>Documentos PDF</h3>
          <div className="documentos-lista">
            {solicitud.documentos?.tituloConcesion?.map((doc, i) => (
              <div key={i} className="documento-item">
                <span className="documento-nombre">
                  <Icon name="document" size={16} color="var(--color-primario)" />
                  Titulo de Concesion {i + 1}
                </span>
                <a href={`${API_BASE}/${doc}`} target="_blank" rel="noopener noreferrer">Ver PDF</a>
              </div>
            ))}
            {solicitud.documentos?.identificacion && (
              <div className="documento-item">
                <span className="documento-nombre">
                  <Icon name="document" size={16} color="var(--color-primario)" />
                  {solicitud.tipoPersona === 'moral' ? 'Acta Constitutiva' : 'INE'}
                </span>
                <a href={`${API_BASE}/${solicitud.documentos.identificacion}`} target="_blank" rel="noopener noreferrer">Ver PDF</a>
              </div>
            )}
            {solicitud.documentos?.tarjetaCirculacion && (
              <div className="documento-item">
                <span className="documento-nombre">
                  <Icon name="document" size={16} color="var(--color-primario)" />
                  Tarjeta de Circulacion
                </span>
                <a href={`${API_BASE}/${solicitud.documentos.tarjetaCirculacion}`} target="_blank" rel="noopener noreferrer">Ver PDF</a>
              </div>
            )}
            {solicitud.documentos?.polizaSeguro && (
              <div className="documento-item">
                <span className="documento-nombre">
                  <Icon name="document" size={16} color="var(--color-primario)" />
                  Poliza de Seguro
                </span>
                <a href={`${API_BASE}/${solicitud.documentos.polizaSeguro}`} target="_blank" rel="noopener noreferrer">Ver PDF</a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="btn btn-primario" onClick={() => setModalAprobar(true)}>
          <Icon name="check" size={16} color="#fff" /> Aprobar Solicitud
        </button>
        <button className="btn btn-secundario" onClick={() => setModalRechazar(true)}>
          <Icon name="x" size={16} color="var(--color-texto)" /> Rechazar Solicitud
        </button>
      </div>

      {modalAprobar && (
        <div className="modal-overlay" onClick={() => setModalAprobar(false)}>
          <div className="modal-contenido fade-in" onClick={(e) => e.stopPropagation()}>
            <h2>Aprobar Solicitud</h2>
            <p style={{ color: 'var(--color-texto-secundario)', marginBottom: 20, fontSize: '0.9rem' }}>
              Completa los datos verificados para activar la cuenta.
            </p>
            <div className="form-grupo">
              <label>Nombre del concesionario (verificado)</label>
              <input value={nombreConcesionario} onChange={(e) => setNombreConcesionario(e.target.value)} />
            </div>
            <div className="form-grupo">
              <label>Nombre de empresa (si aplica)</label>
              <input value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)} />
            </div>
            <div className="form-grupo">
              <label>Folio del titulo de concesion</label>
              <input value={folioTitulo} onChange={(e) => setFolioTitulo(e.target.value)} placeholder="Ej: STCH/TC/2022/04521" />
            </div>
            <div className="form-grupo">
              <label>Ruta autorizada segun el titulo</label>
              <input value={rutaAutorizada} onChange={(e) => setRutaAutorizada(e.target.value)} placeholder="Ej: Ruta 1 - Centro a Santiago" />
            </div>
            <div className="form-grupo">
              <label>Notas internas</label>
              <textarea value={notasAdmin} onChange={(e) => setNotasAdmin(e.target.value)} placeholder="Observaciones..." />
            </div>
            <div className="modal-acciones">
              <button className="btn btn-secundario" onClick={() => setModalAprobar(false)}>Cancelar</button>
              <button className="btn btn-primario" disabled={procesando || !nombreConcesionario || !folioTitulo} onClick={handleAprobar}>
                {procesando ? 'Aprobando...' : 'Confirmar Aprobacion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalRechazar && (
        <div className="modal-overlay" onClick={() => setModalRechazar(false)}>
          <div className="modal-contenido fade-in" onClick={(e) => e.stopPropagation()}>
            <h2>Rechazar Solicitud</h2>
            <div className="form-grupo">
              <label>Motivo del rechazo</label>
              <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Explica por que se rechaza la solicitud..." />
            </div>
            <div className="modal-acciones">
              <button className="btn btn-secundario" onClick={() => setModalRechazar(false)}>Cancelar</button>
              <button className="btn btn-secundario" disabled={procesando || !motivoRechazo} onClick={handleRechazar}>
                {procesando ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
