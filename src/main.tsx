import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// ?shot=<id> 로 진입하면 썸네일 캡처 모드. 빌드 스크립트가 카드 이미지를 뽑을 때만 쓴다.
const ThumbCapture = lazy(() => import('./components/ThumbCapture'))
const shotId = new URLSearchParams(location.search).get('shot')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {shotId ? (
      <Suspense fallback={null}>
        <ThumbCapture id={shotId} />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
