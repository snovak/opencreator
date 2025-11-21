import { defineConfig } from "vite";
import VuePlugin from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    VuePlugin(),
    tailwindcss(),
  ],
});   