<template>
  <div class="layers-panel">
    <div class="panel-title">Слои</div>

    <div
      v-for="layer in layers"
      :key="layer.id"
      class="layer-row"
      :class="{ 'layer-hidden': !layer.visible }"
    >
      <div class="layer-header">
        <div class="visibility-toggle-wrapper" @click="toggleVisibility(layer)">
          <v-icon
            :icon="layer.visible ? 'mdi-eye' : 'mdi-eye-off'"
            size="small"
            class="visibility-toggle"
          />
        </div>
        <span class="layer-title">{{ layer.title }}</span>
        <span class="opacity-value">{{ Math.round(layer.opacity * 100) }}%</span>
      </div>

      <div class="custom-slider">
        <div class="slider-track" @click="onTrackClick($event, layer)">
          <div class="slider-fill" :style="{ width: layer.opacity * 100 + '%' }"></div>
          <div
            class="slider-thumb"
            :style="{ left: layer.opacity * 100 + '%' }"
            @mousedown="onThumbMouseDown($event, layer)"
            @touchstart="onThumbTouchStart($event, layer)"
          ></div>
        </div>
        <input
          type="range"
          :min="0"
          :max="1"
          :step="0.05"
          :value="layer.opacity"
          @input="updateOpacity(layer, parseFloat($event.target.value))"
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

let activeLayer = null

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

  layer._animating = true
  setTimeout(() => {
    layer._animating = false
  }, 300)
}

function updateOpacity(layer, value) {
  layer.opacity = value
  layer.instance.setOpacity(value)
}

function onTrackClick(event, layer) {
  const track = event.currentTarget
  const rect = track.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  const value = Math.round(ratio / 0.05) * 0.05
  const clampedValue = Math.min(1, Math.max(0, value))
  updateOpacity(layer, clampedValue)
}

function onThumbMouseDown(event, layer) {
  event.preventDefault()
  activeLayer = layer

  const onMouseMove = (e) => {
    if (!activeLayer) return
    const track = document.querySelector(`.custom-slider .slider-track`)
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const value = Math.round(ratio / 0.05) * 0.05
    const clampedValue = Math.min(1, Math.max(0, value))
    updateOpacity(activeLayer, clampedValue)
  }

  const onMouseUp = () => {
    activeLayer = null
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onThumbTouchStart(event, layer) {
  event.preventDefault()
  activeLayer = layer

  const onTouchMove = (e) => {
    if (!activeLayer) return
    const track = document.querySelector(`.custom-slider .slider-track`)
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = (e.touches[0].clientX - rect.left) / rect.width
    const value = Math.round(ratio / 0.05) * 0.05
    const clampedValue = Math.min(1, Math.max(0, value))
    updateOpacity(activeLayer, clampedValue)
  }

  const onTouchEnd = () => {
    activeLayer = null
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
  }

  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onTouchEnd)
}

onBeforeUnmount(() => {
  activeLayer = null
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
  -webkit-backdrop-filter: $panel-blur;
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
  transition: opacity 0.3s ease;

  & + & {
    border-top: 1px solid rgba(148, 163, 184, 0.2);
  }

  &.layer-hidden {
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

.visibility-toggle-wrapper {
  flex-shrink: 0;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(37, 99, 235, 0.06);
  }

  &:active {
    background: rgba(37, 99, 235, 0.12);
    transform: scale(0.95);
  }
}

.visibility-toggle {
  color: #6b7280;
  transition:
    color 0.2s ease,
    transform 0.3s ease,
    opacity 0.3s ease;

  .layer-hidden & {
    color: #94a3b8;
    opacity: 0.5;
  }

  .visibility-toggle-wrapper:hover & {
    color: $color-primary;
  }
}

.layer-title {
  font-size: 14px;
  font-weight: 500;
  color: $color-text;
  flex: 1;
  transition: opacity 0.3s ease;
}

.opacity-value {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  transition: opacity 0.3s ease;
}

.custom-slider {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;

  .native-slider {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    margin: 0;
    z-index: 2;
  }
}

.slider-track {
  position: relative;
  width: 100%;
  height: 4px;
  background: rgba(148, 163, 184, 0.25);
  border-radius: 4px;
  cursor: pointer;
  z-index: 1;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(148, 163, 184, 0.35);
  }
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: $color-primary;
  border-radius: 4px;
  transition:
    width 0.1s ease,
    opacity 0.3s ease;
  pointer-events: none;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border: 2px solid $color-primary;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  pointer-events: auto;
  z-index: 3;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.15s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;

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
