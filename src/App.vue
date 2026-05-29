<template>
  <v-app>
    <div class="app-container">
      <MapView />
    </div>
  </v-app>
</template>

<script setup>
import MapView from '@/components/MapView.vue'
</script>

<style lang="scss" scoped>
.app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
