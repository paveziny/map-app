<template>
  <div class="layers-panel">
    <div class="panel-title">Слои</div>

    <div v-for="layer in layers" :key="layer.id" class="layer-row">
      <div class="layer-header">
        <v-icon
          :icon="layer.visible ? 'mdi-eye' : 'mdi-eye-off'"
          size="small"
          class="visibility-toggle"
          @click="toggleVisibility(layer)"
        />
        <span class="layer-title">{{ layer.title }}</span>
      </div>

      <v-slider
        v-model="layer.opacity"
        :min="0"
        :max="1"
        :step="0.05"
        hide-details
        density="compact"
        color="primary"
        @update:model-value="updateOpacity(layer, $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, inject } from 'vue'

const baseLayer = inject('baseLayer')
const regionsLayer = inject('regionsLayer')

const layers = ref([])

// Ждём пока слои появятся (они создаются в onMounted MapView)
watch(
  [baseLayer, regionsLayer],
  ([base, regions]) => {
    if (base && regions && layers.value.length === 0) {
      layers.value = [
        {
          id: 'base',
          title: 'Google Satellite',
          visible: base.getVisible(),
          opacity: base.getOpacity(),
          instance: base,
        },
        {
          id: 'regions',
          title: 'Регионы РФ',
          visible: regions.getVisible(),
          opacity: regions.getOpacity(),
          instance: regions,
        },
      ]
    }
  },
  { immediate: true },
)

function toggleVisibility(layer) {
  layer.visible = !layer.visible
  layer.instance.setVisible(layer.visible)
}

function updateOpacity(layer, value) {
  layer.instance.setOpacity(value)
}
</script>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.layers-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 280px;
  background: $color-bg;
  padding: $panel-padding;
  border-radius: $panel-radius;
  box-shadow: $panel-shadow;
  z-index: $z-panel;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.layer-row {
  padding: 8px 0;

  & + & {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

.layer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.visibility-toggle {
  cursor: pointer;
  color: #555;

  &:hover {
    color: $color-primary;
  }
}

.layer-title {
  font-size: 14px;
}
</style>
