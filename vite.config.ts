import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages는 https://<user>.github.io/bowl/ 하위로 서비스되므로 base가 필요하다.
// 로컬 개발에서는 '/'라야 하므로 배포 빌드에서만 붙인다. (CI에서 GITHUB_PAGES=1)
const base = process.env.GITHUB_PAGES === '1' ? '/bowl/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5173, open: true },
  build: {
    // three.js가 커서 기본 경고(500kB)가 계속 뜬다. 청크를 나누고 한도를 현실적으로 잡는다.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})
