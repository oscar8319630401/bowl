import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Pottery } from '../data/pottery'

/** 화면에서 도자기가 차지할 목표 높이(월드 단위). 프로시저럴 모델과 눈높이를 맞춘다. */
export const TARGET_HEIGHT = 1.7

/**
 * 박물관 3D 스캔 모델은 단위·방향·원점이 제각각이다.
 * (mm 단위인 경우도 있고, 굽이 원점에 있지 않기도 하다)
 * 바닥을 y=0에, 중심축을 원점에 맞추고 목표 높이로 정규화한다.
 */
export function normalizeScan(source: THREE.Object3D, rotation?: [number, number, number]) {
  const root = source.clone(true)

  // 세우는 게 먼저다. 회전 전 좌표로 바닥/중심을 잡으면 엉뚱한 축을 기준으로 맞추게 된다.
  if (rotation) root.rotation.set(rotation[0], rotation[1], rotation[2])
  root.updateWorldMatrix(true, true)

  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)

  // 중심축(x,z)은 가운데로, 굽(y)은 0으로. position은 회전 뒤에 적용되므로 위 박스 기준이 맞다.
  root.position.set(-center.x, -box.min.y, -center.z)

  const wrapper = new THREE.Group()
  wrapper.add(root)
  wrapper.scale.setScalar(TARGET_HEIGHT / size.y)
  return wrapper
}

/**
 * 스캔 메시 표면 위의 점을 찾는다.
 * 중심축의 높이 y에서 바깥으로 광선을 쏴 처음 만나는 표면을 쓴다.
 * 프로필이 없는 실측 모델에도 핫스팟을 정확히 붙일 수 있다.
 */
export function surfacePoint(root: THREE.Object3D, yFrac: number, angleDeg: number, lift = 0.03) {
  const meshes: THREE.Mesh[] = []
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh)
  })

  // 레이캐스팅은 월드 행렬 기준이라 최신 상태여야 한다
  root.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(root)
  const y = THREE.MathUtils.lerp(box.min.y, box.max.y, yFrac)
  const a = (angleDeg * Math.PI) / 180
  const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)).normalize()

  // 바깥에서 축을 향해 쏘면 가장 바깥 표면을 먼저 맞는다 (안쪽 벽에 박히지 않음)
  const reach = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 2
  const origin = new THREE.Vector3(0, y, 0).addScaledVector(dir, reach)
  const ray = new THREE.Raycaster(origin, dir.clone().negate(), 0, reach * 2)
  const hits = ray.intersectObjects(meshes, true)

  if (hits.length) {
    // 표면에서 축 바깥쪽으로 lift만큼 띄워 도자기에 파묻히지 않게 한다
    return hits[0].point.clone().addScaledVector(dir, lift)
  }
  // 못 맞히면 바운딩박스 반지름으로 대충 붙인다
  const r = Math.max(Math.abs(box.max.x), Math.abs(box.max.z)) + lift
  return new THREE.Vector3(dir.x * r, y, dir.z * r)
}

export default function ScannedPottery({
  pottery,
  onReady,
}: {
  pottery: Pottery
  onReady?: (root: THREE.Object3D) => void
}) {
  // BASE_URL을 붙여야 로컬(/)과 GitHub Pages(/bowl/) 양쪽에서 같은 데이터가 뜬다
  const { scene } = useGLTF(import.meta.env.BASE_URL + pottery.model!.url)
  const normalized = useMemo(
    () => normalizeScan(scene, pottery.model!.rotation),
    [scene, pottery.model],
  )

  useEffect(() => {
    normalized.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      const mat = m.material as THREE.MeshStandardMaterial
      if (mat) {
        // 스캔 텍스처에 이미 음영이 구워져 있어 반사를 세게 주면 떡이 진다
        mat.envMapIntensity = 0.55
        mat.roughness = Math.min(mat.roughness ?? 1, pottery.glaze === 'earthenware' ? 0.95 : 0.55)
        mat.side = THREE.FrontSide
        mat.needsUpdate = true
      }
    })
    onReady?.(normalized)
  }, [normalized, onReady, pottery.glaze])

  return <primitive object={normalized} />
}
