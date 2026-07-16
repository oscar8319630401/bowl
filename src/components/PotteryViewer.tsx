import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Pottery } from '../data/pottery'
import { applyLobes, buildLatheProfile, hotspotPosition, potteryHeight, remapOuterUV } from '../lib/geometry'
import { GLAZE, potteryTexture } from '../lib/textures'
import ScannedPottery, { TARGET_HEIGHT, surfacePoint } from './ScannedPottery'
import { useStore } from '../lib/store'

/** RoomEnvironment로 환경맵을 만든다. 유약 광택은 반사가 있어야 산다. (네트워크 불필요) */
function StudioEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = env.texture
    return () => {
      env.texture.dispose()
      pmrem.dispose()
      scene.environment = null
    }
  }, [gl, scene])
  return null
}

function ProceduralPottery({ pottery }: { pottery: Pottery }) {
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

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
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

function Hotspot({
  pottery,
  spot,
  position,
  active,
  onSelect,
}: {
  pottery: Pottery
  spot: Pottery['hotspots'][number]
  position: THREE.Vector3
  active: boolean
  onSelect: () => void
}) {
  const opened = useStore((s) => (s.opened[pottery.id] ?? []).includes(spot.id))
  const ref = useRef<THREE.Mesh>(null)

  // 아직 안 열어 본 핫스팟만 반짝여서 "여길 눌러" 신호를 준다
  useFrame((state) => {
    if (!ref.current) return
    const pulse = opened ? 1 : 1 + Math.sin(state.clock.elapsedTime * 3.2 + spot.yFrac * 6) * 0.28
    ref.current.scale.setScalar(pulse)
  })

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[0.035, 20, 20]} />
        <meshBasicMaterial
          color={active ? '#fff2c0' : opened ? '#8fd6b4' : '#ffd76e'}
          toneMapped={false}
          transparent
          opacity={opened && !active ? 0.6 : 1}
        />
      </mesh>
      {/* 터치 판정을 넉넉히 (모바일) */}
      <mesh onClick={(e) => { e.stopPropagation(); onSelect() }} visible={false}>
        <sphereGeometry args={[0.1, 8, 8]} />
      </mesh>
      {active && (
        // distanceFactor를 크게 주면 툴팁이 화면을 뒤덮는다. 고정 크기로 띄운다.
        <Html center zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
          <div className="tooltip">
            <strong>{spot.title}</strong>
            <p>{spot.body}</p>
          </div>
        </Html>
      )}
    </group>
  )
}

/** OrbitControls 방위각 변화를 누적해 360도 회전(A-ha 지표)을 감지 */
function RotationTracker({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const markRotated = useStore((s) => s.markRotated)
  const done = useStore((s) => s.rotatedFullTurn)
  const acc = useRef(0)
  const last = useRef<number | null>(null)

  useFrame(() => {
    if (done || !controls.current) return
    const a = controls.current.getAzimuthalAngle()
    if (last.current !== null) {
      let d = a - last.current
      if (d > Math.PI) d -= Math.PI * 2
      if (d < -Math.PI) d += Math.PI * 2
      acc.current += Math.abs(d)
      if (acc.current >= Math.PI * 2) markRotated()
    }
    last.current = a
  })
  return null
}

function Scene({
  pottery,
  activeSpot,
  setActiveSpot,
  autoRotate,
}: {
  pottery: Pottery
  activeSpot: string | null
  setActiveSpot: (id: string | null) => void
  autoRotate: boolean
}) {
  const controls = useRef<OrbitControlsImpl>(null)
  const openHotspot = useStore((s) => s.openHotspot)
  const [scanRoot, setScanRoot] = useState<THREE.Object3D | null>(null)
  const stage = useRef<THREE.Group>(null)

  const height = pottery.model ? TARGET_HEIGHT : potteryHeight(pottery)

  // 스캔 모델은 프로필이 없으므로 메시 표면에 레이캐스팅해 핫스팟을 붙인다.
  // surfacePoint는 월드 좌표를 주는데 핫스팟은 stage 그룹의 자식이므로,
  // 그대로 쓰면 그룹의 -height/2 오프셋이 두 번 먹는다. 반드시 로컬로 변환한다.
  const spots = useMemo(() => {
    return pottery.hotspots.map((spot) => {
      if (pottery.model && scanRoot && stage.current) {
        const world = surfacePoint(scanRoot, spot.yFrac, spot.angleDeg)
        return { spot, position: stage.current.worldToLocal(world) }
      }
      return { spot, position: hotspotPosition(pottery, spot.yFrac, spot.angleDeg) }
    })
  }, [pottery, scanRoot])

  const onReady = useCallback((root: THREE.Object3D) => setScanRoot(root), [])

  return (
    <>
      <StudioEnvironment />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#bcd8ff" />
      <spotLight position={[0, 5, 3]} angle={0.6} penumbra={1} intensity={0.5} />

      <group ref={stage} position={[0, -height / 2, 0]} onPointerMissed={() => setActiveSpot(null)}>
        {pottery.model ? (
          <Suspense fallback={null}>
            <ScannedPottery pottery={pottery} onReady={onReady} />
          </Suspense>
        ) : (
          <ProceduralPottery pottery={pottery} />
        )}

        {/* 스캔 모델은 로드가 끝나야 표면 좌표를 알 수 있다 */}
        {(!pottery.model || scanRoot) &&
          spots.map(({ spot, position }) => (
            <Hotspot
              key={spot.id}
              pottery={pottery}
              spot={spot}
              position={position}
              active={activeSpot === spot.id}
              onSelect={() => {
                setActiveSpot(activeSpot === spot.id ? null : spot.id)
                openHotspot(pottery.id, spot.id, pottery.hotspots.length)
              }}
            />
          ))}

        <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={4} blur={2.4} far={2} />
      </group>

      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={1.6}
        maxDistance={6}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 1.9}
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
        enableDamping
        dampingFactor={0.08}
      />
      <RotationTracker controls={controls} />
    </>
  )
}

export default function PotteryViewer({ pottery }: { pottery: Pottery }) {
  const [activeSpot, setActiveSpot] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  // 개수만 뽑는다. `s.opened[id] ?? []`처럼 새 배열을 반환하면 매 렌더 새 참조가 되어
  // zustand가 무한 리렌더를 일으킨다.
  const openedCount = useStore((s) => (s.opened[pottery.id] ?? []).length)
  const rotated = useStore((s) => s.rotatedFullTurn)

  useEffect(() => setActiveSpot(null), [pottery.id])

  return (
    <div className="viewer">
      <Canvas
        shadows
        dpr={[1, 2]}
        // 도자기 전체가 화면에 들어오도록 넉넉히 물러선다 (이전엔 잘렸음)
        camera={{ position: [0, 0.5, 3.4], fov: 40 }}
        onPointerDown={() => setAutoRotate(false)}
        gl={{ antialias: true }}
      >
        <Scene pottery={pottery} activeSpot={activeSpot} setActiveSpot={setActiveSpot} autoRotate={autoRotate} />
      </Canvas>

      <div className="viewer-hud">
        <span className="hud-chip">
          핫스팟 {openedCount} / {pottery.hotspots.length}
        </span>
        {!rotated && <span className="hud-chip hud-hint">드래그해서 360° 돌려보세요</span>}
        <button className="hud-chip hud-btn" onClick={() => setAutoRotate((v) => !v)}>
          {autoRotate ? '자동회전 끄기' : '자동회전 켜기'}
        </button>
      </div>

      {pottery.model && <p className="scan-credit">{pottery.model.credit}</p>}
    </div>
  )
}
