import { defineStore } from "pinia";
import { call } from "frappe-ui";
import {
  faHome,
  faChartPie,
  faTasks,
  faCogs,
  faUser,
  faCalendar,
  faEnvelope,
  faBell,
  faClipboard,
  faBook,
  faComments,
  faShoppingCart,
  faBriefcase,
  faCheck,
  faCloud,
  faPaperclip,
  faStar,
  faInfoCircle,
  faExclamationTriangle,
  faBolt,
  faLightbulb,
  faHeart,
  faThumbsUp,
  faFileAlt,
  faLock,
  faList,
} from "@fortawesome/free-solid-svg-icons";

// Map icon names as string to objects
const iconMap = {
  faHome,
  faChartPie,
  faTasks,
  faCogs,
  faUser,
  faCalendar,
  faEnvelope,
  faBell,
  faClipboard,
  faBook,
  faComments,
  faShoppingCart,
  faBriefcase,
  faCheck,
  faCloud,
  faPaperclip,
  faStar,
  faInfoCircle,
  faExclamationTriangle,
  faBolt,
  faLightbulb,
  faHeart,
  faThumbsUp,
  faFileAlt,
  faLock,
  faList,
};

export const usePageConfigStore = defineStore("pageConfig", {
  state: () => ({
    configs: [],
    loaded: false,
  }),
  actions: {
    async fetchConfigs() {
      if (this.loaded) {
        console.log("[PageConfig] Already loaded, skipping fetch.");
        return;
      }
      let response;
      try {
        response = await call("frappe.client.get_list", {
          doctype: "Web Form", // Or your DocType: "Frontend Page Config"
          fields: [
            "name",
            "title",
            "route",
            "published_to_custom_ui",
            "custom_ui_icon",
          ],
          filters: [["published_to_custom_ui", "=", 1]],
          order_by: "modified desc",
          limit_page_length: 1000,
        });
        console.log("[PageConfig] Raw response:", response);
      } catch (err) {
        console.warn("[PageConfig] Failed to fetch configs:", err);
        this.configs = [];
        this.loaded = true;
        return;
      }

      // Normalize the array from possible Frappe response shapes
      let rows = [];
      if (Array.isArray(response)) {
        rows = response;
      } else if (Array.isArray(response?.message)) {
        rows = response.message;
      } else if (Array.isArray(response?.docs)) {
        rows = response.docs;
      } else if (
        response?.message &&
        typeof response.message === "object" &&
        Array.isArray(response.message.data)
      ) {
        rows = response.message.data;
      } else if (
        typeof response === "object" &&
        Object.keys(response).length &&
        Array.isArray(Object.values(response)[0])
      ) {
        // fallback: take the first array property found in object
        rows = Object.values(response).find((v) => Array.isArray(v)) || [];
      }
      console.log("[PageConfig] Loaded configs (raw rows):", rows);

      // Map and normalize each config row
      // In pageConfig.js
      this.configs = rows.map((cfg) => ({
        ...cfg,
        name: cfg.name, // Always use Frappe's "name" for lookups and API calls!
        displayName: cfg.title || cfg.name, // Use this for nav display
        to: cfg.route?.startsWith("/") ? cfg.route : `/form/${cfg.name}`,
        icon: iconMap[cfg.custom_ui_icon] || faHome,
      }));


      console.log("[PageConfig] Normalized configs:", this.configs);
      this.loaded = true;
    },
  },
});
