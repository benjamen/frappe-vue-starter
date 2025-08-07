import { storeToRefs } from "pinia";
import { usePageConfigStore } from "@/stores/pageConfig";
import { computed } from "vue";
import { faHome, faChartPie, faTasks } from "@fortawesome/free-solid-svg-icons";

const baseNavItems = [
  { name: "Home", to: "/home", icon: faHome },
  { name: "Dashboard", to: "/dashboard", icon: faChartPie },
  { name: "Tasks", to: "/tasks", icon: faTasks },
];

export function useNavItems() {
  const pageConfigStore = usePageConfigStore();
  const { configs } = storeToRefs(pageConfigStore);

  return computed(() => {
    // --- DEBUG LOG: See what we get from configs
    console.group("[NAV DEBUG]");
    console.log("Configs value:", configs.value);

    if (!configs.value || !Array.isArray(configs.value) || !configs.value.length) {
      console.warn("No configs or empty - showing only baseNavItems");
      console.groupEnd();
      return baseNavItems;
    }

    const customNav = configs.value
      .filter(cfg => {
        const isValid = !!cfg.displayName && !!cfg.to;
        if (!isValid) {
          console.warn("Config missing displayName or to:", cfg);
        }
        return isValid;
      })
      .map(cfg => {
        // Log every nav item we try to render
        console.log("Custom nav item:", cfg.displayName, "to:", cfg.to, "icon:", cfg.icon);
        return {
          name: cfg.displayName,
          to: cfg.to,
          icon: cfg.icon || faHome,
        }
      });

    console.log("Final nav items:", [...baseNavItems, ...customNav]);
    console.groupEnd();

    return [
      ...baseNavItems,
      ...customNav,
    ];
  });
}
