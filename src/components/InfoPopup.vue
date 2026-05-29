<template>
  <div ref="popupRef" class="popup" v-show="visible">
    <div class="popup-close" @click="close">×</div>
    <div class="popup-title">{{ regionName }}</div>
    <div class="popup-row">
      <span class="label">Население:</span>
      <span class="value">{{ formattedPopulation }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import Overlay from 'ol/Overlay'

const map = inject('map')
const regionsLayer = inject('regionsLayer')

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
      visible.value = true
    } else {
      close()
    }
  }

  map.value.on('click', clickHandler)
}

function close() {
  visible.value = false
  if (overlay) overlay.setPosition(undefined)
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

.popup {
  position: relative;
  background: $color-bg;
  padding: $panel-padding;
  border-radius: $panel-radius;
  box-shadow: $panel-shadow;
  min-width: 200px;
  z-index: $z-popup;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid $color-bg;
  }
}

.popup-close {
  position: absolute;
  top: 6px;
  right: 10px;
  font-size: 20px;
  cursor: pointer;
  color: #888;
  line-height: 1;

  &:hover {
    color: #333;
  }
}

.popup-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-right: 20px;
}

.popup-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;

  .label {
    color: #666;
  }
  .value {
    font-weight: 500;
  }
}
</style>
