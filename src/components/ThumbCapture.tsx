import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { potteryById } from '../data/pottery'
import { buildLatheProfile, potteryHeight, remapOuterUV, applyLobes } from '../lib/geometry'
import { GLAZE, potteryTexture } from '../lib/textures'
import ScannedPottery, { TARGET_HEIGHT } from './ScannedPottery'

/**
 * 카드 썸네일용 오프스크린 렌더러. ?shot=<id>로 진입하면 뜬다.
 * 핫스팟·HUD 없이 도자기만 투명 배경에 담아, 퍼펫티어가 PNG로 저장한다.
 * 뷰어와 같은 지오메트리/텍스처를 써서 썸네일과 실물이 어긋나지 않는다.
 */

function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = env.texture
    return () => {
      env.texture.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function Procedural({ id }: { id: string }) {
  const pottery = potteryById(id)!
  const geometry = useMemo(() => {
    const { points, outerCount } = buildLatheProfile(pottery)
    const geo = new THREE.LatheGeometry(points, 160)
    remapOuterUV(geo, outerCount, points.length)
    if (pottery.lobes) applyLobes(geo, pottery.lobes, 0.16)
    geo.computeVertexNormals()
    return geo
  }, [pottery])
  const texture = useMemo(() => potteryTexture(pottery.glaze, pottery.pattern), [pottery])
  const g = GLAZE[pottery.glaze]
  useEffect(() => {
    // 지오메트리 준비 = 렌더 가능. 다음 프레임에 플래그를 세운다.
    const t = setTimeout(() => ((window as unknown as { __thumbReady: boolean }).__thumbReady = true), 250)
    return () => clearTimeout(t)
  }, [geometry])
  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        map={texture ?? undefined}
        color={texture ? '#ffffff' : g.base}
        roughness={g.roughness}
        metalness={g.metalness}
        clearcoat={g.clearcoat}
        clearcoatRoughness={0.12}
        side={THREE.DoubleSide}
        envMapIntensity={0.9}
      />
    </mesh>
  )
}

function Content({ id }: { id: string }) {
  const pottery = potteryById(id)!
  const height = pottery.model ? TARGET_HEIGHT : potteryHeight(pottery)
  const onReady = () =>
    setTimeout(() => ((window as unknown as { __thumbReady: boolean }).__thumbReady = true), 300)

  return (
    <>
      <Env />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 4]} intensity={1.5} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#bcd8ff" />
      <group position={[0, -height / 2, 0]}>
        {pottery.model ? (
          <Suspense fallback={null}>
            <ScannedPottery pottery={pottery} onReady={onReady} />
          </Suspense>
        ) : (
          <Procedural id={id} />
        )}
      </group>
    </>
  )
}

/** 카메라를 도자기 높이에 맞춰 자동으로 물러선다 */
function Rig({ id }: { id: string }) {
  const pottery = potteryById(id)!
  const height = pottery.model ? TARGET_HEIGHT : potteryHeight(pottery)
  const { camera } = useThree()
  useEffect(() => {
    // fov 34°에서 도자기 전체 높이가 프레임의 ~78%만 차지하도록 물러선다 (위아래 여백 확보).
    // 매병처럼 폭이 넓은 것도 잘리지 않게 넉넉히 잡는다.
    const dist = (height / 2) / Math.tan((34 * Math.PI) / 180 / 2) / 0.78
    camera.position.set(0, height * 0.06, dist)
    camera.lookAt(0, 0, 0)
  }, [camera, height])
  return null
}

export default function ThumbCapture({ id }: { id: string }) {
  const [exists] = useState(() => !!potteryById(id))
  // 투명 PNG를 얻으려면 캔버스 뒤가 전부 투명해야 한다. body 배경(#101314)을 걷어낸다.
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = 'transparent'
    return () => {
      document.body.style.background = prev
    }
  }, [])
  if (!exists) return <div>unknown pottery: {id}</div>
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent' }}>
      <Canvas
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        dpr={2}
        camera={{ fov: 34, position: [0, 0, 4] }}
      >
        <Rig id={id} />
        <Content id={id} />
        <OrbitControls enabled={false} />
      </Canvas>
    </div>
  )
}
