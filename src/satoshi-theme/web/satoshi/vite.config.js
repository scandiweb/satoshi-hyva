import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

export const satoshiAliases = () => ({
  "@": path.resolve(__dirname, "src"),
  "@satoshi": (alias, options, id) => {
    const satoshiTheme =
        "../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/web/satoshi";
    const importPath = id.replace("@satoshi/", "");
    const localPath = path.resolve(__dirname, importPath);
    if (fs.existsSync(localPath)) return path.resolve(__dirname);
    const fallbackPath = path.resolve(satoshiTheme, importPath);
    if (fs.existsSync(fallbackPath)) return path.resolve(__dirname, satoshiTheme);
    return path.resolve(__dirname);
  },
  "@satoshi-theme": path.resolve(__dirname, "../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/web/satoshi"),
})


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "src/app.ts"),
        styles: path.resolve(__dirname, "tailwind-source.css"),
      },
      output: {
        dir: path.resolve(__dirname, "../"),
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
      ...satoshiAliases(),
    },
  },
});
