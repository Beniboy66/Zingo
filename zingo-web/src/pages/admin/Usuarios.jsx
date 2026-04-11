import { useState, useEffect } from 'react';
import api from '../../services/api';
import Icon from '../../components/Icon';
import './Admin.css';

const ROLES = { super_admin: 'Super Admin', agencia: 'Concesionario', usuario: 'Pasajero' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const { data } = await api.get('/admin/usuarios');
      setUsuarios(data.datos || []);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const suspender = async (id) => {
    if (!confirm('Suspender este usuario?')) return;
    try {
      await api.put(`/admin/usuarios/${id}/suspender`);
      cargar();
    } catch (err) { alert(err.response?.data?.mensaje || 'Error'); }
  };

  const reactivar = async (id) => {
    try {
      await api.put(`/admin/usuarios/${id}/reactivar`);
      cargar();
    } catch (err) { alert(err.response?.data?.mensaje || 'Error'); }
  };

  const eliminar = async (id) => {
    if (!confirm('Eliminar este usuario permanentemente?')) return;
    try {
      await api.delete(`/admin/usuarios/${id}`);
      cargar();
    } catch (err) { alert(err.response?.data?.mensaje || 'Error'); }
  };

  const filtrados = usuarios.filter(u => {
    if (filtroRol && u.rol !== filtroRol) return false;
    if (filtroEstado && u.estado !== filtroEstado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  if (cargando) return <div className="spinner" />;

  return (
    <div className="pagina-contenedor fade-in">
      <div className="pagina-header">
        <h1 className="pagina-titulo">Gestion de Usuarios</h1>
        <span className="contador-badge">{filtrados.length} usuarios</span>
      </div>

      <div className="filtros-barra">
        <div className="busqueda-input">
          <Icon name="search" size={16} color="var(--color-texto-secundario)" />
          <input placeholder="Buscar por nombre o email..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="usuario">Pasajeros</option>
          <option value="agencia">Concesionarios</option>
          <option value="super_admin">Administradores</option>
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="aprobado">Activo</option>
          <option value="pendiente">Pendiente</option>
          <option value="suspendido">Suspendido</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="vacio-estado card">
          <div className="vacio-icono"><Icon name="users" size={48} color="var(--color-texto-secundario)" /></div>
          <h3>Sin resultados</h3>
          <p>No se encontraron usuarios con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.nombre}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-en-revision">{ROLES[u.rol] || u.rol}</span></td>
                  <td><span className={`badge badge-${u.estado}`}>{u.estado}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString('es-MX')}</td>
                  <td>
                    <div className="tabla-acciones">
                      {u.rol !== 'super_admin' && (
                        <>
                          {u.estado === 'suspendido' ? (
                            <button className="btn btn-exito" onClick={() => reactivar(u._id)}>
                              <Icon name="check" size={14} color="#fff" /> Reactivar
                            </button>
                          ) : u.estado !== 'pendiente' && (
                            <button className="btn btn-secundario" onClick={() => suspender(u._id)}>
                              Suspender
                            </button>
                          )}
                          <button className="btn btn-error" onClick={() => eliminar(u._id)}>
                            <Icon name="trash" size={14} color="#fff" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
