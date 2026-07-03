// ============================================
// 1. CONFIGURACIÓN DE FIREBASE
// ============================================

// Tu configuración de Firebase (la que ya tienes)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================
// 2. CARGAR TODAS LAS OBSERVACIONES DE FIREBASE
// ============================================

async function cargarTodasObservacionesFirebase() {
    try {
        mostrarLoading(true);
        
        // Obtener TODAS las observaciones de Firebase
        const snapshot = await db.collection('observaciones')
            .orderBy('fechaCreacion', 'desc') // Ordenar por fecha
            .get();
        
        if (snapshot.empty) {
            mostrarMensaje('No hay observaciones registradas', 'info');
            mostrarLoading(false);
            return;
        }
        
        const observaciones = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            observaciones.push({
                id: doc.id,
                ...data,
                // Asegurar campos necesarios
                estado: data.estado || 'PENDIENTE',
                evaluado: data.evaluado || false,
                subsanado: data.subsanado || false,
                fechaRevision: data.fechaRevision || '',
                comentario: data.comentario || ''
            });
        });
        
        console.log(`📊 Total de observaciones cargadas: ${observaciones.length}`);
        
        // Renderizar en la tabla
        renderizarObservaciones(observaciones);
        
        // Actualizar contadores
        actualizarContadores();
        
        // Guardar en localStorage para respaldo
        localStorage.setItem('observaciones_firebase', JSON.stringify(observaciones));
        
        mostrarMensaje(`✅ ${observaciones.length} observaciones cargadas correctamente`, 'success');
        mostrarLoading(false);
        
    } catch (error) {
        console.error('❌ Error al cargar de Firebase:', error);
        mostrarMensaje('Error al cargar las observaciones: ' + error.message, 'error');
        mostrarLoading(false);
        
        // Intentar cargar desde localStorage como respaldo
        cargarDesdeLocalStorage();
    }
}

// ============================================
// 3. RENDERIZAR OBSERVACIONES EN LA TABLA
// ============================================

function renderizarObservaciones(observaciones) {
    const tbody = document.querySelector('#tabla-observaciones tbody');
    if (!tbody) {
        console.error('❌ No se encontró el tbody de la tabla');
        return;
    }
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Crear filas para cada observación
    observaciones.forEach((obs, index) => {
        const tr = document.createElement('tr');
        tr.dataset.id = obs.id;
        tr.dataset.index = index;
        tr.dataset.evaluado = obs.evaluado ? 'true' : 'false';
        tr.dataset.subsanado = obs.subsanado ? 'true' : 'false';
        
        // Si está subsanado, cambiar estilo
        if (obs.subsanado) {
            tr.style.backgroundColor = '#f0f8ff';
        }
        
        tr.innerHTML = `
            <td class="id-observacion">${obs.id}</td>
            <td>${obs.descripcion || obs.texto || 'Sin descripción'}</td>
            <td>
                <select class="estado-select" data-id="${obs.id}">
                    <option value="PENDIENTE" ${obs.estado === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
                    <option value="CONFORME" ${obs.estado === 'CONFORME' ? 'selected' : ''}>CONFORME</option>
                    <option value="SE REITERA OBSERVACIÓN" ${obs.estado === 'SE REITERA OBSERVACIÓN' ? 'selected' : ''}>SE REITERA OBSERVACIÓN</option>
                    <option value="OBSERVADO" ${obs.estado === 'OBSERVADO' ? 'selected' : ''}>OBSERVADO</option>
                </select>
            </td>
            <td class="fecha-revision">${obs.fechaRevision || ''}</td>
            <td>
                <input type="text" class="comentario-revision" placeholder="Comentario" value="${obs.comentario || ''}">
            </td>
            <td>
                <button class="btn-enviar-revision-fila" 
                        data-id="${obs.id}"
                        ${obs.subsanado ? 'disabled' : ''}>
                    ${obs.subsanado ? '✓ Enviado' : 'Enviar'}
                </button>
            </td>
            <td>
                <input type="checkbox" class="revisado-checkbox" 
                       ${obs.revisado ? 'checked' : ''}>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Asignar eventos a los nuevos elementos
    asignarEventos();
}

// ============================================
// 4. ASIGNAR EVENTOS A LOS ELEMENTOS
// ============================================

function asignarEventos() {
    // Evento para cambios de estado
    document.querySelectorAll('.estado-select').forEach(select => {
        select.removeEventListener('change', handleEstadoChange);
        select.addEventListener('change', handleEstadoChange);
    });
    
    // Evento para botones "Enviar para revisión"
    document.querySelectorAll('.btn-enviar-revision-fila').forEach(btn => {
        btn.removeEventListener('click', handleEnviarRevision);
        btn.addEventListener('click', handleEnviarRevision);
    });
    
    // Evento para checkboxes de revisado
    document.querySelectorAll('.revisado-checkbox').forEach(checkbox => {
        checkbox.removeEventListener('change', handleRevisadoChange);
        checkbox.addEventListener('change', handleRevisadoChange);
    });
}

// ============================================
// 5. MANEJADORES DE EVENTOS
// ============================================

async function handleEstadoChange(event) {
    const select = event.target;
    const fila = select.closest('tr');
    const id = select.dataset.id || fila.dataset.id;
    const estado = select.value;
    
    // Actualizar fecha de revisión
    const fechaCell = fila.querySelector('.fecha-revision');
    if (estado === 'CONFORME' || estado === 'SE REITERA OBSERVACIÓN') {
        const ahora = new Date();
        const fechaFormateada = ahora.getFullYear() + '-' + 
                               String(ahora.getMonth() + 1).padStart(2, '0') + '-' + 
                               String(ahora.getDate()).padStart(2, '0') + ' ' + 
                               String(ahora.getHours()).padStart(2, '0') + ':' + 
                               String(ahora.getMinutes()).padStart(2, '0');
        fechaCell.textContent = fechaFormateada;
        fila.dataset.fecha = fechaFormateada;
    } else {
        fechaCell.textContent = '';
        fila.dataset.fecha = '';
    }
    
    // Marcar como evaluado
    if (estado === 'CONFORME' || estado === 'SE REITERA OBSERVACIÓN') {
        fila.dataset.evaluado = 'true';
    } else {
        fila.dataset.evaluado = 'false';
    }
    
    // Guardar en Firebase
    await guardarEnFirebase(id, {
        estado: estado,
        fechaRevision: fechaCell.textContent,
        evaluado: fila.dataset.evaluado === 'true'
    });
    
    // Actualizar contadores
    actualizarContadores();
}

async function handleEnviarRevision(event) {
    const btn = event.target;
    const fila = btn.closest('tr');
    const id = btn.dataset.id || fila.dataset.id;
    
    if (fila.dataset.subsanado === 'true') {
        mostrarMensaje('Esta observación ya fue enviada', 'info');
        return;
    }
    
    // Marcar como subsanado
    fila.dataset.subsanado = 'true';
    fila.style.backgroundColor = '#f0f8ff';
    btn.disabled = true;
    btn.textContent = '✓ Enviado';
    
    // Guardar en Firebase
    await guardarEnFirebase(id, {
        subsanado: true,
        fechaEnvio: new Date().toISOString()
    });
    
    // Actualizar contadores
    actualizarContadores();
    
    mostrarMensaje('✅ Observación enviada para revisión', 'success');
}

async function handleRevisadoChange(event) {
    const checkbox = event.target;
    const fila = checkbox.closest('tr');
    const id = fila.dataset.id;
    const revisado = checkbox.checked;
    
    await guardarEnFirebase(id, { revisado: revisado });
    actualizarContadores();
}

// ============================================
// 6. GUARDAR EN FIREBASE
// ============================================

async function guardarEnFirebase(id, datos) {
    try {
        await db.collection('observaciones').doc(id).update(datos);
        console.log(`✅ Actualizado documento ${id}:`, datos);
    } catch (error) {
        console.error('❌ Error al guardar en Firebase:', error);
        mostrarMensaje('Error al guardar cambios', 'error');
    }
}

// ============================================
// 7. BOTÓN "ENVIAR TODAS PARA REVISIÓN"
// ============================================

async function enviarTodasParaRevision() {
    const filas = document.querySelectorAll('#tabla-observaciones tbody tr:not([data-subsanado="true"])');
    
    if (filas.length === 0) {
        mostrarMensaje('Todas las observaciones ya han sido enviadas', 'info');
        return;
    }
    
    const confirmar = confirm(`¿Enviar ${filas.length} observaciones para revisión?`);
    if (!confirmar) return;
    
    try {
        const batch = db.batch();
        const promesas = [];
        
        filas.forEach(fila => {
            const id = fila.dataset.id;
            fila.dataset.subsanado = 'true';
            fila.style.backgroundColor = '#f0f8ff';
            const btn = fila.querySelector('.btn-enviar-revision-fila');
            if (btn) {
                btn.disabled = true;
                btn.textContent = '✓ Enviado';
            }
            
            // Guardar en Firebase
            promesas.push(
                db.collection('observaciones').doc(id).update({
                    subsanado: true,
                    fechaEnvio: new Date().toISOString()
                })
            );
        });
        
        await Promise.all(promesas);
        
        actualizarContadores();
        mostrarMensaje(`✅ ${filas.length} observaciones enviadas para revisión`, 'success');
        
    } catch (error) {
        console.error('❌ Error al enviar:', error);
        mostrarMensaje('Error al enviar las observaciones', 'error');
    }
}

// ============================================
// 8. ACTUALIZAR CONTADORES
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
        const evaluado = fila.dataset.evaluado === 'true';
        const subsanado = fila.dataset.subsanado === 'true';
        
        // CONFORMES
        if (estado === 'CONFORME') {
            conformes++;
        }
        
        // EVALUADOS: CONFORME + SE REITERA OBSERVACIÓN
        if (estado === 'CONFORME' || estado === 'SE REITERA OBSERVACIÓN') {
            evaluados++;
        }
        
        // SUBSANADOS
        if (subsanado) {
            subsanados++;
        }
        
        // PENDIENTES
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
// 9. LOADING Y MENSAJES
// ============================================

function mostrarLoading(mostrar) {
    const loader = document.getElementById('loader') || document.querySelector('.loading');
    if (loader) {
        loader.style.display = mostrar ? 'flex' : 'none';
    }
}

function mostrarMensaje(texto, tipo = 'info') {
    // ... (tu código de mensajes)
}

// ============================================
// 10. RESPALDO LOCAL
// ============================================

function cargarDesdeLocalStorage() {
    try {
        const datos = localStorage.getItem('observaciones_firebase');
        if (datos) {
            const observaciones = JSON.parse(datos);
            renderizarObservaciones(observaciones);
            actualizarContadores();
            mostrarMensaje('📂 Cargado desde respaldo local', 'info');
        }
    } catch (error) {
        console.error('Error al cargar respaldo:', error);
    }
}

// ============================================
// 11. INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar todas las observaciones de Firebase
    cargarTodasObservacionesFirebase();
    
    // Evento para el botón "Enviar todas para revisión"
    const btnEnviarTodas = document.querySelector('.btn-enviar-revision-general');
    if (btnEnviarTodas) {
        btnEnviarTodas.addEventListener('click', enviarTodasParaRevision);
    }
    
    // Actualizar contadores cada 5 segundos (opcional)
    setInterval(actualizarContadores, 5000);
});