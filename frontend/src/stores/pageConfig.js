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
        return;
      }
      let response;
      try {
        // Use the actual custom field names with custom_ prefix
        response = await call("frappe.client.get_list", {
          doctype: "Web Form",
          fields: [
            "name",
            "title",
            "route",
            "custom_published_to_custom_ui", // Note the custom_ prefix
            "custom_custom_ui_icon",        // Note the custom_ prefix
            "is_standard",
          ],
          filters: [["custom_published_to_custom_ui", "=", 1]], // Filter with correct field name
          order_by: "modified desc",
          limit_page_length: 1000,
        });

      } catch (err) {
        console.warn("[PageConfig] Custom fields not available, using fallback:", err);
        
        // Fallback to standard fields
        try {
          response = await call("frappe.client.get_list", {
            doctype: "Web Form",
            fields: [
              "name",
              "title",
              "route",
              "published",
              "is_standard",
            ],
            filters: [["published", "=", 1]],
            order_by: "modified desc",
            limit_page_length: 1000,
          });
        } catch (fallbackErr) {
          console.error("[PageConfig] Fallback also failed:", fallbackErr);
          this.configs = [];
          this.loaded = true;
          return;
        }
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

      // Map and normalize each config row using your custom fields
      this.configs = rows.map((cfg) => {
        // Determine routing based on form type
        let routePath;
        if (cfg.route?.startsWith("/")) {
          // Use custom route if provided
          routePath = cfg.route;
        } else if (cfg.is_standard || cfg.name?.toLowerCase().includes('profile')) {
          // For single document forms like profile - route to single doc view
          routePath = `/form/${cfg.name}/single`;
        } else {
          // For multi-document forms - route to list view
          routePath = `/form/${cfg.name}/list`;
        }

        return {
          ...cfg,
          name: cfg.name, // Frappe document name for API calls
          displayName: cfg.title || cfg.name, // Display name for navigation
          to: routePath,
          // Use the correct custom field name with custom_ prefix
          icon: iconMap[cfg.custom_custom_ui_icon] || faHome, 
          isSingle: cfg.is_standard || cfg.name?.toLowerCase().includes('profile'), // Flag for single docs
        };
      });

      console.log("[PageConfig] Final configs loaded:", this.configs);
      this.loaded = true;
    },
    
    // Method to force reload configs
    async reloadConfigs() {
      console.log("[PageConfig] Forcing reload...");
      this.loaded = false;
      this.configs = [];
      await this.fetchConfigs();
    },
  },
});