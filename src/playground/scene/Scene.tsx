import { useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls, PerformanceMonitor } from '@react-three/drei'
import { useDerived, useSim, type Quality } from '../store'
import Helix from './Helix'
import Cas9 from './Cas9'
import Repair from './Repair'
import Delivery from './Delivery'
import Nucleoplasm from './Nucleoplasm'
import CameraRig from './CameraRig'
import Explorer from './Explorer'
import Exhibits from './Exhibits'
import { PALETTE } from '../colors'
import Effects from './Effects'
import { takeCaptureRequest, untip } from './shared'
import type { Ready } from './timeline'
import { report } from '../../lib/monitor'

const DPR: Record<Quality, [number, number]> = { low: [1, 1], medium: [1, 1.5], high: [1, 2] }
const DOWN: Record<Quality, Quality> = { high: 'medium', medium: 'low', low: 'low' }

function Capture() {
  const gl = useThree((s) => s.gl)
  useFrame(() => {
    takeCaptureRequest()?.(gl.domElement.toDataURL('image/png'))
  }, 2)
  return null
}

function World({ quality }: { quality: Quality }) {
  const d = useDerived()
  const explore = useSim((s) => s.explore)
  if (!d.cand) return null
  const r = d as Ready
  return (
    <>
      <Nucleoplasm offs={r.offs} protospacer={r.cand.protospacer} quality={quality} />
      <Helix d={r} quality={quality} />
      <Cas9 d={r} quality={quality} />
      <Repair d={r} quality={quality} />
      <Delivery quality={quality} />
      <CameraRig d={r} />
      {explore && <Explorer d={r} quality={quality} />}
    </>
  )
}

export default function Scene({ active, onLost }: { active: boolean; onLost: () => void }) {
  const quality = useSim((s) => s.quality)
  const explore = useSim((s) => s.explore)
  useEffect(() => untip, [])
  // o mundo do Explorar monta oculto assim que o navegador fica ocioso (geometria + shaders prontos antes do 1º clique)
  const [warm, setWarm] = useState(false)
  useEffect(() => {
    if (warm) return
    const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1))
    const id = setTimeout(() => idle(() => setWarm(true)), explore ? 0 : 2500)
    return () => clearTimeout(id)
  }, [explore, warm])
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 8, 34], fov: 42, near: 0.1, far: 500 }}
      dpr={DPR[quality]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      onPointerMissed={untip}
      onCreated={({ gl, scene, camera }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); report(new Error('webglcontextlost')); onLost() })
        // checar erros de shader força compilação síncrona (travadas): só em desenvolvimento
        gl.debug.checkShaderErrors = import.meta.env.DEV
        // depuração de desempenho (renderer.info etc.), só em desenvolvimento
        if (import.meta.env.DEV) (window as unknown as { __three: unknown }).__three = { gl, scene, camera }
      }}
    >
      <fog attach="fog" args={['#04070f', 38, 150]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 8]} intensity={2.2} color={'#d6f4ff'} />
      <pointLight position={[-12, -6, -8]} intensity={90} color={'#b06bff'} />
      <pointLight position={[10, -4, 8]} intensity={45} color={'#3ef0d0'} />
      {/* luz da sonda do Explorar: sempre presente (intensidade 0 fora do modo) para não mudar o número
          de luzes da cena — isso recompilaria todos os materiais e travaria a entrada no modo */}
      <pointLight name="probe-light" intensity={0} distance={9} color={PALETTE.strand1} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#9feaff" position={[0, 6, -9]} scale={[12, 5, 1]} />
        <Lightformer form="ring" intensity={3} color="#ff4fa3" position={[-7, 2, 5]} scale={4} />
        <Lightformer form="rect" intensity={1.6} color="#b06bff" position={[9, -2, 2]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffffff" position={[0, -8, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      </Environment>
      <World quality={quality} />
      {warm && <Exhibits />}
      <OrbitControls makeDefault enabled={!explore} enableDamping dampingFactor={0.08} minDistance={4} maxDistance={110} />
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => { const s = useSim.getState(); if (s.qualityAuto && s.quality !== 'low') s.set({ quality: DOWN[s.quality] }) }}
      />
      <Effects quality={quality} />
      <Capture />
    </Canvas>
  )
}
