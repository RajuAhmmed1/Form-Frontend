// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // This is correct for API proxying
    },
  
  },
  plugins: [react(), tailwindcss()],
  base:'/',
})
