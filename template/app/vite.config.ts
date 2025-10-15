import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig({
  server: {
    open: true,
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    // Enable source maps for production debugging (optional)
    sourcemap: false, // Set to true if you need source maps in production
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js'),
          dest: 'assets'
        }
      ]
    })
  ]
})
