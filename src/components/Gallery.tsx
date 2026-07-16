import { ERAS, POTTERY, type Pottery } from '../data/pottery'
import { silhouetteDataUrl } from '../lib/textures'
import { useCollectionStats, useStore } from '../lib/store'

/**
 * PRD #4 마이 갤러리.
 * 빈 진열장에서 시작해 학습·퀴즈로 배지를 채운다.
 *  - 브론즈: 3D로 다 뜯어봤거나(핫스팟 전부) 퀴즈로 맞혔거나 둘 중 하나
 *  - 골드  : 둘 다 완료
 */

function Shelf({ items, onPick }: { items: Pottery[]; onPick: (p: Pottery) => void }) {
  const badgeOf = useStore((s) => s.badgeOf)
  useStore((s) => s.studied)
  useStore((s) => s.quizzed)

  return (
    <div className="shelf">
      <div className="shelf-items">
        {items.map((p) => {
          const tier = badgeOf(p.id)
          const locked = tier === 'none'
          return (
            <button
              key={p.id}
              className={`slot ${locked ? 'locked' : ''}`}
              onClick={() => onPick(p)}
              title={locked ? '아직 잠김' : p.name}
            >
              {locked ? (
                <span className="lock">?</span>
              ) : (
                <img src={silhouetteDataUrl(p.profile, p.glaze, 200)} alt={p.name} />
              )}
              {tier === 'gold' && <span className="badge badge-gold">★</span>}
              {tier === 'bronze' && <span className="badge badge-bronze">●</span>}
              <span className="slot-name">{locked ? '???' : p.name}</span>
            </button>
          )
        })}
      </div>
      <div className="shelf-plank" />
    </div>
  )
}

export default function Gallery({ onPick, onClose }: { onPick: (p: Pottery) => void; onClose: () => void }) {
  const { gold, collected, total } = useCollectionStats()
  const rotated = useStore((s) => s.rotatedFullTurn)
  const quizBest = useStore((s) => s.quizBest)
  const wrong = useStore((s) => s.wrong)
  const reset = useStore((s) => s.reset)

  return (
    <div className="sheet gallery">
      <div className="sheet-head">
        <h2>마이 갤러리</h2>
        <span className="counter">
          {collected} / {total} 수집 · ★{gold}
        </span>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-num">{Math.round((collected / total) * 100)}%</span>
          <span className="stat-label">진열장 채움</span>
        </div>
        <div className="stat">
          <span className="stat-num">{quizBest}</span>
          <span className="stat-label">퀴즈 최고점</span>
        </div>
        <div className="stat">
          <span className="stat-num">{wrong.length}</span>
          <span className="stat-label">오답노트</span>
        </div>
        <div className="stat">
          <span className="stat-num">{rotated ? '✓' : '—'}</span>
          <span className="stat-label">360° 회전</span>
        </div>
      </div>

      <div className="how">
        <span>
          <b className="badge badge-bronze inline">●</b> 3D로 핫스팟 전부 보기 <i>또는</i> 퀴즈 정답
        </span>
        <span>
          <b className="badge badge-gold inline">★</b> 둘 다 완료
        </span>
      </div>

      <div className="shelves">
        {ERAS.map((era) => {
          const items = POTTERY.filter((p) => p.era === era.id)
          return (
            <div key={era.id} className="shelf-block">
              <h3 style={{ color: era.accent }}>{era.name}</h3>
              <Shelf items={items} onPick={onPick} />
            </div>
          )
        })}
      </div>

      <div className="row center">
        <button className="btn ghost" onClick={() => confirm('진행도를 모두 지울까요?') && reset()}>
          진행도 초기화
        </button>
        <button className="btn" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
