import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Auth.css';

export default function Solicitud() {
  const [paso, setPaso] = useState(1);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [tipoPersona, setTipoPersona] = useState('fisica');

  const [titulos, setTitulos] = useState([]);
  const [identificacion, setIdentificacion] = useState(null);
  const [tarjeta, setTarjeta] = useState(null);
  const [poliza, setPoliza] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const fuerzaPassword = (p) => {
    if (p.length < 6) return 'debil';
    if (p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return 'fuerte';
    return 'media';
  };

  const validarPaso1 = () => nombre && telefono && emailContacto && tipoPersona;
  const validarPaso2 = () => titulos.length > 0 && identificacion && tarjeta;
  const validarPaso3 = () => email && password.length >= 6 && password === confirmarPassword;

  const handleTitulos = (e) => {
    const nuevos = Array.from(e.target.files);
    setTitulos((prev) => [...prev, ...nuevos]);
  };

  const eliminarTitulo = (idx) => {
    setTitulos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEnviar = async () => {
    setError('');
    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('telefono', telefono);
      formData.append('emailContacto', emailContacto);
      formData.append('tipoPersona', tipoPersona);
      formData.append('email', email);
      formData.append('password', password);
      titulos.forEach((f) => formData.append('tituloConcesion', f));
      formData.append('identificacion', identificacion);
      formData.append('tarjetaCirculacion', tarjeta);
      if (poliza) formData.append('polizaSeguro', poliza);

      await api.post('/auth/solicitud', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al enviar solicitud');
    } finally {
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <div className="auth-pagina">
        <div className="auth-card solicitud-card fade-in">
          <div className="solicitud-exito">
            <div className="checkmark-circle">
              <Icon name="check" size={40} color="#2E7D32" />
            </div>
            <h2>Solicitud Enviada</h2>
            <p style={{ color: 'var(--color-texto-secundario)', marginTop: 12 }}>
              Tu solicitud sera revisada por el equipo de Zingo. Recibiras una notificacion cuando tu cuenta sea aprobada.
              Podras iniciar sesion con las credenciales que registraste.
            </p>
            <Link to="/login" className="btn btn-primario" style={{ marginTop: 24, display: 'inline-flex' }}>
              Ir a Iniciar Sesion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-pagina">
      <div className="auth-card solicitud-card fade-in">
        <div className="auth-header">
          <h1 className="auth-logo">Zingo</h1>
          <p className="auth-subtitulo">Solicitud de Cuenta — Concesionario</p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {[1, 2, 3, 4].map((num, i) => (
            <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={`stepper-paso ${paso === num ? 'activo' : paso > num ? 'completado' : ''}`}>
                <div className="stepper-circulo">
                  {paso > num ? <Icon name="check" size={14} color="#fff" /> : num}
                </div>
              </div>
              {i < 3 && <div className="stepper-linea" />}
            </div>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {paso === 1 && (
          <div className="fade-in">
            <h3 className="paso-titulo">Informacion de Contacto</h3>
            <div className="form-grupo">
              <label>{tipoPersona === 'moral' ? 'Razon Social' : 'Nombre Completo'}</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan Perez Lopez" required />
            </div>
            <div className="form-grupo">
              <label>Telefono</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="7751234567" required />
            </div>
            <div className="form-grupo">
              <label>Correo de contacto</label>
              <input type="email" value={emailContacto} onChange={(e) => setEmailContacto(e.target.value)} placeholder="contacto@correo.com" required />
            </div>
            <div className="form-grupo">
              <label>Tipo de Persona</label>
              <div className="radio-grupo">
                <div className="radio-opcion">
                  <input type="radio" id="fisica" name="tipo" value="fisica" checked={tipoPersona === 'fisica'} onChange={(e) => setTipoPersona(e.target.value)} />
                  <label htmlFor="fisica">Persona Fisica</label>
                </div>
                <div className="radio-opcion">
                  <input type="radio" id="moral" name="tipo" value="moral" checked={tipoPersona === 'moral'} onChange={(e) => setTipoPersona(e.target.value)} />
                  <label htmlFor="moral">Persona Moral</label>
                </div>
              </div>
            </div>
            <div className="botones-paso">
              <Link to="/login" className="btn btn-secundario">Cancelar</Link>
              <button className="btn btn-primario" disabled={!validarPaso1()} onClick={() => setPaso(2)}>Continuar</button>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="fade-in">
            <h3 className="paso-titulo">Documentos de Concesion</h3>

            <div className="form-grupo">
              <label>Titulo de Concesion (PDF) *</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: 8 }}>
                Cada titulo ampara una sola unidad. Si tienes multiples concesiones, sube todos los titulos.
              </p>
              {titulos.length > 0 && (
                <div className="archivos-lista">
                  {titulos.map((f, i) => (
                    <div key={i} className="archivo-item">
                      <span className="documento-nombre">
                        <Icon name="document" size={14} color="var(--color-primario)" />
                        {f.name}
                      </span>
                      <button onClick={() => eliminarTitulo(i)}>Eliminar</button>
                    </div>
                  ))}
                </div>
              )}
              <label className="upload-zona">
                <input type="file" accept=".pdf" multiple onChange={handleTitulos} />
                <Icon name="folder" size={28} color="var(--color-texto-secundario)" style={{ marginBottom: 8 }} />
                <p>Click para seleccionar PDFs</p>
              </label>
            </div>

            <div className="form-grupo">
              <label>{tipoPersona === 'moral' ? 'Acta Constitutiva (PDF) *' : 'INE (PDF) *'}</label>
              {identificacion && (
                <div className="archivo-item">
                  <span className="documento-nombre">
                    <Icon name="document" size={14} color="var(--color-primario)" />
                    {identificacion.name}
                  </span>
                  <button onClick={() => setIdentificacion(null)}>Eliminar</button>
                </div>
              )}
              {!identificacion && (
                <label className="upload-zona">
                  <input type="file" accept=".pdf" onChange={(e) => setIdentificacion(e.target.files[0])} />
                  <Icon name="folder" size={28} color="var(--color-texto-secundario)" style={{ marginBottom: 8 }} />
                  <p>Click para seleccionar PDF</p>
                </label>
              )}
            </div>

            <div className="form-grupo">
              <label>Tarjeta de Circulacion (PDF) *</label>
              {tarjeta && (
                <div className="archivo-item">
                  <span className="documento-nombre">
                    <Icon name="document" size={14} color="var(--color-primario)" />
                    {tarjeta.name}
                  </span>
                  <button onClick={() => setTarjeta(null)}>Eliminar</button>
                </div>
              )}
              {!tarjeta && (
                <label className="upload-zona">
                  <input type="file" accept=".pdf" onChange={(e) => setTarjeta(e.target.files[0])} />
                  <Icon name="folder" size={28} color="var(--color-texto-secundario)" style={{ marginBottom: 8 }} />
                  <p>Click para seleccionar PDF</p>
                </label>
              )}
            </div>

            <div className="form-grupo">
              <label>Poliza de Seguro (PDF) — Opcional</label>
              {poliza && (
                <div className="archivo-item">
                  <span className="documento-nombre">
                    <Icon name="document" size={14} color="var(--color-primario)" />
                    {poliza.name}
                  </span>
                  <button onClick={() => setPoliza(null)}>Eliminar</button>
                </div>
              )}
              {!poliza && (
                <label className="upload-zona">
                  <input type="file" accept=".pdf" onChange={(e) => setPoliza(e.target.files[0])} />
                  <Icon name="folder" size={28} color="var(--color-texto-secundario)" style={{ marginBottom: 8 }} />
                  <p>Click para seleccionar PDF</p>
                </label>
              )}
            </div>

            <div className="botones-paso">
              <button className="btn btn-secundario" onClick={() => setPaso(1)}>Atras</button>
              <button className="btn btn-primario" disabled={!validarPaso2()} onClick={() => setPaso(3)}>Continuar</button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="fade-in">
            <h3 className="paso-titulo">Credenciales de Acceso</h3>
            <div className="form-grupo">
              <label>Correo para iniciar sesion</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="login@correo.com" />
            </div>
            <div className="form-grupo">
              <label>Contrasena</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caracteres" />
              {password && <div className={`password-strength strength-${fuerzaPassword(password)}`} />}
            </div>
            <div className="form-grupo">
              <label>Confirmar Contrasena</label>
              <input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="Repite tu contrasena" />
              {confirmarPassword && password !== confirmarPassword && (
                <span className="error-texto">Las contrasenas no coinciden</span>
              )}
            </div>
            <div className="botones-paso">
              <button className="btn btn-secundario" onClick={() => setPaso(2)}>Atras</button>
              <button className="btn btn-primario" disabled={!validarPaso3()} onClick={() => setPaso(4)}>Continuar</button>
            </div>
          </div>
        )}

        {paso === 4 && (
          <div className="fade-in">
            <h3 className="paso-titulo">Confirmar Solicitud</h3>

            <div className="resumen-seccion">
              <h4>Datos de Contacto</h4>
              <div className="resumen-dato"><strong>Nombre:</strong> {nombre}</div>
              <div className="resumen-dato"><strong>Telefono:</strong> {telefono}</div>
              <div className="resumen-dato"><strong>Email contacto:</strong> {emailContacto}</div>
              <div className="resumen-dato"><strong>Tipo:</strong> {tipoPersona === 'fisica' ? 'Persona Fisica' : 'Persona Moral'}</div>
            </div>

            <div className="resumen-seccion">
              <h4>Documentos</h4>
              <div className="resumen-dato"><strong>Titulos de concesion:</strong> {titulos.length} archivo(s)</div>
              <div className="resumen-dato"><strong>{tipoPersona === 'moral' ? 'Acta constitutiva' : 'INE'}:</strong> {identificacion?.name}</div>
              <div className="resumen-dato"><strong>Tarjeta de circulacion:</strong> {tarjeta?.name}</div>
              {poliza && <div className="resumen-dato"><strong>Poliza de seguro:</strong> {poliza.name}</div>}
            </div>

            <div className="resumen-seccion">
              <h4>Credenciales</h4>
              <div className="resumen-dato"><strong>Email de login:</strong> {email}</div>
            </div>

            <div style={{ background: '#E8F0FE', padding: 16, borderRadius: 8, fontSize: '0.85rem', color: '#1565C0', marginBottom: 16 }}>
              Tu solicitud sera revisada por el equipo de Zingo. Recibiras una notificacion cuando tu cuenta sea aprobada.
            </div>

            <div className="botones-paso">
              <button className="btn btn-secundario" onClick={() => setPaso(3)}>Atras</button>
              <button className="btn btn-primario" disabled={cargando} onClick={handleEnviar}>
                {cargando ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
