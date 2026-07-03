// ============================================
// 1. ESTRUCTURA DE DATOS CORREGIDA
// ============================================

// Cada observación debe tener estos campos:
// - id: identificador único
// - estado: 'CONFORME' | 'SE REITERA OBSERVACIÓN' | 'PENDIENTE' | 'OBSERVADO'
// - evaluado: boolean (true si el evaluador puso CONFORME o SE REITERA OBSERVACIÓN)
// - subsanado: boolean (true si el usuario presionó "Enviar para revisión")
// - fechaRevision: string
// - comentario: string

// ============================================
// 2. FUNCIÓN PARA ACTUALIZAR CONTADORES
// ============================================

function actualizarContadores() {
    const filas = document.querySelectorAll('#tabla-observaciones tbody tr');
    
    let total = filas.length;
    let conformes = 0;
    let evaluados = 0;
    let subsanados = 0;
    let pendientes = 0;
    
    filas.forEach(fila => {
        const estado = fila.querySelector('.estado-select')?.value || '';
        const evaluado = fila.dataset.evaluado === 'true'; // Marcado por evaluador
        const subsanado = fila.dataset.subsanado === 'true'; // Enviado por usuario
        
        // CONFORMES: solo estado CONFORME
        if (estado === 'CONFORME') {
            conformes++;
        }
        
        // EVALUADOS: CONFORME + SE REITERA OBSERVACIÓN (ambos)
        if (estado === 'CONFORME' || estado === 'SE REITERA OBSERVACIÓN') {
            evaluados++;
        }
        
        // SUBSANADOS: todos los que el usuario envió (dataset.subsanado = true)
        if (subsanado) {
            subsanados++;
        }
        
        // PENDIENTES: los que NO están subsanados
        if (!subsanado) {
            pendientes++;
        }
    });
    
    // Actualizar UI
    document.getElementById('contador-total').textContent = total;
    document.getElementById('contador-conformes').textContent = conformes;
    document.getElementById('contador-evaluados').textContent = evaluados;
    document.getElementById('contador-subsanados').textContent = subsanados;
    document.getElementById('contador-pendientes').textContent = pendientes;
}

// ============================================
// 3. CUANDO EL EVALUADOR CAMBIA EL ESTADO
// ============================================

function cambiarEstado(selectElement) {
    const fila = selectElement.closest('tr');
    const estado = selectElement.value;
    
    // Marcar como evaluado SOLO si es CONFORME o SE REITERA OBSERVACIÓN
    if (estado === 'CONFORME' || estado === 'SE REITERA OBSERVACIÓN') {
        fila.dataset.evaluado = 'true';
    } else {
        fila.dataset.evaluado = 'false';
    }
    
    // Actualizar fecha de revisión
    actualizarFechaRevision(selectElement);
    
    // Guardar cambios
    guardarEvaluacionLocal();
    
    // Actualizar contadores
    actualizarContadores();
}

// ============================================
// 4. CUANDO EL USUARIO PRESIONA "ENVIAR PARA REVISIÓN"
// ============================================

function enviarParaRevision() {
    // Obtener todas las filas que NO están subsanadas aún
    const filas = document.querySelectorAll('#tabla-observaciones tbody tr:not([data-subsanado="true"])');
    
    if (filas.length === 0) {
        mostrarMensaje('Todas las observaciones ya han sido enviadas para revisión', 'info');
        return;
    }
    
    // Marcar todas como subsanadas
    filas.forEach(fila => {
        fila.dataset.subsanado = 'true';
        
        // Opcional: cambiar visualmente el estado
        fila.style.backgroundColor = '#f0f8ff';
        fila.querySelector('.btn-enviar-revision-fila')?.disabled = true;
        fila.querySelector('.btn-enviar-revision-fila')?.textContent = '✓ Enviado';
    });
    
    // Guardar en localStorage
    guardarEvaluacionLocal();
    
    // Actualizar contadores
    actualizarContadores();
    
    mostrarMensaje(`${filas.length} observaciones enviadas para revisión`, 'success');
}

// ============================================
// 5. FUNCIÓN PARA GUARDAR EN LOCALSTORAGE
// ============================================

function guardarEvaluacionLocal() {
    const filas = document.querySelectorAll('#tabla-observaciones tbody tr');
    const datos = [];
    
    filas.forEach(fila => {
        const id = fila.dataset.id || fila.querySelector('.id-observacion')?.textContent || '';
        const estado = fila.querySelector('.estado-select')?.value || 'PENDIENTE';
        const evaluado = fila.dataset.evaluado === 'true';
        const subsanado = fila.dataset.subsanado === 'true';
        const fechaRevision = fila.querySelector('.fecha-revision')?.textContent || '';
        const comentario = fila.querySelector('.comentario-revision')?.value || '';
        
        datos.push({
            id: id,
            estado: estado,
            evaluado: evaluado,
            subsanado: subsanado,
            fechaRevision: fechaRevision,
            comentario: comentario
        });
    });
    
    try {
        localStorage.setItem('evaluacion_observaciones', JSON.stringify(datos));
    } catch (error) {
        console.error('Error al guardar:', error);
    }
}

// ============================================
// 6. RESTAURAR DATOS AL CARGAR LA PÁGINA
// ============================================

function restaurarEvaluacion() {
    try {
        const datosGuardados = localStorage.getItem('evaluacion_observaciones');
        if (!datosGuardados) return;
        
        const datos = JSON.parse(datosGuardados);
        const filas = document.querySelectorAll('#tabla-observaciones tbody tr');
        
        filas.forEach((fila, index) => {
            if (index < datos.length) {
                const dato = datos[index];
                
                // Restaurar estado
                const select = fila.querySelector('.estado-select');
                if (select && dato.estado) {
                    select.value = dato.estado;
                }
                
                // Restaurar dataset flags
                fila.dataset.evaluado = dato.evaluado ? 'true' : 'false';
                fila.dataset.subsanado = dato.subsanado ? 'true' : 'false';
                
                // Restaurar fecha
                const fechaCell = fila.querySelector('.fecha-revision');
                if (fechaCell && dato.fechaRevision) {
                    fechaCell.textContent = dato.fechaRevision;
                }
                
                // Restaurar comentario
                const comentario = fila.querySelector('.comentario-revision');
                if (comentario && dato.comentario) {
                    comentario.value = dato.comentario;
                }
                
                // Restaurar visualmente si está subsanado
                if (dato.subsanado) {
                    fila.style.backgroundColor = '#f0f8ff';
                    const btn = fila.querySelector('.btn-enviar-revision-fila');
                    if (btn) {
                        btn.disabled = true;
                        btn.textContent = '✓ Enviado';
                    }
                }
            }
        });
        
        actualizarContadores();
    } catch (error) {
        console.error('Error al restaurar:', error);
    }
}

// ============================================
// 7. INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Restaurar datos guardados
    restaurarEvaluacion();
    
    // Evento para cambios de estado (evaluador)
    document.querySelectorAll('.estado-select').forEach(select => {
        select.addEventListener('change', function() {
            cambiarEstado(this);
        });
    });
    
    // Evento para el botón "Enviar para revisión" (general)
    const btnEnviarGeneral = document.querySelector('.btn-enviar-revision-general');
    if (btnEnviarGeneral) {
        btnEnviarGeneral.addEventListener('click', enviarParaRevision);
    }
    
    // Evento para botones individuales de cada fila (si existen)
    document.querySelectorAll('.btn-enviar-revision-fila').forEach(btn => {
        btn.addEventListener('click', function() {
            const fila = this.closest('tr');
            if (fila.dataset.subsanado === 'true') {
                mostrarMensaje('Esta observación ya fue enviada', 'info');
                return;
            }
            
            fila.dataset.subsanado = 'true';
            fila.style.backgroundColor = '#f0f8ff';
            this.disabled = true;
            this.textContent = '✓ Enviado';
            
            guardarEvaluacionLocal();
            actualizarContadores();
            
            mostrarMensaje('Observación enviada para revisión', 'success');
        });
    });
    
    // Evento para checkboxes de revisado (si existen)
    document.querySelectorAll('.revisado-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            guardarEvaluacionLocal();
            actualizarContadores();
        });
    });
});

// ============================================
// 8. FUNCIÓN PARA ACTUALIZAR FECHA DE REVISIÓN
// ============================================

function actualizarFechaRevision(selectElement) {
    const fila = selectElement.closest('tr');
    const fechaCell = fila.querySelector('.fecha-revision');
    const estado = selectElement.value;
    
    const ahora = new Date();
    const fechaFormateada = ahora.getFullYear() + '-' + 
                           String(ahora.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(ahora.getDate()).padStart(2, '0') + ' ' + 
                           String(ahora.getHours()).padStart(2, '0') + ':' + 
                           String(ahora.getMinutes()).padStart(2, '0');
    
    // Guardar fecha SOLO si el evaluador puso CONFORME o SE REITERA OBSERVACIÓN
    if (estado === 'CONFORME' || estado === 'SE REITERA OBSERVACIÓN') {
        fechaCell.textContent = fechaFormateada;
        fechaCell.dataset.fecha = fechaFormateada;
    } else {
        fechaCell.textContent = '';
        fechaCell.dataset.fecha = '';
    }
    
    guardarEvaluacionLocal();
}

// ============================================
// 9. FUNCIÓN PARA MOSTRAR MENSAJES
// ============================================

function mostrarMensaje(texto, tipo = 'info') {
    let container = document.querySelector('.mensajes-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'mensajes-container';
        container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:9999;';
        document.body.appendChild(container);
    }
    
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje mensaje-${tipo}`;
    mensaje.style.cssText = `
        background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;
    mensaje.textContent = texto;
    
    container.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.style.opacity = '0';
        mensaje.style.transition = 'opacity 0.5s';
        setTimeout(() => mensaje.remove(), 500);
    }, 4000);
}

// Agregar animación CSS
const estiloAnimacion = document.createElement('style');
estiloAnimacion.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(estiloAnimacion);