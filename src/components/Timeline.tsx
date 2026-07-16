import { useEffect, useRef, useState } from 'react'
import { ERAS, POTTERY_BY_ERA, type Era, type Pottery } from '../data/pottery'
import { silhouetteDataUrl } from '../lib/textures'
import { useStore } from '../lib/store'

/**
 * PRD #1 스와이프 타임라인.
 * 좌우 스와이프(터치)와 드래그(마우스)로 시대를 이동한다.
 * 시대별 배경색은 Era.bg 그라데이션이 담당한다.
 */

function EraCard({ era, onPick }: { era: Era; onPick: (p: Pottery) => void }) {
  const list = POTTERY_BY_ERA(era.id)
  const badgeOf = useStore((s) => s.badgeOf)
  // 스토어 변경 시 배지 다시 계산되도록 구독
  useStore((s) => s.studied)
  useStore((s) => s.quizzed)

  return (
    <section className="era-card">
      <header className="era-head">
        <p className="era-period">{era.period}</p>
        <h2 className="era-name" style={{ color: era.accent }}>
          {era.name}
        </h2>
        <p className="era-tagline">{era.tagline}</p>
      </header>

      <div className="era-grid">
        {list.map((p) => {
          const tier = badgeOf(p.id)
          return (
            <button key={p.id} className="pot-card" onClick={() => onPick(p)}>
              <div className="pot-thumb">
                <img src={silhouetteDataUrl(p.profile, p.glaze, 220)} alt="" draggable={false} />
                {tier !== 'none' && <span className={`badge badge-${tier}`}>{tier === 'gold' ? '★' : '●'}</span>}
              </div>
              <span className="pot-name">{p.name}</span>
              {p.designation && <span className="pot-tag">{p.designation}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function Timeline({ onPick }: { onPick: (p: Pottery) => void }) {
  const [index, setIndex] = useState(3) // 고려부터 시작 — 청자가 이 앱의 얼굴이라서
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; active: boolean } | null>(null)
  const era = ERAS[index]

  const go = (dir: number) => setIndex((i) => Math.min(ERAS.length - 1, Math.max(0, i + dir)))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const start = (x: number) => (drag.current = { x, active: true })
  const end = (x: number) => {
    if (!drag.current?.active) return
    const dx = x - drag.current.x
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
    drag.current = null
  }

  return (
    <div
      className="timeline"
      style={{ background: `linear-gradient(160deg, ${era.bg[0]}, ${era.bg[1]})` }}
      onTouchStart={(e) => start(e.touches[0].clientX)}
      onTouchEnd={(e) => end(e.changedTouches[0].clientX)}
      onMouseDown={(e) => start(e.clientX)}
      onMouseUp={(e) => end(e.clientX)}
    >
      <div className="era-nav">
        {ERAS.map((e, i) => (
          <button
            key={e.id}
            className={`era-dot ${i === index ? 'on' : ''}`}
            style={i === index ? { background: e.accent, color: '#111' } : undefined}
            onClick={() => setIndex(i)}
          >
            {e.name}
          </button>
        ))}
      </div>

      <div className="track-window">
        <div ref={track} className="track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {ERAS.map((e) => (
            <div className="track-slide" key={e.id}>
              <EraCard era={e} onPick={onPick} />
            </div>
          ))}
        </div>
      </div>

      <button className="arrow left" onClick={() => go(-1)} disabled={index === 0} aria-label="이전 시대">
        ‹
      </button>
      <button
        className="arrow right"
        onClick={() => go(1)}
        disabled={index === ERAS.length - 1}
        aria-label="다음 시대"
      >
        ›
      </button>
      <p className="swipe-hint">← 좌우로 스와이프해서 시대를 이동 →</p>
    </div>
  )
}
