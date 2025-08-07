// src/main.js
import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from "./router"
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTasks, faCogs, faChartPie, faHome, faFile, faList, faDatabase, faTachometerAlt, faUser, faChevronLeft, faChevronRight, faBars } from '@fortawesome/free-solid-svg-icons'

library.add(
  faTasks,
  faCogs,
  faChartPie,
  faHome,
  faFile,
  faList,
  faDatabase,
  faTachometerAlt,
  faUser,
  faChevronLeft,
  faChevronRight,
  faBars
)

// Frappe UI components
import {
  Button,
  Card,
  Dialog,
  FormControl,
  Switch,
  TextInput,
  LoadingText,
  setConfig,
  frappeRequest,
  resourcesPlugin,
  pageMetaPlugin
} from "frappe-ui"

// Icons
import { X } from 'lucide-vue-next'

import "./index.css"

const app = createApp(App)
const pinia = createPinia()

// --- Defensive JSON/content-type check for all frappeRequest calls ---
const originalFrappeRequest = frappeRequest

function safeFrappeRequest(...args) {
  return originalFrappeRequest(...args).then(response => {
    // If we get a Response object (before JSON parsing)
    if (response && typeof response === 'object' && typeof response.headers?.get === 'function') {
      const type = response.headers.get('content-type')
      if (!type || !type.includes('application/json')) {
        window.location.href = '/login'
        throw new Error('API response is not JSON. Redirecting to login.')
      }
      return response.json()
    }
    // If already JSON (Frappe UI already parsed it)
    return response
  })
}


setConfig('resourceFetcher', safeFrappeRequest)
// -------------------------------------------------------------------

// Global components
const components = {
  Button,
  Card,
  Dialog,
  FormControl,
  Switch,
  TextInput,
  LoadingText,
  'fa-icon': FontAwesomeIcon,
  'LucideX': X
}

Object.entries(components).forEach(([name, component]) => {
  app.component(name, component)
})

// Plugins
app.use(pinia)
app.use(router)
app.use(resourcesPlugin)
app.use(pageMetaPlugin)

// Mount app
app.mount('#app')
