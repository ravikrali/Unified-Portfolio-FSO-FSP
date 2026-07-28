const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig(({ mode }) => ({
  base: mode === "cloudflare" ? "/" : process.env.VITE_BASE_PATH || "/",
  define: {
    "import.meta.env.VITE_STATIC_API": JSON.stringify(
      mode === "cloudflare" ? "true" : process.env.VITE_STATIC_API || "false",
    ),
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:4317",
    },
  },
}));
