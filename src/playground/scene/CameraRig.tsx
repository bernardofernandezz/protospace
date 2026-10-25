import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import { prefersReducedMotion } from '../../lib/hooks'
import { useSim } from '../store'
import { casPose, centerAt, easeInOut, focus, frame, type Ready } from './timeline'

/**
 * Câmera por "planos": cada etapa define posição e alvo como função do progresso (órbita lenta,
 * mergulho na célula, travelling acompanhando a Cas9, close no corte…). Uma mola amortecida
 * suaviza as transições. Ao arrastar, o usuário assume; C ou trocar de etapa devolve o controle.
 */
export default function CameraRig({ d }: { d: Ready }) {
  const controls = useThree((s) => s.controls) as unknown as OrbitImpl | null
  const camera = useThree((s) => s.camera)
  const auto = useRef(true)
  const camTick = useSim((s) => s.camTick)
  const step = useSim((s) => s.step)
  useEffect(() => {
    auto.current = true
  }, [camTick, step])
  useEffect(() => {
    if (!controls) return
    const off = () => {
      auto.current = false
    }
    controls.addEventListener('start', off)
    return () => controls.removeEventListener('start', off)
  }, [controls])
  const still = useMemo(prefersReducedMotion, [])
  const goal = useMemo(() => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }), [])

  useFrame(({ clock }, dt) => {
    if (useSim.getState().explore) return // o Explorer pilota a câmera
    const { v, L } = frame(d)
    const { p } = v
    const c = v.cand
    const { pos, tgt, a, b } = goal
    const t = clock.elapsedTime
    switch (v.step) {
      case 0: {
        // órbita lenta em torno do alvo e do guia desenhado acima dele
        centerAt(L, c.start + 10, a)
        const ang = -0.35 + p * 0.45
        tgt.copy(a).add(b.set(0, 1.1, 0))
        pos.copy(a).add(b.set(Math.sin(ang) * 12, 2.8, Math.cos(ang) * 12))
        break
      }
      case 1: {
        // de fora da célula até o núcleo
        const e = easeInOut(p)
        pos.set(THREE.MathUtils.lerp(-6, 6, e), THREE.MathUtils.lerp(22, 5, e), THREE.MathUtils.lerp(82, 31, e))
        tgt.set(0, 0, 0)
        break
      }
      case 2: {
        // travelling com a Cas9 durante a busca; aproxima quando o R-loop se forma
        const cp = casPose(v, L)
        centerAt(L, c.start + 10, a)
        tgt.lerpVectors(cp.pos, a, 0.45)
        pos.copy(tgt).add(b.set(-3 + v.rloop * 2, 3.6 - v.rloop * 0.8, 15 - v.rloop * 3.5))
        break
      }
      case 3: {
        // close no sítio de corte
        centerAt(L, c.cut - 0.5, a)
        tgt.copy(a).add(b.set(0, -0.2, 0))
        pos.copy(a).add(b.set(2.6 - p * 1.2, 2.4, 13.5 - p * 2))
        break
      }
      case 4: {
        // reparo: mais aberto no HDR para mostrar o molde
        centerAt(L, Math.min(L.n - 1, c.cut), a)
        if (v.hdr) {
          tgt.copy(a).add(b.set(0, 1.6, 0))
          pos.copy(a).add(b.set(-1.5, 6.5, 15))
        } else {
          tgt.copy(a)
          pos.copy(a).add(b.set(-2.5 + p * 1.5, 3.4, 13))
        }
        break
      }
      default: {
        // resultado: plano geral com os off-targets ao fundo
        const ang = -0.15 + p * 0.3
        tgt.set(0, 2.5, -6)
        pos.set(Math.sin(ang) * 27, 7, Math.cos(ang) * 27)
      }
    }
    // respiração sutil de câmera na mão (o resto do movimento segue o play do usuário)
    if (!still) {
      pos.x += Math.sin(t * 0.37) * 0.12
      pos.y += Math.sin(t * 0.29) * 0.1
    }
    focus.copy(tgt)
    if (!auto.current || !controls) return
    const k = 1 - Math.exp(-dt * 2.4)
    camera.position.lerp(pos, k)
    controls.target.lerp(tgt, k)
    controls.update()
  })
  return null
}
