<template>
  <div id="app">
    <h1>📋 Gestión de Observaciones</h1>

    <div v-for="obs in observaciones" :key="obs.id" class="observacion">
      <h3>Observación #{{ obs.id }}</h3>
      <p><strong>Descripción:</strong> {{ obs.descripcion }}</p>
      <p>
        <strong>Estado actual:</strong>
        <span :class="['estado', obs.estado.toLowerCase().replace(' ', '-')]">
          {{ obs.estado }}
        </span>
      </p>
      <button class="btn-cambiar" @click="abrirModal(obs.id)">🔄 Cambiar Veredicto</button>
    </div>

    <!-- Modal -->
    <div v-if="modalVisible" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <h2>¿Cambiar veredicto?</h2>
        <p v-html="mensajeModal"></p>
        <div class="modal-buttons">
          <button class="btn-cancelar" @click="cerrarModal">No, cancelar</button>
          <button class="btn-confirmar" @click="confirmarCambio">Sí, confirmar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  setup() {
    const observaciones = ref([
      { id: 1, descripcion: 'Las tuberías irán enterradas o dentro del falso piso', estado: 'CONFORME' }
    ]);

    const modalVisible = ref(false);
    const idActual = ref(null);
    const nuevoEstado = ref('');

    const estados = ['CONFORME', 'NO CONFORME', 'SUBSANADO'];

    const obtenerSiguienteEstado = (estadoActual) => {
      const index = estados.indexOf(estadoActual);
      return estados[(index + 1) % estados.length];
    };

    const abrirModal = (id) => {
      const obs = observaciones.value.find(o => o.id === id);
      idActual.value = id;
      nuevoEstado.value = obtenerSiguienteEstado(obs.estado);
      modalVisible.value = true;
    };

    const cerrarModal = () => {
      modalVisible.value = false;
      idActual.value = null;
      nuevoEstado.value = '';
    };

    const confirmarCambio = () => {
      const obs = observaciones.value.find(o => o.id === idActual.value);
      if (obs) {
        obs.estado = nuevoEstado.value;
        alert(`✅ Veredicto actualizado a "${nuevoEstado.value}" correctamente.`);
      }
      cerrarModal();
    };

    const mensajeModal = computed(() => {
      const obs = observaciones.value.find(o => o.id === idActual.value);
      if (!obs) return '';
      return `
        La observación actualmente está como <strong>"${obs.estado}"</strong>.
        ¿Deseas cambiarla a <strong>"${nuevoEstado.value}"</strong>?
      `;
    });

    return {
      observaciones,
      modalVisible,
      abrirModal,
      cerrarModal,
      confirmarCambio,
      mensajeModal
    };
  }
};
</script>

<style scoped>
#app { max-width: 800px; margin: 40px auto; padding: 20px; font-family: Arial; }
.observacion { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
.estado { font-weight: bold; padding: 4px 12px; border-radius: 20px; display: inline-block; }
.conforme { background: #4CAF50; color: white; }
.no-conforme { background: #f44336; color: white; }
.subsanado { background: #FF9800; color: white; }
.btn-cambiar { background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
.modal-content { background: white; padding: 30px; border-radius: 10px; max-width: 500px; }
.modal-buttons { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-confirmar { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
.btn-cancelar { background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
</style>