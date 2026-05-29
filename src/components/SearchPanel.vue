<template>
  <div class="search-panel">
    <v-text-field
      v-model="query"
      label="Поиск региона"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      prepend-inner-icon="mdi-magnify"
    />

    <!-- Список результатов -->
    <div v-if="results.length" class="results-list">
      <div v-for="(item, idx) in results" :key="idx" class="result-item" @click="goToRegion(item)">
        <span class="result-name">{{ item.get('region') }}</span>
        <v-icon size="small" color="primary">mdi-map-marker</v-icon>
      </div>
    </div>

    <!-- Ничего не найдено -->
    <div v-else-if="query && query.length > 0 && !results.length" class="no-results">
      Ничего не найдено
    </div>
  </div>
</template>

<script setup>
import { ref, watch, inject } from 'vue'
import { Style, Fill, Stroke, Text } from 'ol/style'

const map = inject('map')
const regionsSource = inject('regionsSource')

const query = ref('')
const results = ref([])
let highlightedFeature = null

// --- Функция поиска ---
// Вынесена отдельно, чтобы вызывать из двух watch
function doSearch(q) {
  // Если строка пустая или source ещё не готов — сбрасываем
  if (!q || !q.trim() || !regionsSource.value) {
    results.value = []
    return
  }

  const lower = q.toLowerCase().trim()
  const features = regionsSource.value.getFeatures()

  // Диагностический лог — убери после проверки
  console.log('[Search] всего фич в source:', features.length)
  if (features.length > 0) {
    console.log('[Search] props первой фичи:', features[0].getProperties())
  }

  results.value = features
    .filter((f) => {
      const name = (f.get('region') || '').toLowerCase()
      return name.includes(lower)
    })
    .slice(0, 20)

  console.log('[Search] найдено:', results.value.length)
}

// Реагируем на изменение строки поиска
watch(query, (newQuery) => {
  doSearch(newQuery)
})

// Реагируем на появление source:
// GeoJSON грузится асинхронно — если юзер ввёл запрос ДО загрузки,
// этот watch повторит поиск как только фичи появятся
watch(regionsSource, (src) => {
  if (src && query.value) {
    doSearch(query.value)
  }
})

// --- Переход к региону ---
function goToRegion(feature) {
  if (!map.value || !feature) return

  clearHighlight()
  highlightFeature(feature)

  const geometry = feature.getGeometry()
  if (geometry) {
    map.value.getView().fit(geometry.getExtent(), {
      padding: [80, 80, 80, 80],
      duration: 600,
      maxZoom: 8,
    })
  }
}

// --- Подсветка региона ---
function highlightFeature(feature) {
  const name = feature.get('region') || ''

  feature.setStyle(
    new Style({
      fill: new Fill({ color: 'rgba(255, 235, 59, 0.5)' }),
      stroke: new Stroke({ color: '#ff6f00', width: 3 }),
      text: new Text({
        text: name,
        font: 'bold 14px Roboto, sans-serif',
        fill: new Fill({ color: '#111' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
        overflow: true,
      }),
    }),
  )

  highlightedFeature = feature
}

// --- Сброс подсветки ---
// setStyle(undefined) возвращает фиче стиль слоя (без надобности хранить оригинал)
function clearHighlight() {
  if (highlightedFeature) {
    highlightedFeature.setStyle(undefined)
    highlightedFeature = null
  }
}
</script>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.search-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 320px;
  background: $color-bg;
  padding: $panel-padding;
  border-radius: $panel-radius;
  box-shadow: $panel-shadow;
  z-index: $z-panel;
}

.results-list {
  margin-top: 12px;
  max-height: 320px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;

  &:hover {
    background: rgba(25, 118, 210, 0.08);
  }
}

.result-name {
  font-size: 14px;
}

.no-results {
  margin-top: 12px;
  font-size: 13px;
  color: #888;
  padding: 8px 12px;
}
</style>
