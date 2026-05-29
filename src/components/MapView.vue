<template>
  <div class="map-wrapper">
    <!-- Контейнер карты -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- Дочерние компоненты — inject найдёт provide отсюда -->
    <SearchPanel />
    <LayersPanel />
    <InfoPopup />

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Сообщение об ошибке -->
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

import SearchPanel from '@/components/SearchPanel.vue'
import LayersPanel from '@/components/LayersPanel.vue'
import InfoPopup from '@/components/InfoPopup.vue'

// --- refs для карты и слоёв ---
const mapContainer = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const mapRef = ref(null)
const baseLayerRef = ref(null)
const regionsLayerRef = ref(null)
const regionsSourceRef = ref(null)

// --- provide вызываем ДО onMounted ---
// Дочерние компоненты проходят setup() раньше onMounted родителя.
// Поэтому provide должен быть здесь — тогда inject в детях найдёт ключи.
// Внутри ref пока null, но когда onMounted запишет .value — дети увидят изменение.
provide('map', mapRef)
provide('baseLayer', baseLayerRef)
provide('regionsLayer', regionsLayerRef)
provide('regionsSource', regionsSourceRef)

// Простые переменные (не ref) — используются только в функции стиля OL
let minValue = 0
let maxValue = 15000000

// --- Функция стиля для регионов ---
function regionStyleFunction(feature, resolution) {
  const props = feature.getProperties()
  const value = Number(props.population) || 0
  const fillColor = getColorByValue(value, minValue, maxValue)
  const name = props.region || ''

  return new Style({
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: '#555', width: 1 }),
    text: new Text({
      // Подпись только при достаточном приближении
      text: resolution < 5000 ? name : '',
      font: '12px Roboto, sans-serif',
      fill: new Fill({ color: '#111' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
      overflow: true,
    }),
  })
}

// URL спутниковых тайлов Google.
// OL-плейсхолдеры: {x}{y}{z} — координаты тайла, {0-3} — субдомены mt0..mt3
const googleSatelliteUrl =
  'https://mt{0-3}.google.com/vt/lyrs=s&hl=ru&gl=ru&x={x}&y={y}&z={z}&s=Galileo'

onMounted(async () => {
  // 1. Базовый слой — спутник Google
  const googleLayer = new TileLayer({
    source: new XYZ({
      url: googleSatelliteUrl,
      attributions: '© Google Maps',
    }),
    properties: { title: 'Google Satellite', baseLayer: true },
  })

  // 2. Векторный слой регионов
  const regionsSource = new VectorSource()
  const regionsLayer = new VectorLayer({
    source: regionsSource,
    style: regionStyleFunction,
    properties: { title: 'Регионы РФ' },
  })

  // 3. Карта
  const map = new Map({
    target: mapContainer.value,
    layers: [googleLayer, regionsLayer],
    view: new View({
      center: fromLonLat([90, 65]), // центр РФ
      zoom: 3,
    }),
    controls: defaultControls({ zoom: false }), // убираем кнопки +/-
  })

  // 4. Записываем в ref — дочерние компоненты увидят изменение через inject
  mapRef.value = map
  baseLayerRef.value = googleLayer
  regionsLayerRef.value = regionsLayer
  regionsSourceRef.value = regionsSource

  // 5. Загружаем GeoJSON
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

    // Читаем сначала как текст — чтобы поймать HTML-заглушку вместо JSON
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
      dataProjection: 'EPSG:4326', // в файле — градусы (lon/lat)
      featureProjection: 'EPSG:3857', // OL рисует в метрах Web Mercator
    })

    // Считаем реальные min/max по population для точной цветовой шкалы
    const populations = features
      .map((f) => Number(f.get('population')))
      .filter((v) => !Number.isNaN(v) && v > 0)

    if (populations.length) {
      minValue = Math.min(...populations)
      maxValue = Math.max(...populations)
    }

    source.addFeatures(features)

    console.log(`[MapView] Загружено регионов: ${features.length}`)
    console.log(`[MapView] population min: ${minValue}, max: ${maxValue}`)
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
