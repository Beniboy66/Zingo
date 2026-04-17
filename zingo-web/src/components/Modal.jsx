import { useState, createContext, useContext, useCallback } from 'react';
import Icon from './Icon';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const mostrarAlerta = useCallback((mensaje, titulo = 'Aviso') => {
    return new Promise(resolve => {
      setModal({
        tipo: 'alerta',
        titulo,
        mensaje,
        onClose: () => { setModal(null); resolve(); }
      });
    });
  }, []);

  const mostrarConfirmar = useCallback((mensaje, { titulo = 'Confirmar', textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', destructivo = false } = {}) => {
    return new Promise(resolve => {
      setModal({
        tipo: 'confirmar',
        titulo,
        mensaje,
        textoAceptar,
        textoCancelar,
        destructivo,
        onAceptar: () => { setModal(null); resolve(true); },
        onCancelar: () => { setModal(null); resolve(false); }
      });
    });
  }, []);

  const mostrarError = useCallback((mensaje) => {
    return new Promise(resolve => {
      setModal({
        tipo: 'error',
        titulo: 'Error',
        mensaje,
        onClose: () => { setModal(null); resolve(); }
      });
    });
  }, []);

  return (
    <ModalContext.Provider value={{ mostrarAlerta, mostrarConfirmar, mostrarError }}>
      {children}
      {modal && (
        <div className="modal-overlay" onClick={modal.onClose || modal.onCancelar}>
          <div className="modal-contenido fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            {modal.tipo === 'error' && (
              <div className="modal-icono-header modal-icono-error">
                <Icon name="x-circle" size={28} color="#C62828" />
              </div>
            )}
            {modal.tipo === 'alerta' && (
              <div className="modal-icono-header" style={{ background: '#E3F2FD' }}>
                <Icon name="bell" size={28} color="#1565C0" />
              </div>
            )}
            <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{modal.titulo}</h2>
            <p style={{ color: 'var(--color-texto-secundario)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
              {modal.mensaje}
            </p>
            {modal.tipo === 'confirmar' ? (
              <div className="modal-acciones" style={{ justifyContent: 'center' }}>
                <button className="btn btn-secundario" onClick={modal.onCancelar}>{modal.textoCancelar}</button>
                <button className="btn btn-primario" onClick={modal.onAceptar}
                  style={modal.destructivo ? { background: 'var(--color-texto-secundario)' } : {}}>
                  {modal.textoAceptar}
                </button>
              </div>
            ) : (
              <button className="btn btn-primario" onClick={modal.onClose} style={{ width: '100%' }}>
                Aceptar
              </button>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
