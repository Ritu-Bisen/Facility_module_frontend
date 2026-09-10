import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/ReactFac/',
  plugins: [
    react(),
    {
      name: 'block-disallowed-methods',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const disallowed = ['OPTIONS', 'TRACE', 'TRACK', 'DEBUG'];
          if (disallowed.includes(req.method?.toUpperCase())) {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
            return;
          }
          next();
        });
      }
    }
  ],
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