import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'
import type { Quality } from '../store'
import { focus } from './timeline'

const CA_OFFSET = new THREE.Vector2(0.0007, 0.0005)

/** Pós-processamento por nível: baixo = bloom; médio = + SMAA, vinheta; alto = + AO, profundidade de campo, aberração. */
export default function Effects({ quality }: { quality: Quality }) {
  const dof = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    if (dof.current?.target) dof.current.target.copy(focus)
  })
  const high = quality === 'high'
  const low = quality === 'low'
  return (
    <EffectComposer key={quality} multisampling={0} enableNormalPass={false}>
      {high ? <N8AO halfRes aoRadius={1.4} intensity={2.2} distanceFalloff={1.2} /> : <></>}
      <Bloom mipmapBlur intensity={low ? 0.8 : 1.05} luminanceThreshold={0.62} luminanceSmoothing={0.22} radius={0.72} />
      {high ? <DepthOfField ref={dof} target={[0, 0, 0]} worldFocusRange={16} bokehScale={2.6} /> : <></>}
      {high ? <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.35} /> : <></>}
      {!low ? <Vignette offset={0.28} darkness={0.72} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {!low ? <SMAA /> : <></>}
    </EffectComposer>
  )
}
