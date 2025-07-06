import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "src/app.ts"),
        styles: path.resolve(__dirname, "tailwind-source.css"),
      },
      output: {
        dir: path.resolve(__dirname, "../dist"),
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "css/[name].[ext]",
      },
    },
    assetsInlineLimit: 0,
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  }
});
