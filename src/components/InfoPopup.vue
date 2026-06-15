<template>
  <div ref="popupRef" class="popup-wrapper" :class="{ 'popup-visible': visible }">
    <div class="popup">
      <div class="popup-bg" />
      <div class="popup-content">
        <div class="popup-close" @click="closePopup">
          <v-icon size="16">mdi-close</v-icon>
        </div>
        <div class="popup-title">{{ regionName }}</div>
        <div class="popup-divider" />
        <div class="popup-row">
          <span class="label">Население</span>
          <span class="value">{{ formattedPopulation }}</span>
        </div>
      </div>
    </div>
    <div class="popup-arrow" />
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

const formattedPopulation = computed(() =>
  population.value == null ? '—' : population.value.toLocaleString('ru-RU'),
)

onMounted(() => {
  const ready = setInterval(() => {
    if (map.value && regionsLayer.value && popupRef.value) {
      clearInterval(ready)
      setupOverlay()
    }
  }, 100)
})

function setupOverlay() {
  overlay = new Overlay({
    element: popupRef.value,
    positioning: 'bottom-center',
    offset: [0, -10],
    stopEvent: true,
  })
  map.value.addOverlay(overlay)

  map.value.on('click', (event) => {
    let feature = null
    map.value.forEachFeatureAtPixel(event.pixel, (f, layer) => {
      if (layer === regionsLayer.value && !feature) feature = f
    })

    feature ? showPopup(feature, event.coordinate) : closePopup()
  })
}

function showPopup(feature, coordinate) {
  hidePopupInternal()

  regionName.value = feature.get('region') || 'Без названия'
  population.value = Number(feature.get('population')) || null

  highlightFeature?.(feature)
  overlay.setPosition(coordinate)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      visible.value = true
    })
  })
}

function hidePopupInternal() {
  visible.value = false
  overlay?.setPosition(undefined)
}

function closePopup() {
  hidePopupInternal()
  clearHighlight?.()
}

const openForFeature = (feature, coordinate) => showPopup(feature, coordinate)
const close = () => closePopup()

defineExpose({ openForFeature, close })

onBeforeUnmount(() => {
  map.value?.removeOverlay(overlay)
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
  backdrop-filter: $panel-blur;
  border: $panel-border;
  border-radius: $panel-radius;
  z-index: 0;
}

.popup-content {
  position: relative;
  z-index: 1;
  padding: $panel-padding;
}

.popup-arrow {
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
  transition: all 0.2s;
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
