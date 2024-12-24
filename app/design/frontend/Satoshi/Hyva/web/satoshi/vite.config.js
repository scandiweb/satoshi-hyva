import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [
    // Add any necessary plugins here
  ],
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "src/app.ts"),
      },
      output: {
        dir: path.resolve(__dirname, "../"),
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "css/styles.css";
          return assetInfo.name;
        },
      },
    },
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
