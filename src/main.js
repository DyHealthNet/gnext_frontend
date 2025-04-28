
import { createApp } from 'vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Components
import App from './App.vue'

import InstantSearch from 'vue-instantsearch/vue3/es' // ← this is critical for Vue 3

const dyHealthNetTheme = {
  dark: false,
    colors: {
    "background": "#F5F5F5",
    "surface": "#FAFAFA",
    "surface-bright": "#FFFFFF",
    "surface-light": "#F5F5F5",
    "surface-variant": "#E0E0E0",
    "on-surface-variant": "#4D4D4D",
    "darken-1": "#333333",
    "white-surface": "#FAFAFA",

    "primary": "#A5BFDC",
    "primary-backup": "#A5BFDC",
    "primary-darken-1": "#516F84",
    "primary-darken-1-backup": "#516F84",

    "secondary": "#C1A1D3",
    "secondary-darken-1": "#7D5E9A",

    "error": "#E57373",
    "info": "#3398DB",
    "success": "#81C784",
    "warning": "#FFB74D",

    "orcid_button": "#A6CE39",
    "github_button": "#121212",

    "chart": '#707070',
    "chart-grid": '#E0E0E0',

    "node-logo-background": "#CDDDE8",

    "text": "#000000",
    "node-border": "#A5BFDC",
  },
}

const vuetify = createVuetify({
    theme: {
      defaultTheme: 'dyHealthNetTheme',
        themes: {
          dyHealthNetTheme
        }
    },
    options: {
      customProperties: true,
    },
  components,
  directives,
})

createApp(App).use(vuetify).use(router).use(InstantSearch).mount('#app')