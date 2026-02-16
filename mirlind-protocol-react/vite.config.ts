import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cssPostProcessPlugin } from './vite-css-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cssPostProcessPlugin()],
})
