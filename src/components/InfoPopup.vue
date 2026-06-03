<template>
  <div ref="popupRef" class="popup-wrapper" :class="{ 'popup-visible': visible }">
    <div class="popup">
      <div class="popup-bg"></div>

      <div class="popup-content">
        <div class="popup-close" @click="close">
          <v-icon size="16">mdi-close</v-icon>
        </div>

        <div class="popup-title">{{ regionName }}</div>

        <div class="popup-divider"></div>

        <div class="popup-row">
          <span class="label">Население</span>
          <span class="value">{{ formattedPopulation }}</span>
        </div>
      </div>
    </div>

    <div class="popup-arrow"></div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import Overlay from 'ol/Overlay'

const map = inject('map')
const regionsLayer = inject('regionsLayer')
const highlightFeature = inject('highlightFeature')
const clearHighlight = inject('clearHighlight')

const popupRef = ref(null)
const visible = ref(false)
const regionName = ref('')
const population = ref(null)

let overlay = null
let clickHandler = null

const formattedPopulation = computed(() => {
  if (population.value == null) return '—'
  return population.value.toLocaleString('ru-RU')
})

onMounted(() => {
  const checkMap = setInterval(() => {
    if (map.value && regionsLayer.value && popupRef.value) {
      clearInterval(checkMap)
      initPopup()
    }
  }, 100)
})

function initPopup() {
  overlay = new Overlay({
    element: popupRef.value,
    positioning: 'bottom-center',
    offset: [0, -10],
    stopEvent: true,
  })
  map.value.addOverlay(overlay)

  clickHandler = (event) => {
    let foundFeature = null

    map.value.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
      if (layer === regionsLayer.value && !foundFeature) {
        foundFeature = feature
      }
    })

    if (foundFeature) {
      regionName.value = foundFeature.get('region') || 'Без названия'
      population.value = Number(foundFeature.get('population')) || null
      overlay.setPosition(event.coordinate)

      if (clearHighlight) clearHighlight()
      if (highlightFeature) highlightFeature(foundFeature)

      visible.value = false
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          visible.value = true
        })
      })
    } else {
      close()
    }
  }

  map.value.on('click', clickHandler)
}

function close() {
  visible.value = false

  if (clearHighlight) clearHighlight()

  setTimeout(() => {
    if (overlay && !visible.value) {
      overlay.setPosition(undefined)
    }
  }, 200)
}

onBeforeUnmount(() => {
  if (map.value && clickHandler) {
    map.value.un('click', clickHandler)
  }
  if (map.value && overlay) {
    map.value.removeOverlay(overlay)
  }
})
</script>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.popup-wrapper {
  position: relative;
  z-index: $z-popup;
  opacity: 0;
  transform: translateY(8px) scale(0.95);
  transition:
    opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 8px 24px rgba(15, 23, 42, 0.12))
    drop-shadow(0 2px 8px rgba(15, 23, 42, 0.06));

  &.popup-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  &:not(.popup-visible) {
    transition:
      opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.popup {
  position: relative;
  border-radius: $panel-radius;
  min-width: 220px;
  max-width: 320px;
  overflow: hidden;
}

.popup-bg {
  position: absolute;
  inset: 0;
  background: $color-bg;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: $panel-radius;
  z-index: 0;
}

.popup-content {
  position: relative;
  z-index: 1;
  padding: $panel-padding;
}

.popup-arrow {
  position: relative;
  width: 0;
  height: 0;
  margin: 0 auto;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid $color-bg;
}

.popup-close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  border-radius: 8px;
  transition: all 0.2s ease;
  z-index: 2;

  &:hover {
    color: #475569;
    background: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(0.9);
  }
}

.popup-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 12px;
  padding-right: 32px;
  color: $color-text;
  word-break: break-word;
}

.popup-divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.25);
  margin-bottom: 12px;
}

.popup-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;

  .label {
    font-size: 13px;
    color: #64748b;
    flex-shrink: 0;
    font-weight: 400;
  }

  .value {
    font-size: 18px;
    font-weight: 700;
    color: $color-text;
    text-align: right;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.3px;
  }
}
</style>
