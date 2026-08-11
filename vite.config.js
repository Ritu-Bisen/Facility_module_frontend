import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
   base: '/ReactFac/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        //target: 'http://localhost:3001',
          target: 'https://dpdmis.in/FacNodeAPI',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})