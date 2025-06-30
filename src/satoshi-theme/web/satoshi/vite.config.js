import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

const fileExists = (basePath) => {
  const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'];
  return extensions.some(ext => fs.existsSync(basePath + ext));
};

export const satoshiAliases = (directory = __dirname) => ({
  "@": path.resolve(__dirname, "src"),
  "@satoshi": (alias, options, id) => {
    const satoshiTheme = "../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/web/satoshi";
    const importPath = id.replace("@satoshi/", "");
    const localPath = path.resolve(directory, importPath);

    if (fileExists(localPath)) {
      return path.resolve(directory)
    };

    const fallbackPath = path.resolve(satoshiTheme, importPath);  
    if (fileExists(fallbackPath)) {
      return path.resolve(directory, satoshiTheme)
    };

    return path.resolve(directory);
  },
  "@satoshi-theme": path.resolve(directory, "../../../../../../../vendor/scandiweb/satoshi/src/satoshi-theme/web/satoshi"),
})


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
      ...satoshiAliases(__dirname),
    },
  },
});
