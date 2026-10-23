import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Rótulo 3D com linha-guia: a ponta fica exatamente no ponto ancorado e o texto acima.
 * `at` escreve a posição do âncora a cada quadro e diz se o rótulo deve aparecer.
 */
export function Label({ at, tone = '#3ef0d0', children }: { at: (out: THREE.Vector3) => boolean; tone?: string; children: ReactNode }) {
  const g = useRef<THREE.Group>(null!)
  const el = useRef<HTMLDivElement>(null)
  const shown = useRef<boolean | null>(null)
  useFrame(() => {
    const vis = at(g.current.position)
    if (vis !== shown.current && el.current) {
      el.current.dataset.on = vis ? '1' : '0'
      shown.current = vis
    }
  })
  return (
    <group ref={g}>
      <Html zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={el} className="label3d" data-on="0" style={{ ['--tone' as string]: tone }} aria-hidden="true">
          <span className="label3d-text">{children}</span>
          <span className="label3d-line" />
          <span className="label3d-dot" />
        </div>
      </Html>
    </group>
  )
}
