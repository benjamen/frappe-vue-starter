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
      console.log("[PageConfig] fetchConfigs called. Loaded flag:", this.loaded);

      if (this.loaded) {
        console.log("[PageConfig] Already loaded, skipping fetch.");
        return;
      }
      let response;
      try {
        console.log("[PageConfig] Attempting to fetch with custom fields...");
        response = await call("frappe.client.get_list", {
          doctype: "Web Form",
          fields: [
            "name",
            "title",
            "route",
            "custom_published_to_custom_ui",
            "custom_custom_ui_icon",
            "is_standard",
          ],
          filters: [["custom_published_to_custom_ui", "=", 1]],
          order_by: "modified desc",
          limit_page_length: 1000,
        });
        console.log("[PageConfig] Response with custom fields:", response);
      } catch (err) {
        console.warn("[PageConfig] Custom fields not available, using fallback:", err);

        try {
          console.log("[PageConfig] Attempting to fetch with fallback fields...");
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
          console.log("[PageConfig] Response with fallback fields:", response);
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

      console.log("[PageConfig] Normalized rows:", rows);

      // Map and normalize each config row using your custom fields
      this.configs = rows.map((cfg) => {
        let routePath;
        if (cfg.route?.startsWith("/")) {
          routePath = cfg.route;
        } else if (cfg.is_standard || cfg.name?.toLowerCase().includes('profile')) {
          routePath = `/form/${cfg.name}/single`;
        } else {
          routePath = `/form/${cfg.name}/list`;
        }

        const mappedCfg = {
          ...cfg,
          name: cfg.name,
          displayName: cfg.title || cfg.name,
          to: routePath,
          icon: iconMap[cfg.custom_custom_ui_icon] || faHome,
          isSingle: cfg.is_standard || cfg.name?.toLowerCase().includes('profile'),
        };
        console.log("[PageConfig] Mapped config:", mappedCfg);
        return mappedCfg;
      });

      console.log("[PageConfig] Final configs loaded:", this.configs);
      this.loaded = true;
    },

    async reloadConfigs() {
      console.log("[PageConfig] Forcing reload...");
      this.loaded = false;
      this.configs = [];
      await this.fetchConfigs();
    },
  },
});
