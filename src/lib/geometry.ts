import * as THREE from 'three'
import type { Pottery } from '../data/pottery'

/** 실물 cm 프로필을 화면 단위로 줄이는 배율 */
const SCALE = 0.04

/**
 * 제어점 몇 개로 정의된 실루엣을 부드러운 곡선으로 보간한다.
 * 도자기는 물레로 뽑은 연속 곡면이라 각진 프로필은 티가 크게 난다.
 */
function smoothOutline(points: { r: number; y: number }[], segments: number) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p.r, p.y, 0)),
    false,
    'catmullrom',
    0.5,
  )
  return curve.getPoints(segments).map((v) => new THREE.Vector2(Math.max(v.x, 0.02), v.y))
}

/**
 * 외곽 실루엣에서 벽 두께가 있는 닫힌 프로필을 만든다.
 * 바깥면을 바닥 -> 아가리로 올라간 뒤, 안쪽면을 아가리 -> 바닥으로 내려오고,
 * 마지막에 시작점으로 되돌아가 굽 바닥까지 닫는다. (물이 안 새는 형태)
 */
export function buildLatheProfile(pottery: Pottery) {
  const outer = smoothOutline(pottery.profile, 96)
  const height = outer[outer.length - 1].y
  const thickness = Math.max(0.5, height * 0.022)
  const floor = thickness * 1.6

  const inner: THREE.Vector2[] = []
  for (let i = outer.length - 1; i >= 0; i--) {
    const p = outer[i]
    inner.push(new THREE.Vector2(Math.max(p.x - thickness, 0.02), Math.max(p.y, floor)))
  }

  // 시작점으로 되돌려 굽 바닥(고리 모양)을 닫는다.
  const profile = [...outer, ...inner, outer[0].clone()]
  return {
    points: profile.map((p) => new THREE.Vector2(p.x * SCALE, p.y * SCALE)),
    outerCount: outer.length,
  }
}

/**
 * LatheGeometry의 v좌표는 프로필 전체(바깥면+안쪽면)에 걸쳐 0..1로 퍼진다.
 * 무늬는 바깥면에만 그리므로, 바깥면이 v 0..1을 다 쓰도록 다시 매핑한다.
 * 안쪽면은 v=1로 눌러서 아가리 색을 그대로 이어받게 한다.
 */
export function remapOuterUV(geometry: THREE.BufferGeometry, outerCount: number, totalCount: number) {
  const uv = geometry.attributes.uv as THREE.BufferAttribute
  const span = (totalCount - 1) / (outerCount - 1)
  for (let i = 0; i < uv.count; i++) {
    uv.setY(i, Math.min(1, uv.getY(i) * span))
  }
  uv.needsUpdate = true
  return geometry
}

export function potteryHeight(pottery: Pottery) {
  return pottery.profile[pottery.profile.length - 1].y * SCALE
}

/** 주어진 높이에서의 바깥 반지름을 프로필에서 역산한다. (핫스팟을 표면에 붙이기 위함) */
export function radiusAt(pottery: Pottery, yFrac: number) {
  const pts = pottery.profile
  const total = pts[pts.length - 1].y
  const y = yFrac * total
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    if (y >= a.y && y <= b.y) {
      const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y)
      return (a.r + (b.r - a.r) * t) * SCALE
    }
  }
  return pts[pts.length - 1].r * SCALE
}

/** 핫스팟의 3D 좌표. 표면에서 살짝 띄워 도자기에 파묻히지 않게 한다. */
export function hotspotPosition(pottery: Pottery, yFrac: number, angleDeg: number, lift = 1.06) {
  const r = radiusAt(pottery, yFrac) * lift
  const a = (angleDeg * Math.PI) / 180
  const h = potteryHeight(pottery)
  return new THREE.Vector3(Math.sin(a) * r, yFrac * h, Math.cos(a) * r)
}

/**
 * 참외모양 병처럼 세로로 골이 진 형태를 만든다.
 * LatheGeometry 정점을 각도에 따라 반지름 방향으로 밀어 넣는다.
 */
export function applyLobes(geometry: THREE.BufferGeometry, lobes: number, depth = 0.12) {
  const pos = geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const r = Math.hypot(x, z)
    if (r < 1e-4) continue
    const theta = Math.atan2(z, x)
    // cos(lobes*theta)가 1일 때 골(안으로 들어감)
    const factor = 1 - depth * 0.5 * (1 + Math.cos(lobes * theta))
    pos.setX(i, (x / r) * r * factor)
    pos.setZ(i, (z / r) * r * factor)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}
