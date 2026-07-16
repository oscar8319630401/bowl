import { Suspense, lazy, useState } from 'react'
import Timeline from './components/Timeline'
import Flashcards from './components/Flashcards'
import Quiz from './components/Quiz'
import Gallery from './components/Gallery'
import { ERAS, type Pottery } from './data/pottery'
import { useStore } from './lib/store'

// 3D는 무겁다. 타임라인 첫 화면을 빠르게 띄우려고 뷰어만 늦게 불러온다.
const PotteryViewer = lazy(() => import('./components/PotteryViewer'))

type Sheet = 'flash' | 'quiz' | 'gallery' | null

function Detail({ pottery, onBack }: { pottery: Pottery; onBack: () => void }) {
  const era = ERAS.find((e) => e.id === pottery.era)!
  const studied = useStore((s) => s.studied.includes(pottery.id))

  return (
    <div className="detail" style={{ background: `linear-gradient(170deg, ${era.bg[0]}, ${era.bg[1]})` }}>
      <header className="detail-head">
        <button className="back" onClick={onBack}>
          ‹ 타임라인
        </button>
        <div className="titles">
          <h1>{pottery.name}</h1>
          {pottery.hanja && <p className="hanja">{pottery.hanja}</p>}
        </div>
        {studied && <span className="studied-chip">학습 완료 ✓</span>}
      </header>

      <Suspense fallback={<div className="loading">3D 도자기를 물레에 올리는 중…</div>}>
        <PotteryViewer pottery={pottery} />
      </Suspense>

      <div className="detail-info">
        <div className="chips">
          {pottery.designation && <span className="chip gold">{pottery.designation}</span>}
          <span className="chip">{pottery.date}</span>
          <span className="chip">높이 {pottery.height}</span>
          <span className="chip">{pottery.museum}</span>
        </div>
        <p className="desc">{pottery.description}</p>
        <p className="tip">
          💡 도자기 표면의 <b>반짝이는 점</b>을 눌러 보세요. 전부 열면 배지를 받습니다.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [selected, setSelected] = useState<Pottery | null>(null)
  const [sheet, setSheet] = useState<Sheet>(null)

  const pickFromSheet = (p: Pottery) => {
    setSheet(null)
    setSelected(p)
  }

  return (
    <div className="app">
      {selected ? (
        <Detail pottery={selected} onBack={() => setSelected(null)} />
      ) : (
        <Timeline onPick={setSelected} />
      )}

      {sheet && <div className="scrim" onClick={() => setSheet(null)} />}
      {sheet === 'flash' && <Flashcards onClose={() => setSheet(null)} />}
      {sheet === 'quiz' && <Quiz onClose={() => setSheet(null)} />}
      {sheet === 'gallery' && <Gallery onPick={pickFromSheet} onClose={() => setSheet(null)} />}

      <nav className="tabbar">
        <button
          className={!selected && !sheet ? 'on' : ''}
          onClick={() => {
            setSheet(null)
            setSelected(null)
          }}
        >
          <span className="ico">🏛️</span>타임라인
        </button>
        <button className={sheet === 'flash' ? 'on' : ''} onClick={() => setSheet('flash')}>
          <span className="ico">🃏</span>카드
        </button>
        <button className={sheet === 'quiz' ? 'on' : ''} onClick={() => setSheet('quiz')}>
          <span className="ico">✏️</span>퀴즈
        </button>
        <button className={sheet === 'gallery' ? 'on' : ''} onClick={() => setSheet('gallery')}>
          <span className="ico">🏺</span>갤러리
        </button>
      </nav>
    </div>
  )
}
