import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Custom plugin to copy manifest and handle assets
const copyManifestPlugin = () => ({
   name: "copy-manifest",
   async writeBundle() {
      // Copy manifest.json
      await fs.copyFile("manifest.json", "dist/manifest.json");

      // Create icons if they don't exist
      const iconSizes = [16, 48, 128];
      for (const size of iconSizes) {
         const iconPath = `public/icon${size}.png`;
         const destPath = `dist/icon${size}.png`;
         try {
            await fs.access(iconPath);
            await fs.copyFile(iconPath, destPath);
         } catch (e) {
            console.warn(`Warning: icon${size}.png not found in public folder`);
         }
      }
   },
});

export default defineConfig({
   plugins: [react(), copyManifestPlugin()],
   build: {
      rollupOptions: {
         input: {
            main: resolve(__dirname, "index.html"),
            background: resolve(__dirname, "src/background.ts"),
            payment: "public/payment-success.html",
         },
         output: {
            entryFileNames: (chunkInfo) => {
               return chunkInfo.name === "background"
                  ? "[name].js"
                  : "[name]-[hash].js";
            },
            assetFileNames: "assets/[name]-[hash][extname]",
         },
      },
      outDir: "dist",
   },
   publicDir: "public",
});
