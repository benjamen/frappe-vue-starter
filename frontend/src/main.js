import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { initSocket } from "./socket";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { usePageConfigStore } from "@/stores/pageConfig";
import { createPinia } from "pinia";
import { session } from "./data/session"; // Import session to get CSRF token
import { userResource, updateUserResource } from './data/user'



const pinia = createPinia();

// Frappe UI imports
import {
  Button,
  Card,
  Dialog,
  FormControl,
  Switch,
  TextInput,
  frappeRequest,
  pageMetaPlugin,
  resourcesPlugin,
  setConfig,
  createDocumentResource,
  createListResource,
  LoadingText
} from "frappe-ui";

// Lucide icon
import { X } from 'lucide-vue-next';

import "./index.css";

// --- 1. CREATE APP, PINIA, REGISTER ---
const app = createApp(App);

app.use(pinia);

// Configure frappe-ui with CSRF token
setConfig("resourceFetcher", (options) => {
  // Add CSRF token to all requests
  if (!options.headers) {
    options.headers = {};
  }
  
  // Add CSRF token if we have one
  if (session.csrfToken) {
    options.headers['X-Frappe-CSRF-Token'] = session.csrfToken;
  }
  
  return frappeRequest(options);
});

// Fetch and wait for configs before mounting
const pageConfig = usePageConfigStore();
await pageConfig.fetchConfigs();  // <- IMPORTANT: Await before app.mount

// Provide toast
const toast = (options) => {
  console.log(`[Toast] ${options.title}: ${options.text || ''}`);
};
app.provide('toast', toast);

// Register components globally
app.component('Button', Button);
app.component('Card', Card);
app.component('Dialog', Dialog);
app.component('FormControl', FormControl);
app.component('Switch', Switch);
app.component('TextInput', TextInput);
app.component('LucideX', X);
app.component('LoadingText', LoadingText);

app.component('fa-icon', FontAwesomeIcon);

app.use(resourcesPlugin, {
  resources: {
    getUser: userResource,
    updateUser: updateUserResource
  }
});
app.use(router);
app.use(pageMetaPlugin);



// --- 2. INIT SOCKET ---
const socket = initSocket();
app.config.globalProperties.$socket = socket;

// --- 4. NOW MOUNT ---
app.mount("#app");