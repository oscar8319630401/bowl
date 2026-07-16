import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { POTTERY } from '../data/pottery'

/**
 * 학습 진행도 저장소. PRD의 "마이 갤러리 = 수집 & 보상"을 담당한다.
 * 배지 획득 조건:
 *   - study : 3D 뷰어에서 그 도자기의 핫스팟을 전부 열어 봄
 *   - quiz  : 해당 도자기가 나온 퀴즈 문제를 맞힘
 *   - 두 조건을 모두 채우면 골드 배지
 */

export type BadgeTier = 'none' | 'bronze' | 'gold'

interface Progress {
  /** 도자기별로 열어 본 핫스팟 id 목록 */
  opened: Record<string, string[]>
  /** 학습 완료(핫스팟 전부 열람)한 도자기 */
  studied: string[]
  /** 퀴즈로 맞힌 도자기 */
  quizzed: string[]
  /** 오답노트 */
  wrong: string[]
  /** A-ha 지표: 첫 도자기를 360도 돌려 봤는가 */
  rotatedFullTurn: boolean
  quizBest: number
}

interface Store extends Progress {
  openHotspot: (potteryId: string, hotspotId: string, total: number) => void
  markRotated: () => void
  markQuizResult: (potteryId: string, correct: boolean) => void
  setQuizBest: (score: number) => void
  reset: () => void
  badgeOf: (potteryId: string) => BadgeTier
}

const initial: Progress = {
  opened: {},
  studied: [],
  quizzed: [],
  wrong: [],
  rotatedFullTurn: false,
  quizBest: 0,
}

const add = (arr: string[], v: string) => (arr.includes(v) ? arr : [...arr, v])

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,

      openHotspot: (potteryId, hotspotId, total) =>
        set((s) => {
          const opened = add(s.opened[potteryId] ?? [], hotspotId)
          const studied = opened.length >= total ? add(s.studied, potteryId) : s.studied
          return { opened: { ...s.opened, [potteryId]: opened }, studied }
        }),

      markRotated: () => set((s) => (s.rotatedFullTurn ? s : { rotatedFullTurn: true })),

      markQuizResult: (potteryId, correct) =>
        set((s) =>
          correct
            ? { quizzed: add(s.quizzed, potteryId), wrong: s.wrong.filter((w) => w !== potteryId) }
            : { wrong: add(s.wrong, potteryId) },
        ),

      setQuizBest: (score) => set((s) => (score > s.quizBest ? { quizBest: score } : s)),

      reset: () => set({ ...initial }),

      badgeOf: (potteryId) => {
        const s = get()
        const studied = s.studied.includes(potteryId)
        const quizzed = s.quizzed.includes(potteryId)
        if (studied && quizzed) return 'gold'
        if (studied || quizzed) return 'bronze'
        return 'none'
      },
    }),
    { name: 'pottery-timemachine-progress', version: 1 },
  ),
)

export const totalPottery = POTTERY.length

/** 갤러리 헤더용 집계 */
export function useCollectionStats() {
  const studied = useStore((s) => s.studied)
  const quizzed = useStore((s) => s.quizzed)
  const gold = POTTERY.filter((p) => studied.includes(p.id) && quizzed.includes(p.id)).length
  const bronze = POTTERY.filter(
    (p) => (studied.includes(p.id) || quizzed.includes(p.id)) && !(studied.includes(p.id) && quizzed.includes(p.id)),
  ).length
  return { gold, bronze, collected: gold + bronze, total: totalPottery }
}
