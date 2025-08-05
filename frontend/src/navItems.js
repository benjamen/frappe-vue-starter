import { storeToRefs } from "pinia";
import { usePageConfigStore } from "@/stores/pageConfig";
import { computed } from "vue";
import {
  faTasks, faCogs, faChartPie, faHome, faFile, faList, faDatabase
} from "@fortawesome/free-solid-svg-icons";

const iconMap = {
  faTasks,
  faCogs,
  faChartPie,
  faHome,
  faFile,
  faList,
  faDatabase,
  // Add more common icons that might be used in configs
};

const baseNavItems = [
  { name: "Home", to: "/home", icon: faHome },
  { name: "Dashboard", to: "/dashboard", icon: faChartPie },
  { name: "Tasks", to: "/tasks", icon: faTasks },
];

export function useNavItems() {
  const pageConfigStore = usePageConfigStore();
  const { configs } = storeToRefs(pageConfigStore);

  return computed(() => {
    // Add safety check for configs
    if (!configs.value || !Array.isArray(configs.value)) {
      return baseNavItems;
    }

    const customNav = configs.value
      .filter(cfg => cfg.published_to_custom_ui) // or whatever flag you use
      .map(cfg => ({
        name: cfg.displayName || cfg.title || cfg.name,
        to: `/form/${cfg.name}/list`,
        icon: iconMap[cfg.custom_ui_icon] || faHome, // fallback to faHome
      }))
      .filter(item => item.name); // Remove items without names

    return [...baseNavItems, ...customNav];
  });
}
