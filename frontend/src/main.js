import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import { initSocket } from "./socket"

// Only stable Frappe-UI imports
import {
  Button,
  Card,
  Dialog,
  FormControl,
  Switch,  // Add Switch component
  TextInput,
  frappeRequest,
  pageMetaPlugin,
  resourcesPlugin,
  setConfig,
  createDocumentResource,
  createListResource,
  LoadingText
} from "frappe-ui"

// Lucide icon
import { X } from 'lucide-vue-next'

import "./index.css"

const app = createApp(App)

// Enhanced client implementation


// Toast implementation
const toast = (options) => {
  console.log(`[Toast] ${options.title}: ${options.text || ''}`)
  // Replace with actual UI toast if available
}

// Provide to components
app.provide('toast', toast)

// Register components
app.component('Button', Button)
app.component('Card', Card)
app.component('Dialog', Dialog)
app.component('FormControl', FormControl)
app.component('Switch', Switch)  // Register Switch component
app.component('TextInput', TextInput)
app.component('LucideX', X)
app.component('LoadingText', LoadingText);

setConfig("resourceFetcher", frappeRequest)

app.use(router)
app.use(resourcesPlugin)
app.use(pageMetaPlugin)

const socket = initSocket()
app.config.globalProperties.$socket = socket

app.mount("#app")
