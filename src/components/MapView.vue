<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>

    <SearchPanel />
    <LayersPanel />
    <InfoPopup ref="infoPopupRef" />

    <div v-if="isLoading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
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
import { defaults as defaultControls } from 'ol/control'
import { getColorByValue } from '@/utils/colorScale'
import { useHighlight } from '@/composables/useHighlight'

import SearchPanel from '@/components/SearchPanel.vue'
import LayersPanel from '@/components/LayersPanel.vue'
import InfoPopup from '@/components/InfoPopup.vue'

const mapContainer = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const mapRef = ref(null)
const baseLayerRef = ref(null)
const regionsLayerRef = ref(null)
const regionsSourceRef = ref(null)
const infoPopupRef = ref(null)

provide('map', mapRef)
provide('baseLayer', baseLayerRef)
provide('regionsLayer', regionsLayerRef)
provide('regionsSource', regionsSourceRef)

const highlight = useHighlight(mapRef, regionsLayerRef)
provide('highlightFeature', highlight.highlightFeature)
provide('clearHighlight', highlight.clearHighlight)
provide('infoPopupRef', infoPopupRef)

let minValue = 0
let maxValue = 15000000

function regionStyleFunction(feature, resolution) {
  const props = feature.getProperties()
  const value = Number(props.population) || 0
  const fillColor = getColorByValue(value, minValue, maxValue)
  const name = props.region || ''
  const hideText = props._hideText || false
  const hideFill = props._hideFill || false

  const baseStyle = new Style({
    fill: hideFill ? new Fill({ color: 'rgba(255, 255, 255, 0)' }) : new Fill({ color: fillColor }),
    stroke: hideFill
      ? new Stroke({ color: 'transparent', width: 0 })
      : new Stroke({ color: '#555', width: 1 }),
  })

  if (resolution > 5000) {
    return baseStyle
  }

  const geometry = feature.getGeometry()
  if (!geometry) return baseStyle

  const geometryType = geometry.getType()

  const textStyle = new Text({
    text: hideText ? '' : name,
    font: '500 13px Inter, Roboto, sans-serif',
    fill: new Fill({ color: '#ffffff' }),
    stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.5)', width: 2 }),
    overflow: true,
  })

  if (geometryType === 'Polygon') {
    return new Style({
      fill: hideFill
        ? new Fill({ color: 'rgba(255, 255, 255, 0)' })
        : new Fill({ color: fillColor }),
      stroke: hideFill
        ? new Stroke({ color: 'transparent', width: 0 })
        : new Stroke({ color: '#555', width: 1 }),
      text: textStyle,
    })
  }

  if (geometryType === 'MultiPolygon') {
    const polygons = geometry.getPolygons()
    let largestPolygon = null
    let largestArea = 0

    polygons.forEach((polygon) => {
      const area = polygon.getArea()
      if (area > largestArea) {
        largestArea = area
        largestPolygon = polygon
      }
    })

    if (!largestPolygon) return baseStyle

    return [
      baseStyle,
      new Style({
        geometry: largestPolygon.getInteriorPoint(),
        text: textStyle,
      }),
    ]
  }

  return baseStyle
}

const googleSatelliteUrl =
  'https://mt{0-3}.google.com/vt/lyrs=s&hl=ru&gl=ru&x={x}&y={y}&z={z}&s=Galileo'

onMounted(async () => {
  const googleLayer = new TileLayer({
    source: new XYZ({
      url: googleSatelliteUrl,
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
    controls: defaultControls({ zoom: false }),
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
      throw new Error(`Файл не найден: ${response.status}`)
    }

    const text = await response.text()
    if (text.trimStart().startsWith('<')) {
      throw new Error('Сервер вернул HTML вместо JSON — проверь путь к файлу в public/data/')
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      throw new Error('Файл повреждён - не получилось разобрать как JSON', { cause: e })
    }

    const features = new GeoJSON().readFeatures(data, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    })

    const populations = features
      .map((f) => Number(f.get('population')))
      .filter((v) => !Number.isNaN(v) && v > 0)

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
</script>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

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
