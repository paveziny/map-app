import { createApp } from 'vue'
import App from './App.vue'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'

import 'ol/ol.css'

import './assets/styles/main.scss'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
  },
})

createApp(App).mount('#app')
