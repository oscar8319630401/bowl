import { useMemo, useRef, useState } from 'react'
import { POTTERY, type Pottery } from '../data/pottery'
import { silhouetteDataUrl } from '../lib/textures'

/**
 * PRD #3 플래시카드.
 * 틴더식 스와이프: 오른쪽 = 알겠음, 왼쪽 = 헷갈림(뒤로 다시 돌아옴).
 * 카드를 탭하면 뒤집혀서 이름/시대가 보인다.
 */

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcards({ onClose }: { onClose: () => void }) {
  const [deck, setDeck] = useState<Pottery[]>(() => shuffle(POTTERY))
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<string[]>([])
  const [drag, setDrag] = useState(0)
  const startX = useRef<number | null>(null)

  const card = deck[0]
  const thumb = useMemo(
    () => (card ? silhouetteDataUrl(card.profile, card.glaze, 320) : ''),
    [card],
  )

  const advance = (gotIt: boolean) => {
    if (!card) return
    setFlipped(false)
    setDrag(0)
    if (gotIt) {
      setKnown((k) => [...k, card.id])
      setDeck((d) => d.slice(1))
    } else {
      // 헷갈리면 덱 뒤로 보내서 다시 만나게 한다
      setDeck((d) => [...d.slice(1), d[0]])
    }
  }

  const onDown = (x: number) => (startX.current = x)
  const onMove = (x: number) => {
    if (startX.current === null) return
    setDrag(x - startX.current)
  }
  const onUp = () => {
    if (startX.current === null) return
    if (Math.abs(drag) > 90) advance(drag > 0)
    else setDrag(0)
    startX.current = null
  }

  if (!card) {
    return (
      <div className="sheet">
        <div className="done-panel">
          <h2>🎉 한 바퀴 다 돌았어요</h2>
          <p>{known.length}장을 "알겠음"으로 넘겼습니다.</p>
          <div className="row">
            <button className="btn primary" onClick={() => setDeck(shuffle(POTTERY))}>
              다시 섞어서 시작
            </button>
            <button className="btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const rot = drag / 22
  const verdict = drag > 90 ? 'know' : drag < -90 ? 'unsure' : null

  return (
    <div className="sheet">
      <div className="sheet-head">
        <h2>쓱싹 플래시카드</h2>
        <span className="counter">남은 카드 {deck.length}</span>
      </div>

      <div
        className="card-stage"
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onUp}
      >
        {/* 뒤에 깔린 다음 카드 */}
        {deck[1] && <div className="flash-card behind" />}

        <div
          className={`flash-card ${flipped ? 'flipped' : ''}`}
          style={{ transform: `translateX(${drag}px) rotate(${rot}deg)` }}
          onClick={() => Math.abs(drag) < 6 && setFlipped((f) => !f)}
        >
          <div className="face front">
            <img src={thumb} alt="" draggable={false} />
            <p className="tap-hint">탭해서 정답 확인</p>
          </div>
          <div className="face back">
            <h3>{card.name}</h3>
            {card.hanja && <p className="hanja">{card.hanja}</p>}
            <p className="meta">{card.date}</p>
            {card.designation && <p className="desig">{card.designation}</p>}
            <p className="summary">{card.summary}</p>
          </div>

          {verdict && <div className={`verdict ${verdict}`}>{verdict === 'know' ? '알겠음!' : '헷갈림'}</div>}
        </div>
      </div>

      <div className="row center">
        <button className="btn ghost" onClick={() => advance(false)}>
          ← 헷갈림
        </button>
        <button className="btn primary" onClick={() => advance(true)}>
          알겠음 →
        </button>
      </div>
      <button className="btn link" onClick={onClose}>
        닫기
      </button>
    </div>
  )
}
