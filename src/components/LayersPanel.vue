<template>
  <div class="layers-panel">
    <div class="panel-title">Слои</div>

    <div
      v-for="layer in layers"
      :key="layer.id"
      class="layer-row"
      :class="{ 'is-hidden': !layer.visible }"
    >
      <div class="layer-header">
        <div class="eye-btn" @click="toggleLayer(layer)">
          <v-icon :icon="layer.visible ? 'mdi-eye' : 'mdi-eye-off'" size="small" />
        </div>
        <span class="layer-title">{{ layer.title }}</span>
        <span class="opacity-value">{{ Math.round(layer.opacity * 100) }}%</span>
      </div>

      <div class="custom-slider">
        <div class="slider-track" @click="onTrackClick($event, layer)">
          <div class="slider-fill" :style="{ width: layer.opacity * 100 + '%' }" />
          <div
            class="slider-thumb"
            :style="{ left: layer.opacity * 100 + '%' }"
            @mousedown="onThumbDragStart($event, layer)"
            @touchstart="onThumbDragStart($event, layer, true)"
          />
        </div>
        <input
          type="range"
          :min="0"
          :max="1"
          :step="0.05"
          :value="layer.opacity"
          @input="setLayerOpacity(layer, $event.target.valueAsNumber)"
          class="native-slider"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, inject, onBeforeUnmount } from 'vue'

const baseLayer = inject('baseLayer')
const regionsLayer = inject('regionsLayer')

const layers = ref([])
let draggedLayer = null

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

const toggleLayer = (layer) => {
  layer.visible = !layer.visible
  layer.instance.setVisible(layer.visible)
}

const setLayerOpacity = (layer, value) => {
  layer.opacity = value
  layer.instance.setOpacity(value)
}

const onTrackClick = (event, layer) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  const value = Math.round(ratio / 0.05) * 0.05
  setLayerOpacity(layer, Math.min(1, Math.max(0, value)))
}

const onThumbDragStart = (event, layer, isTouch = false) => {
  event.preventDefault()
  draggedLayer = layer

  const move = (e) => {
    if (!draggedLayer) return
    const track = document.querySelector('.custom-slider .slider-track')
    if (!track) return
    const rect = track.getBoundingClientRect()
    const clientX = isTouch ? e.touches[0].clientX : e.clientX
    const ratio = (clientX - rect.left) / rect.width
    const value = Math.round(ratio / 0.05) * 0.05
    setLayerOpacity(draggedLayer, Math.min(1, Math.max(0, value)))
  }

  const end = () => {
    draggedLayer = null
    document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', move)
    document.removeEventListener(isTouch ? 'touchend' : 'mouseup', end)
  }

  document.addEventListener(isTouch ? 'touchmove' : 'mousemove', move)
  document.addEventListener(isTouch ? 'touchend' : 'mouseup', end)
}

onBeforeUnmount(() => {
  draggedLayer = null
})
</script>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.layers-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 280px;
  background: $color-bg;
  backdrop-filter: $panel-blur;
  border: $panel-border;
  padding: $panel-padding;
  border-radius: $panel-radius;
  box-shadow: $panel-shadow;
  z-index: $z-panel;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin-bottom: 16px;
  color: $color-text;
}

.layer-row {
  padding: 12px 0;
  transition: opacity 0.3s;

  + .layer-row {
    border-top: 1px solid rgba(148, 163, 184, 0.2);
  }

  &.is-hidden {
    .layer-title,
    .opacity-value {
      opacity: 0.4;
    }
    .slider-fill {
      opacity: 0.3;
    }
    .slider-thumb {
      background: #94a3b8;
      transform: translate(-50%, -50%) scale(0.85);
    }
  }
}

.layer-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.eye-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    background: rgba(37, 99, 235, 0.06);
    color: $color-primary;
  }

  &:active {
    background: rgba(37, 99, 235, 0.12);
    transform: scale(0.95);
  }
}

.layer-title {
  font-size: 14px;
  font-weight: 500;
  color: $color-text;
  flex: 1;
}

.opacity-value {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 36px;
  text-align: right;
}

.custom-slider {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}

.native-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 2;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(148, 163, 184, 0.25);
  border-radius: 4px;
  cursor: pointer;
  z-index: 1;
  transition: background 0.2s;

  &:hover {
    background: rgba(148, 163, 184, 0.35);
  }
}

.slider-fill {
  height: 100%;
  background: $color-primary;
  border-radius: 4px;
  transition:
    width 0.1s,
    opacity 0.3s;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid $color-primary;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.15s,
    background 0.2s,
    box-shadow 0.2s;
  z-index: 3;

  &:hover {
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.05);
    background: #f0f7ff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}
</style>
