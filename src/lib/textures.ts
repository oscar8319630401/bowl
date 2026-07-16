import * as THREE from 'three'
import type { Glaze, Pattern } from '../data/pottery'

/**
 * 도자기 표면 무늬를 캔버스에 절차적으로 그려 텍스처로 만든다.
 * 3D 에셋 없이 시대별 기법(빗살·인화·상감·음각·청화·철화)의 차이를 눈으로 구분시키는 게 목적이다.
 *
 * UV 규약: geometry.ts의 remapOuterUV() 덕분에 바깥면이 v 0..1을 전부 쓴다.
 * flipY(기본값 true) 때문에 캔버스 위쪽 = v 1 = 아가리, 아래쪽 = v 0 = 굽이다.
 */

const W = 1024
const H = 1024

export const GLAZE: Record<Glaze, { base: string; roughness: number; metalness: number; clearcoat: number }> = {
  earthenware: { base: '#a3714a', roughness: 0.92, metalness: 0, clearcoat: 0 },
  grayware: { base: '#7f8489', roughness: 0.72, metalness: 0.05, clearcoat: 0.1 },
  celadon: { base: '#6f9e86', roughness: 0.18, metalness: 0.02, clearcoat: 0.9 },
  buncheong: { base: '#9aa08d', roughness: 0.42, metalness: 0, clearcoat: 0.45 },
  porcelain: { base: '#f2eee2', roughness: 0.16, metalness: 0, clearcoat: 0.85 },
}

/** 가로로 감기는 텍스처라 가장자리에 걸친 무늬는 반대편에도 그려 줘야 이음매가 안 보인다. */
function wrapDraw(ctx: CanvasRenderingContext2D, x: number, fn: (ctx: CanvasRenderingContext2D) => void) {
  for (const dx of [x - W, x, x + W]) {
    ctx.save()
    ctx.translate(dx, 0)
    fn(ctx)
    ctx.restore()
  }
}

/** 굽는 과정에서 생기는 얼룩. 완벽하게 균일한 표면은 오히려 가짜처럼 보인다. */
function kilnMottle(ctx: CanvasRenderingContext2D, color: string, count: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  let seed = 20260715
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  for (let i = 0; i < count; i++) {
    const x = rnd() * W
    const y = rnd() * H
    const r = 20 + rnd() * 90
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function band(ctx: CanvasRenderingContext2D, y: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(0, y, W, h)
}

// ─────────────────────────── 무늬별 드로잉 ───────────────────────────

/** 빗살무늬: 아가리 쪽은 짧은 가로선, 몸통은 사선 빗질을 띠 단위로 반복 */
function drawComb(ctx: CanvasRenderingContext2D) {
  const ink = 'rgba(58,38,24,0.85)'
  ctx.strokeStyle = ink
  ctx.lineWidth = 3

  // 아가리(위쪽): 점열무늬
  for (let row = 0; row < 3; row++) {
    const y = 40 + row * 26
    for (let x = 8; x < W; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 9, y)
      ctx.stroke()
    }
  }

  // 몸통: 사선 빗질을 띠마다 방향을 바꿔 가며
  let y = 150
  let dir = 1
  while (y < H - 60) {
    const bandH = 120
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, y, W, bandH)
    ctx.clip()
    ctx.lineWidth = 2.5
    for (let x = -bandH; x < W + bandH; x += 16) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + dir * bandH, y + bandH)
      ctx.stroke()
    }
    ctx.restore()
    // 띠 구분선
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.moveTo(0, y + bandH)
    ctx.lineTo(W, y + bandH)
    ctx.stroke()
    y += bandH + 14
    dir *= -1
  }
}

/** 민무늬토기: 물레 자국만 아주 옅게 */
function drawPlain(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(70,48,32,0.10)'
  ctx.lineWidth = 2
  for (let y = 20; y < H; y += 17) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y + 2)
    ctx.stroke()
  }
}

/** 돌대: 어깨를 두른 가로 띠 */
function drawCordon(ctx: CanvasRenderingContext2D) {
  for (const y of [250, 300, 620]) {
    band(ctx, y, 10, 'rgba(40,44,48,0.35)')
    band(ctx, y + 10, 4, 'rgba(200,210,215,0.20)')
  }
  ctx.strokeStyle = 'rgba(50,55,60,0.12)'
  ctx.lineWidth = 2
  for (let y = 0; y < H; y += 14) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
}

/** 도장 하나(작은 꽃) */
function stampFlower(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.34, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

/** 인화문: 도장을 촘촘히 찍어 만든 무늬 (통일신라 토기 / 분청사기 공용) */
function drawStamped(ctx: CanvasRenderingContext2D, dotColor: string, lineColor: string) {
  let y = 120
  let row = 0
  while (y < H - 80) {
    if (row % 3 === 2) {
      // 구획선
      band(ctx, y, 6, lineColor)
      y += 34
    } else {
      const offset = row % 2 ? 26 : 0
      for (let x = offset; x < W; x += 52) {
        wrapDraw(ctx, x, (c) => stampFlower(c, 0, y, 17, dotColor))
      }
      y += 52
    }
    row++
  }
}

/** 학 한 마리 (상감 운학문용 단순화 도안) */
function crane(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, up: boolean) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, up ? s : -s)
  ctx.fillStyle = '#f4f2ea'
  ctx.strokeStyle = 'rgba(35,30,25,0.75)'
  ctx.lineWidth = 0.09

  // 몸통
  ctx.beginPath()
  ctx.ellipse(0, 0, 1.0, 0.42, -0.25, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // 목 + 머리
  ctx.beginPath()
  ctx.moveTo(0.6, -0.22)
  ctx.quadraticCurveTo(1.5, -0.9, 1.85, -1.35)
  ctx.lineWidth = 0.16
  ctx.strokeStyle = '#f4f2ea'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(1.9, -1.42, 0.17, 0, Math.PI * 2)
  ctx.fill()
  // 부리
  ctx.beginPath()
  ctx.moveTo(2.02, -1.46)
  ctx.lineTo(2.5, -1.6)
  ctx.lineWidth = 0.08
  ctx.stroke()
  // 날개
  ctx.beginPath()
  ctx.moveTo(0.1, -0.3)
  ctx.quadraticCurveTo(-0.5, -1.3, -1.5, -1.5)
  ctx.quadraticCurveTo(-0.6, -0.75, -0.35, -0.1)
  ctx.fillStyle = '#f4f2ea'
  ctx.fill()
  ctx.strokeStyle = 'rgba(35,30,25,0.6)'
  ctx.lineWidth = 0.07
  ctx.stroke()
  // 다리
  ctx.beginPath()
  ctx.moveTo(-0.5, 0.3)
  ctx.lineTo(-1.5, 0.95)
  ctx.moveTo(-0.35, 0.35)
  ctx.lineTo(-1.35, 1.1)
  ctx.lineWidth = 0.06
  ctx.strokeStyle = '#f4f2ea'
  ctx.stroke()
  ctx.restore()
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.strokeStyle = '#f4f2ea'
  ctx.lineWidth = 0.15
  ctx.beginPath()
  ctx.arc(0, 0, 0.55, Math.PI * 0.15, Math.PI * 1.75)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0.5, 0.2)
  ctx.quadraticCurveTo(1.5, 0.5, 2.4, -0.1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0.35, 0.5)
  ctx.quadraticCurveTo(1.3, 0.95, 2.1, 0.55)
  ctx.stroke()
  ctx.restore()
}

/** 상감 운학문: 원 안의 학은 올라가고, 원 밖의 학은 내려온다 (국보 68호) */
function drawInlayCrane(ctx: CanvasRenderingContext2D) {
  // 어깨 / 굽 여의두문 띠
  const ribbon = (y: number) => {
    band(ctx, y, 5, 'rgba(244,242,234,0.9)')
    for (let x = 0; x < W; x += 64) {
      wrapDraw(ctx, x, (c) => {
        c.fillStyle = 'rgba(244,242,234,0.9)'
        c.beginPath()
        c.moveTo(0, y + 5)
        c.quadraticCurveTo(16, y + 40, 32, y + 5)
        c.fill()
      })
    }
  }
  ribbon(70)
  ribbon(H - 150)

  // 몸통: 원 안 학 / 원 밖 학 교대 배치
  const rows = [
    { y: 340, offset: 0 },
    { y: 560, offset: 128 },
    { y: 780, offset: 0 },
  ]
  for (const { y, offset } of rows) {
    for (let i = 0; i < 4; i++) {
      const x = offset + i * 256 + 128
      wrapDraw(ctx, x, (c) => {
        // 원 안의 학 — 하늘로
        c.strokeStyle = 'rgba(244,242,234,0.95)'
        c.lineWidth = 5
        c.beginPath()
        c.arc(0, y, 72, 0, Math.PI * 2)
        c.stroke()
        crane(c, 0, y, 30, true)
      })
      wrapDraw(ctx, x + 128, (c) => {
        // 원 밖의 학 — 땅으로
        crane(c, 0, y + 96, 26, false)
        cloud(c, -46, y + 10, 30)
      })
    }
  }
}

/** 음각 연화당초문: 파낸 홈이라 유약 아래 그림자처럼만 보인다 */
function drawIncisedLotus(ctx: CanvasRenderingContext2D) {
  const line = 'rgba(30,60,50,0.30)'
  const glint = 'rgba(215,245,230,0.22)'

  const scroll = (yBase: number) => {
    for (let x = 0; x < W; x += 200) {
      wrapDraw(ctx, x, (c) => {
        // 넝쿨
        c.strokeStyle = line
        c.lineWidth = 7
        c.beginPath()
        c.moveTo(-40, yBase)
        c.bezierCurveTo(30, yBase - 90, 130, yBase + 90, 210, yBase)
        c.stroke()
        c.strokeStyle = glint
        c.lineWidth = 2.5
        c.beginPath()
        c.moveTo(-40, yBase + 4)
        c.bezierCurveTo(30, yBase - 86, 130, yBase + 94, 210, yBase + 4)
        c.stroke()

        // 연꽃
        c.save()
        c.translate(85, yBase - 20)
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2
          c.save()
          c.rotate(a)
          c.strokeStyle = line
          c.lineWidth = 6
          c.beginPath()
          c.ellipse(0, -30, 12, 30, 0, 0, Math.PI * 2)
          c.stroke()
          c.strokeStyle = glint
          c.lineWidth = 2
          c.beginPath()
          c.ellipse(0, -30, 12, 30, 0, 0, Math.PI * 2)
          c.stroke()
          c.restore()
        }
        c.restore()
      })
    }
  }
  scroll(330)
  scroll(620)

  // 굽 근처 연판문
  for (let x = 0; x < W; x += 74) {
    wrapDraw(ctx, x, (c) => {
      c.strokeStyle = line
      c.lineWidth = 6
      c.beginPath()
      c.moveTo(0, H - 40)
      c.quadraticCurveTo(37, H - 190, 74, H - 40)
      c.stroke()
    })
  }
}

/** 분청 인화문: 회색 바탕에 백토를 발라 도장 자국에만 흰 흙이 남는다 */
function drawBuncheong(ctx: CanvasRenderingContext2D) {
  // 백토 분장을 붓으로 쓸어 바른 자국
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = '#efeade'
  ctx.lineWidth = 26
  ctx.lineCap = 'round'
  for (let y = 30; y < H; y += 34) {
    ctx.beginPath()
    ctx.moveTo(-20, y + Math.sin(y * 0.05) * 6)
    ctx.bezierCurveTo(W * 0.3, y - 10, W * 0.7, y + 12, W + 20, y + Math.cos(y * 0.04) * 6)
    ctx.stroke()
  }
  ctx.restore()
  drawStamped(ctx, 'rgba(248,245,236,0.95)', 'rgba(248,245,236,0.75)')
}

/** 청화: 회회청(코발트)으로 그린 매화와 대나무 */
function drawBlueAndWhite(ctx: CanvasRenderingContext2D) {
  const blue = '#2d4d96'
  const paleBlue = 'rgba(45,77,150,0.45)'

  // 어깨/굽 종속문양 띠
  band(ctx, 90, 7, paleBlue)
  band(ctx, 112, 3, paleBlue)
  band(ctx, H - 130, 7, paleBlue)
  band(ctx, H - 108, 3, paleBlue)

  // 대나무
  for (const x of [140, 620]) {
    wrapDraw(ctx, x, (c) => {
      c.strokeStyle = blue
      c.lineWidth = 11
      c.beginPath()
      c.moveTo(0, 200)
      c.quadraticCurveTo(18, 500, 6, 800)
      c.stroke()
      // 마디
      c.lineWidth = 4
      for (let y = 250; y < 800; y += 90) {
        c.beginPath()
        c.moveTo(-12, y)
        c.lineTo(20, y)
        c.stroke()
      }
      // 잎
      c.fillStyle = blue
      for (let i = 0; i < 7; i++) {
        const y = 260 + i * 78
        const dir = i % 2 ? 1 : -1
        c.save()
        c.translate(8, y)
        c.rotate(dir * 0.7)
        c.beginPath()
        c.ellipse(dir * 55, 0, 52, 8, 0, 0, Math.PI * 2)
        c.fill()
        c.restore()
      }
    })
  }

  // 매화 가지
  for (const x of [380, 860]) {
    wrapDraw(ctx, x, (c) => {
      c.strokeStyle = blue
      c.lineWidth = 9
      c.beginPath()
      c.moveTo(-70, 820)
      c.bezierCurveTo(20, 640, -30, 430, 60, 220)
      c.stroke()
      c.lineWidth = 5
      c.beginPath()
      c.moveTo(-6, 560)
      c.quadraticCurveTo(70, 500, 120, 420)
      c.stroke()
      c.beginPath()
      c.moveTo(18, 400)
      c.quadraticCurveTo(-50, 340, -90, 300)
      c.stroke()

      // 꽃
      const blossom = (bx: number, by: number, r: number) => {
        c.fillStyle = 'rgba(255,255,255,0.9)'
        c.strokeStyle = blue
        c.lineWidth = 3.5
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2
          c.beginPath()
          c.arc(bx + Math.cos(a) * r * 0.72, by + Math.sin(a) * r * 0.72, r * 0.44, 0, Math.PI * 2)
          c.fill()
          c.stroke()
        }
        c.fillStyle = blue
        c.beginPath()
        c.arc(bx, by, r * 0.2, 0, Math.PI * 2)
        c.fill()
      }
      for (const [bx, by, r] of [
        [120, 415, 26],
        [60, 250, 24],
        [-90, 300, 22],
        [-2, 470, 20],
        [10, 640, 18],
      ] as const) {
        blossom(bx, by, r)
      }
    })
  }
}

/** 철화: 철 안료로 그린 포도 넝쿨. 구우면 짙은 갈색이 된다 */
function drawIronBrown(ctx: CanvasRenderingContext2D) {
  const iron = '#4a2c1a'
  const ironLight = 'rgba(74,44,26,0.55)'

  for (const x of [180, 560, 900]) {
    wrapDraw(ctx, x, (c) => {
      // 굵은 줄기
      c.strokeStyle = iron
      c.lineCap = 'round'
      c.lineWidth = 13
      c.beginPath()
      c.moveTo(-120, 180)
      c.bezierCurveTo(30, 330, -60, 560, 90, 760)
      c.stroke()

      // 덩굴손
      c.lineWidth = 4
      c.beginPath()
      c.moveTo(0, 320)
      for (let t = 0; t < 40; t++) {
        const a = t * 0.42
        c.lineTo(Math.cos(a) * (10 + t * 1.6) + 40, 320 + Math.sin(a) * (10 + t * 1.6) * 0.5 + t * 2.4)
      }
      c.stroke()

      // 잎
      const leaf = (lx: number, ly: number, s: number, rot: number) => {
        c.save()
        c.translate(lx, ly)
        c.rotate(rot)
        c.scale(s, s)
        c.fillStyle = ironLight
        c.beginPath()
        c.moveTo(0, 0)
        for (let i = 0; i <= 5; i++) {
          const a = -Math.PI * 0.5 + (i / 5) * Math.PI * 1.6
          const r = i % 2 ? 46 : 68
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r + 40)
        }
        c.closePath()
        c.fill()
        c.strokeStyle = iron
        c.lineWidth = 3
        c.stroke()
        c.restore()
      }
      leaf(-70, 300, 1, -0.4)
      leaf(120, 520, 0.85, 0.5)

      // 포도송이
      const bunch = (bx: number, by: number, s: number) => {
        c.fillStyle = iron
        const rows = [3, 4, 3, 2, 1]
        rows.forEach((n, r) => {
          for (let i = 0; i < n; i++) {
            const gx = bx + (i - (n - 1) / 2) * 26 * s
            const gy = by + r * 24 * s
            c.beginPath()
            c.arc(gx, gy, 13 * s, 0, Math.PI * 2)
            c.fill()
            c.fillStyle = 'rgba(255,255,255,0.22)'
            c.beginPath()
            c.arc(gx - 4 * s, gy - 4 * s, 4.5 * s, 0, Math.PI * 2)
            c.fill()
            c.fillStyle = iron
          }
        })
      }
      bunch(20, 400, 1)
      bunch(160, 620, 0.8)
    })
  }
}

// ─────────────────────────── 진입점 ───────────────────────────

const cache = new Map<string, THREE.CanvasTexture>()

export function potteryTexture(glaze: Glaze, pattern: Pattern): THREE.CanvasTexture | null {
  if (pattern === 'none' || pattern === 'melon') return null
  const key = `${glaze}:${pattern}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = GLAZE[glaze].base
  ctx.fillRect(0, 0, W, H)

  switch (pattern) {
    case 'comb':
      drawComb(ctx)
      kilnMottle(ctx, 'rgba(60,35,18,0.5)', 26, 0.5)
      break
    case 'plain':
      drawPlain(ctx)
      kilnMottle(ctx, 'rgba(60,35,18,0.5)', 30, 0.55)
      break
    case 'cordon':
      drawCordon(ctx)
      kilnMottle(ctx, 'rgba(30,40,50,0.6)', 24, 0.45)
      break
    case 'stamped':
      drawStamped(ctx, 'rgba(45,50,55,0.55)', 'rgba(45,50,55,0.4)')
      kilnMottle(ctx, 'rgba(30,40,50,0.6)', 20, 0.4)
      break
    case 'inlayCrane':
      drawInlayCrane(ctx)
      kilnMottle(ctx, 'rgba(20,70,55,0.5)', 18, 0.3)
      break
    case 'incisedLotus':
      drawIncisedLotus(ctx)
      kilnMottle(ctx, 'rgba(20,70,55,0.5)', 18, 0.3)
      break
    case 'buncheongStamped':
      drawBuncheong(ctx)
      kilnMottle(ctx, 'rgba(70,75,60,0.5)', 22, 0.35)
      break
    case 'blueAndWhite':
      drawBlueAndWhite(ctx)
      kilnMottle(ctx, 'rgba(120,120,100,0.35)', 14, 0.25)
      break
    case 'ironBrown':
      drawIronBrown(ctx)
      kilnMottle(ctx, 'rgba(120,110,90,0.35)', 14, 0.25)
      break
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  cache.set(key, tex)
  return tex
}
