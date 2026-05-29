<template>
  <div ref="mapContainer" class="map-container"></div>

  <!-- Индикатор загрузки -->
  <div v-if="isLoading" class="loading-overlay">
    <v-progress-circular indeterminate color="primary" size="48" />
  </div>

  <!-- Ошибка -->
  <div v-if="errorMessage" class="error-message">
    {{ errorMessage }}
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, provide } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import XYZ from 'ol/source/XYZ'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Fill, Stroke, Text } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { getColorByValue } from '@/utils/colorScale'

const mapContainer = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const mapRef = ref(null)
const regionsLayerRef = ref(null)
const baseLayerRef = ref(null)
const regionsSourceRef = ref(null)

let minValue = 0
let maxValue = 15000000

function regionStyleFunction(feature, resolution) {
  const props = feature.getProperties()
  const value = Number(props.population) || 0
  const fillColor = getColorByValue(value, minValue, maxValue)
  const name = props.region || ''

  return new Style({
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: '#555', width: 1 }),
    text: new Text({
      text: resolution < 5000 ? name : '',
      font: '12px Roboto, sans-serif',
      fill: new Fill({ color: '#111' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
      overflow: true,
    }),
  })
}

function googleSubdomainUrl() {
  return 'https://mt{0-3}.google.com/vt/lyrs=s&hl=ru&gl=ru&x={x}&y={y}&z={z}&s=Galileo'
}

onMounted(async () => {
  const googleLayer = new TileLayer({
    source: new XYZ({
      url: googleSubdomainUrl(),
      attributions: '© Google Maps',
    }),
    properties: { title: 'Google Satellite', baseLayer: true },
  })

  const regionsSource = new VectorSource()
  const regionsLayer = new VectorLayer({
    source: regionsSource,
    style: regionStyleFunction,
    properties: { title: 'Регионы РФ' },
  })

  const map = new Map({
    target: mapContainer.value,
    layers: [googleLayer, regionsLayer],
    view: new View({
      center: fromLonLat([90, 65]),
      zoom: 3,
    }),
  })

  mapRef.value = map
  baseLayerRef.value = googleLayer
  regionsLayerRef.value = regionsLayer
  regionsSourceRef.value = regionsSource

  await loadRegions(regionsSource)
})

async function loadRegions(source) {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await fetch('/data/regions.geojson')
    if (!response.ok) {
      throw new Error(`Ошибка загрузки регионов: ${response.status}`)
    }
    const data = await response.json()

    const features = new GeoJSON().readFeatures(data, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    })

    const populations = features
      .map((f) => Number(f.get('population')))
      .filter((v) => !Number.isNaN(v))

    if (populations.length) {
      minValue = Math.min(...populations)
      maxValue = Math.max(...populations)
    }

    source.addFeatures(features)
  } catch (err) {
    errorMessage.value = err.message
    console.error('[MapView] loadRegions error:', err)
  } finally {
    isLoading.value = false
  }
}
onBeforeUnmount(() => {
  if (mapRef.value) {
    mapRef.value.setTarget(null)
    mapRef.value = null
  }
})

provide('map', mapRef)
provide('baseLayer', baseLayerRef)
provide('regionsLayer', regionsLayerRef)
provide('regionsSource', regionsSourceRef)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.map-container {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: $z-popup;
  background: rgba(255, 255, 255, 0.85);
  padding: $panel-padding;
  border-radius: $panel-radius;
  box-shadow: $panel-shadow;
}

.error-message {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffebee;
  color: #c62828;
  padding: $panel-padding;
  border-radius: $panel-radius;
  box-shadow: $panel-shadow;
  z-index: $z-popup;
}
</style>
