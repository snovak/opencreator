import { defineConfig } from "vite";
import VuePlugin from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite';
import VueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
  plugins: [
    VueDevTools(), 
    VuePlugin(),
    tailwindcss(),
  ],
});