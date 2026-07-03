import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [observaciones, setObservaciones] = useState([
    { 
      id: 1, 
      descripcion: 'Las tuberías irán enterradas o dentro del falso piso',
      estado: 'PENDIENTE' // PENDIENTE, CONFORME, NO CONFORME, SUBSANADO
    }
  ]);

  const [toast, setToast] = useState({ visible: false, mensaje: '' });

  const cambiarEstado = (id, nuevoEstado) => {
    setObservaciones(prev =>
      prev.map(obs => {
        if (obs.id === id) {
          const estadoAnterior = obs.estado;
          // Mostrar toast
          setToast({ visible: true, mensaje: `${estadoAnterior} → ${nuevoEstado}` });
          setTimeout(() => setToast({ visible: false, mensaje: '' }), 3000);
          return { ...obs, estado: nuevoEstado };
        }
        return obs;
      })
    );
  };

  const toggleConforme = (id, checked) => {
    if (checked) {
      cambiarEstado(id, 'CONFORME');
    } else {
      cambiarEstado(id, 'PENDIENTE');
    }
  };

  const getBadgeClass = (estado) => {
    const clases = {
      'CONFORME': 'badge-conforme',
      'NO CONFORME': 'badge-no-conforme',
      'SUBSANADO': 'badge-pendiente',
      'PENDIENTE': 'badge-pendiente'
    };
    return `estado-badge ${clases[estado] || 'badge-pendiente'}`;
  };

  const getToggleClass = (estado) => {
    if (estado === 'CONFORME') return 'conforme-toggle conforme-activo';
    if (estado === 'NO CONFORME') return 'conforme-toggle no-conforme-activo';
    return 'conforme-toggle';
  };

  return (
    <div className="app">
      <h1>📋 Gestión de Observaciones</h1>

      {observaciones.map(obs => (
        <div key={obs.id} className="observacion">
          <div className="obs-header">
            <span className="obs-titulo">🔍 Observación #{obs.id}</span>
            <span className="fecha">2/7/2023</span>
          </div>
          <div className="obs-descripcion">
            <strong>Descripción:</strong> {obs.descripcion}
          </div>

          {/* CHECKBOX CONFORME - SIN MODALES */}
          <div 
            className={getToggleClass(obs.estado)}
            onClick={() => toggleConforme(obs.id, obs.estado !== 'CONFORME')}
          >
            <input
              type="checkbox"
              checked={obs.estado === 'CONFORME'}
              onChange={(e) => {
                e.stopPropagation();
                toggleConforme(obs.id, e.target.checked);
              }}
            />
            <label>✅ Marcar como CONFORME</label>
            <span className={getBadgeClass(obs.estado)}>{obs.estado}</span>
          </div>

          {/* BOTONES RÁPIDOS */}
          <div className="acciones">
            <button 
              className={`btn-estado btn-conforme ${obs.estado === 'CONFORME' ? 'activo' : ''}`}
              onClick={() => cambiarEstado(obs.id, 'CONFORME')}
            >
              ✔ CONFORME
            </button>
            <button 
              className={`btn-estado btn-no-conforme ${obs.estado === 'NO CONFORME' ? 'activo' : ''}`}
              onClick={() => cambiarEstado(obs.id, 'NO CONFORME')}
            >
              ✘ NO CONFORME
            </button>
            <button 
              className={`btn-estado btn-subsanado ${obs.estado === 'SUBSANADO' ? 'activo' : ''}`}
              onClick={() => cambiarEstado(obs.id, 'SUBSANADO')}
            >
              🔄 SUBSANADO
            </button>
          </div>
        </div>
      ))}

      {/* TOAST */}
      {toast.visible && (
        <div className="toast exito mostrar">
          ✅ Estado cambiado: {toast.mensaje}
        </div>
      )}
    </div>
  );
};

export default App;