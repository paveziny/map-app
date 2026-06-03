<template>
  <div class="search-panel">
    <v-text-field
      v-model="query"
      placeholder="Поиск региона"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      prepend-inner-icon="mdi-magnify"
      class="search-input"
    />

    <div v-if="results.length" class="results-list">
      <div v-for="(item, idx) in results" :key="idx" class="result-item" @click="goToRegion(item)">
        <span class="result-name">{{ item.get('region') }}</span>
        <v-icon size="small" color="primary" class="result-icon">mdi-map-marker</v-icon>
      </div>
    </div>

    <div v-else-if="query && query.length > 0 && !results.length" class="no-results-wrapper">
      <span class="no-results">Ничего не найдено</span>
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

function doSearch(q) {
  if (!q || !q.trim() || !regionsSource.value) {
    results.value = []
    return
  }

  const lower = q.toLowerCase().trim()
  const features = regionsSource.value.getFeatures()

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

watch(query, (newQuery) => {
  doSearch(newQuery)
})

watch(regionsSource, (src) => {
  if (src && query.value) {
    doSearch(query.value)
  }
})

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
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  padding: $panel-padding; // 16px
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 1px 4px rgba(0, 0, 0, 0.02);
  z-index: $z-panel;
}

:deep(.search-input) {
  .v-input__control {
    margin: 0;
  }

  .v-field {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.7);
    box-shadow: none;
    transition: all 0.2s ease;
    color: #1e293b;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.15);
    }

    &.v-field--focused {
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      border-color: $color-primary;
    }
  }

  .v-icon {
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .v-field--focused .v-icon {
    opacity: 0.8;
  }
}

.results-list {
  margin-top: 16px;
  max-height: 320px;
  overflow-y: auto;

  padding: 4px 0;
  margin-left: -4px;
  margin-right: -4px;
  padding-left: 4px;
  padding-right: 4px;

  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &:hover {
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    margin: 8px 0;
  }

  &::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 10px;
    transition: background 0.3s ease;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.25);
  }
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 2px;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.15s ease;
  color: #334155;
  position: relative;

  &:hover {
    background: rgba(37, 99, 235, 0.06);

    .result-name {
      color: #1e293b;
    }

    .result-icon {
      opacity: 1;
      transform: translateX(2px);
    }
  }

  &:active {
    background: rgba(37, 99, 235, 0.12);
    transform: scale(0.995);
  }

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 12px;
    right: 12px;
    height: 1px;
    background: rgba(0, 0, 0, 0.04);
  }

  &:hover:not(:last-child)::after {
    background: transparent;
  }
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 12px;
  transition: color 0.15s ease;
}

.result-icon {
  opacity: 0.4;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.no-results-wrapper {
  margin-top: 16px;
  padding: 16px;
  background: rgba(241, 245, 249, 0.6);
  border-radius: 12px;
  text-align: center;
}

.no-results {
  font-size: 13px;
  color: #64748b;
  font-weight: 400;
}
</style>
