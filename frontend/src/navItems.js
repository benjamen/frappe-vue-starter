import { doctypeConfigs } from "@/data/doctypeConfigs";
import { faHome, faChartPie, faTasks, faCogs } from "@fortawesome/free-solid-svg-icons";

const baseNavItems = [
  { name: "Home", to: "/home", icon: faHome },
  { name: "Dashboard", to: "/dashboard", icon: faChartPie },
  { name: "Tasks", to: "/tasks", icon: faTasks },
  { name: "Settings", to: "/settings", icon: faCogs },
];

// Extract nav items from doctype configs
const dynamicNavItems = Object.values(doctypeConfigs)
  .filter(cfg => cfg.nav) // add a nav property in your doctypeConfigs if you want
  .map(cfg => cfg.nav);

export const navItems = [
  ...baseNavItems,
  ...dynamicNavItems,
];
