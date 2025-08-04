// vite.config.js
import path from "node:path";
import vue from "file:///workspace/development/frappe-bench/apps/homemain/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import frappeui from "file:///workspace/development/frappe-bench/apps/homemain/frontend/node_modules/frappe-ui/vite/index.js";
import { defineConfig } from "file:///workspace/development/frappe-bench/apps/homemain/frontend/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/workspace/development/frappe-bench/apps/homemain/frontend";
var vite_config_default = defineConfig({
  plugins: [
    frappeui({
      frappeProxy: true,
      jinjaBootData: true,
      lucideIcons: true,
      buildConfig: {
        indexHtmlPath: "../homemain/www/frontend.html",
        emptyOutDir: true,
        sourcemap: true
      }
    }),
    vue()
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    outDir: "../homemain/public/frontend",
    emptyOutDir: true,
    target: "es2015",
    sourcemap: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "tailwind.config.js": path.resolve(__vite_injected_original_dirname, "tailwind.config.js")
    }
  },
  optimizeDeps: {
    include: ["feather-icons", "showdown", "highlight.js/lib/core", "interactjs"]
  },
  server: {
    proxy: {
      "/api": "http://localhost:8000"
      // point to frappe
    },
    allowedHosts: true,
    host: "0.0.0.0"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvd29ya3NwYWNlL2RldmVsb3BtZW50L2ZyYXBwZS1iZW5jaC9hcHBzL2hvbWVtYWluL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvd29ya3NwYWNlL2RldmVsb3BtZW50L2ZyYXBwZS1iZW5jaC9hcHBzL2hvbWVtYWluL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy93b3Jrc3BhY2UvZGV2ZWxvcG1lbnQvZnJhcHBlLWJlbmNoL2FwcHMvaG9tZW1haW4vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCJcbmltcG9ydCB2dWUgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXZ1ZVwiXG5pbXBvcnQgZnJhcHBldWkgZnJvbSBcImZyYXBwZS11aS92aXRlXCJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCJcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBmcmFwcGV1aSh7XG4gICAgICBmcmFwcGVQcm94eTogdHJ1ZSxcbiAgICAgIGppbmphQm9vdERhdGE6IHRydWUsXG4gICAgICBsdWNpZGVJY29uczogdHJ1ZSxcbiAgICAgIGJ1aWxkQ29uZmlnOiB7XG4gICAgICAgIGluZGV4SHRtbFBhdGg6IFwiLi4vaG9tZW1haW4vd3d3L2Zyb250ZW5kLmh0bWxcIixcbiAgICAgICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgdnVlKCksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxNTAwLFxuICAgIG91dERpcjogXCIuLi9ob21lbWFpbi9wdWJsaWMvZnJvbnRlbmRcIixcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICB0YXJnZXQ6IFwiZXMyMDE1XCIsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcbiAgICAgIFwidGFpbHdpbmQuY29uZmlnLmpzXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwidGFpbHdpbmQuY29uZmlnLmpzXCIpLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcImZlYXRoZXItaWNvbnNcIiwgXCJzaG93ZG93blwiLCBcImhpZ2hsaWdodC5qcy9saWIvY29yZVwiLCBcImludGVyYWN0anNcIl0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6ICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLCAvLyBwb2ludCB0byBmcmFwcGVcbiAgICB9LFxuICAgIGFsbG93ZWRIb3N0czogdHJ1ZSxcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdXLE9BQU8sVUFBVTtBQUNqWCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxjQUFjO0FBQ3JCLFNBQVMsb0JBQW9CO0FBSDdCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLFNBQVM7QUFBQSxNQUNQLGFBQWE7QUFBQSxNQUNiLGVBQWU7QUFBQSxNQUNmLGFBQWE7QUFBQSxNQUNiLGFBQWE7QUFBQSxRQUNYLGVBQWU7QUFBQSxRQUNmLGFBQWE7QUFBQSxRQUNiLFdBQVc7QUFBQSxNQUNiO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxJQUFJO0FBQUEsRUFDTjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsdUJBQXVCO0FBQUEsSUFDdkIsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUNsQyxzQkFBc0IsS0FBSyxRQUFRLGtDQUFXLG9CQUFvQjtBQUFBLElBQ3BFO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGlCQUFpQixZQUFZLHlCQUF5QixZQUFZO0FBQUEsRUFDOUU7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQTtBQUFBLElBQ1Y7QUFBQSxJQUNBLGNBQWM7QUFBQSxJQUNkLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
