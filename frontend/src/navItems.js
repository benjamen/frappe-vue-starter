import { storeToRefs } from "pinia";
import { usePageConfigStore } from "@/stores/pageConfig";
import { computed } from "vue";
import {
  faTasks, faCogs, faChartPie, faHome
} from "@fortawesome/free-solid-svg-icons";

const iconMap = {
  faTasks, faCogs, faChartPie, faHome
};

const baseNavItems = [
  { name: "Home", to: "/home", icon: faHome },
  { name: "Dashboard", to: "/dashboard", icon: faChartPie },
  { name: "Tasks", to: "/tasks", icon: faTasks },
  { name: "Settings", to: "/settings", icon: faCogs },
];

export function useNavItems() {
  const pageConfigStore = usePageConfigStore();
  const { configs } = storeToRefs(pageConfigStore);

  return computed(() => {
    const customNav = (configs.value || [])
      .filter(cfg => cfg.published_to_custom_ui) // or whatever flag you use
      .map(cfg => ({
        name: cfg.displayName || cfg.title || cfg.name,
        to: `/form/${cfg.name}`,
        icon: iconMap[cfg.custom_ui_icon] || faHome,
      }));


    return [...baseNavItems, ...customNav];
  });
}
