<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat } from 'ol/proj'

const mapContainer = ref(null)
let mapInstance = null

onMounted(() => {
  const googleLayer = new TileLayer({
    source: new XYZ({
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    }),
    properties: { title: 'Google Maps' },
  })

  mapInstance = new Map({
    target: mapContainer.value,
    layers: [googleLayer],
    view: new View({
      center: fromLonLat([90, 65]),
      zoom: 3,
    }),
  })
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.setTarget(null)
    mapInstance = null
  }
})
</script>

<style lang="scss" scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
