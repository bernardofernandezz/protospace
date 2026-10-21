import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { BASE_COLOR } from '../playground/colors'

const N = 72
const BASES = 'ACGT'

function Helix({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const { bones, rungs } = useMemo(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color()
    const sphere = new THREE.SphereGeometry(0.16, 14, 10)
    const cyl = new THREE.CylinderGeometry(0.05, 0.05, 1, 6)
    const bones = new THREE.InstancedMesh(sphere, new THREE.MeshStandardMaterial({ roughness: 0.3, emissive: '#0d4a52' }), N * 2)
    const rungs = new THREE.InstancedMesh(cyl, new THREE.MeshBasicMaterial({ toneMapped: false }), N)
    for (let i = 0; i < N; i++) {
      const y = (i - N / 2) * 0.34
      const th = i * ((2 * Math.PI) / 10.5)
      const a = new THREE.Vector3(Math.cos(th) * 1.3, y, Math.sin(th) * 1.3)
      const b = new THREE.Vector3(-a.x, y, -a.z)
      bones.setMatrixAt(i, m.makeTranslation(a)); bones.setColorAt(i, c.set('#3ef0d0'))
      bones.setMatrixAt(N + i, m.makeTranslation(b)); bones.setColorAt(N + i, c.set('#2a9df4'))
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
      rungs.setMatrixAt(i, m.compose(new THREE.Vector3(0, y, 0), q, new THREE.Vector3(1, 2.6, 1)))
      rungs.setColorAt(i, c.set(BASE_COLOR[BASES[(i * 7 + (i >> 2)) % 4]]))
    }
    return { bones, rungs }
  }, [])
  useFrame(({ pointer, clock }, dt) => {
    const g = group.current
    if (!still) g.rotation.y += dt * 0.25
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.35, 0.05)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0.55 - pointer.x * 0.3, 0.05)
    g.position.y = still ? 0 : Math.sin(clock.elapsedTime * 0.6) * 0.15
  })
  return (
    <group ref={group} rotation={[0, 0, 0.55]}>
      <primitive object={bones} />
      <primitive object={rungs} />
    </group>
  )
}

function Particles({ still }: { still: boolean }) {
  const ref = useRef<THREE.Points>(null!)
  const geo = useMemo(() => {
    const pos = new Float32Array(1400 * 3)
    for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * (i % 3 === 2 ? 30 : 50)
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3))
  }, [])
  useFrame(({ pointer }, dt) => {
    if (still) return
    ref.current.rotation.y += dt * 0.02
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, pointer.x * 0.8, 0.03)
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.06} color={'#9ff7ff'} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

export default function HeroHelix({ active, still }: { active: boolean; still: boolean }) {
  return (
    <Canvas frameloop={active ? 'always' : 'never'} camera={{ position: [0, 0, 16], fov: 45 }} dpr={[1, 1.5]} aria-hidden="true">
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 6, 8]} intensity={140} color={'#9feaff'} />
      <pointLight position={[-8, -4, 2]} intensity={90} color={'#c46bff'} />
      <group position={[3.2, 0, 0]}>
        <Helix still={still} />
      </group>
      <Particles still={still} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.5} />
      </EffectComposer>
    </Canvas>
  )
}
