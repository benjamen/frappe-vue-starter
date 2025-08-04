import frappeUIPreset from 'frappe-ui/src/tailwind/preset'

export default {
  // 1. Enable dark mode via class strategy
  darkMode: 'class',

  // 2. Content paths – include all places Tailwind classes appear
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    // Frappe UI components (works for dev and prod)
    "./node_modules/frappe-ui/src/components/**/*.{vue,js,ts,jsx,tsx}",
    // If you use Frappe UI composables or icons from other folders, add them here too
  ],

  // 3. Use Frappe UI's preset
  presets: [frappeUIPreset],

  theme: {
    extend: {
      // Add any customizations here (colors, fonts, etc)
    },
  },

  plugins: [
    // You can add Tailwind plugins here if you need (e.g., forms, typography, etc)
  ],
}
