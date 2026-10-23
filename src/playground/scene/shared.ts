import type { ThreeEvent } from '@react-three/fiber'
import { useSim, type Quality } from '../store'

/** Resolução dos tubos por nível de qualidade: [subdivisões entre pontos, segmentos radiais]. */
export const TUBE_RES: Record<Quality, [number, number]> = { low: [2, 6], medium: [3, 8], high: [4, 12] }

export function tip(e: ThreeEvent<PointerEvent | MouseEvent>, title: string, body: string) {
  e.stopPropagation()
  useSim.getState().set({ tip: { title, body, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY } })
}
export const untip = () => useSim.getState().set({ tip: null })

/** Pedido de captura de imagem: atendido logo após o render do quadro (o buffer ainda é válido). */
let captureRequest: ((url: string) => void) | null = null
export const requestCapture = () => new Promise<string>((resolve) => { captureRequest = resolve })
export function takeCaptureRequest() {
  const r = captureRequest
  captureRequest = null
  return r
}

/** Entrada do modo Explorar (teclado e joystick escrevem; o Explorer lê): x direita, y cima, z frente. */
export const input = { x: 0, y: 0, z: 0, boost: false }
