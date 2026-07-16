import { useState } from 'react'
import { ERAS, POTTERY, potteryById, type Pottery } from '../data/pottery'
import { silhouetteDataUrl } from '../lib/textures'
import { useStore } from '../lib/store'

/**
 * PRD #3 퀴즈. 가벼운 객관식 + 오답노트.
 * 문제 유형을 섞어서 "시대만 외우면 되는" 패턴 암기를 막는다.
 */

type Question = {
  potteryId: string
  prompt: string
  image?: string
  choices: string[]
  answer: string
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWrong(pool: string[], answer: string, n: number) {
  return shuffle(pool.filter((v) => v !== answer)).slice(0, n)
}

function makeQuestions(source: Pottery[], count: number): Question[] {
  const eraNames = ERAS.map((e) => e.name)
  const eraOf = (p: Pottery) => ERAS.find((e) => e.id === p.era)!.name

  const qs: Question[] = shuffle(source).map((p) => {
    const kind = Math.floor(Math.random() * 3)

    if (kind === 0) {
      const answer = eraOf(p)
      return {
        potteryId: p.id,
        prompt: `이 도자기가 만들어진 시대는?`,
        image: silhouetteDataUrl(p.profile, p.glaze, 260),
        choices: shuffle([answer, ...pickWrong(eraNames, answer, 3)]),
        answer,
      }
    }
    if (kind === 1) {
      const answer = p.name
      return {
        potteryId: p.id,
        prompt: `"${p.summary}" — 어떤 도자기일까?`,
        choices: shuffle([answer, ...pickWrong(POTTERY.map((x) => x.name), answer, 3)]),
        answer,
      }
    }
    const answer = p.name
    return {
      potteryId: p.id,
      prompt: `이 도자기의 이름은?`,
      image: silhouetteDataUrl(p.profile, p.glaze, 260),
      choices: shuffle([answer, ...pickWrong(POTTERY.map((x) => x.name), answer, 3)]),
      answer,
    }
  })

  return qs.slice(0, count)
}

export default function Quiz({ onClose }: { onClose: () => void }) {
  const wrongIds = useStore((s) => s.wrong)
  const markQuizResult = useStore((s) => s.markQuizResult)
  const setQuizBest = useStore((s) => s.setQuizBest)

  const [reviewMode, setReviewMode] = useState(false)
  const [questions, setQuestions] = useState<Question[]>(() => makeQuestions(POTTERY, 8))
  const [at, setAt] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = questions[at]

  const startReview = () => {
    const pool = wrongIds.map(potteryById).filter(Boolean) as Pottery[]
    if (!pool.length) return
    setQuestions(makeQuestions(pool, Math.min(pool.length, 8)))
    setReviewMode(true)
    setAt(0)
    setScore(0)
    setPicked(null)
    setFinished(false)
  }

  const restart = () => {
    setQuestions(makeQuestions(POTTERY, 8))
    setReviewMode(false)
    setAt(0)
    setScore(0)
    setPicked(null)
    setFinished(false)
  }

  const choose = (choice: string) => {
    if (picked) return
    setPicked(choice)
    const correct = choice === q.answer
    if (correct) setScore((s) => s + 1)
    markQuizResult(q.potteryId, correct)
  }

  const next = () => {
    setPicked(null)
    if (at + 1 >= questions.length) {
      const pct = Math.round((score / questions.length) * 100)
      setQuizBest(pct)
      setFinished(true)
    } else {
      setAt((i) => i + 1)
    }
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="sheet">
        <div className="done-panel">
          <h2>{pct === 100 ? '💯 만점!' : pct >= 70 ? '👏 잘했어요' : '📖 조금만 더!'}</h2>
          <p className="big-score">
            {score} / {questions.length} <span>({pct}점)</span>
          </p>
          {pct === 100 && <p className="reward">만점 보상! 맞힌 도자기의 배지가 진열장에 추가됐어요.</p>}
          {wrongIds.length > 0 && <p className="note">오답노트에 {wrongIds.length}개가 쌓여 있어요.</p>}
          <div className="row">
            <button className="btn primary" onClick={restart}>
              새 문제 풀기
            </button>
            {wrongIds.length > 0 && (
              <button className="btn" onClick={startReview}>
                오답노트 풀기
              </button>
            )}
            <button className="btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const answered = picked !== null

  return (
    <div className="sheet">
      <div className="sheet-head">
        <h2>{reviewMode ? '오답노트' : '퀴즈'}</h2>
        <span className="counter">
          {at + 1} / {questions.length} · {score}점
        </span>
      </div>

      <div className="quiz-body">
        {q.image && <img className="quiz-img" src={q.image} alt="" />}
        <p className="quiz-prompt">{q.prompt}</p>

        <div className="choices">
          {q.choices.map((c) => {
            const isAnswer = c === q.answer
            const state = !answered ? '' : isAnswer ? 'correct' : c === picked ? 'wrong' : 'dim'
            return (
              <button key={c} className={`choice ${state}`} onClick={() => choose(c)} disabled={answered}>
                {c}
                {answered && isAnswer && ' ✓'}
                {answered && !isAnswer && c === picked && ' ✕'}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className="explain">
            <p>{potteryById(q.potteryId)?.summary}</p>
            <button className="btn primary" onClick={next}>
              {at + 1 >= questions.length ? '결과 보기' : '다음 문제'}
            </button>
          </div>
        )}
      </div>

      <button className="btn link" onClick={onClose}>
        닫기
      </button>
    </div>
  )
}
