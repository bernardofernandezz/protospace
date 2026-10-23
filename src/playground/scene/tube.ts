import * as THREE from 'three'

/**
 * Tubo contínuo por uma sequência de pontos (Catmull-Rom), com buffers pré-alocados e
 * reescritos in-place a cada quadro. Raio e cor são definidos por ponto e interpolados,
 * o que permite afinar o tubo até zero (pontas de um corte, nick) sem recriar geometria.
 */
export class Tube {
  readonly geometry = new THREE.BufferGeometry()
  private pos: Float32Array
  private nor: Float32Array
  private col: Float32Array
  private samples: THREE.Vector3[]
  private tangents: THREE.Vector3[]
  private sub: number
  private radial: number
  private maxSamples: number

  constructor(maxPoints: number, sub = 4, radial = 10) {
    this.sub = sub
    this.radial = radial
    this.maxSamples = (maxPoints - 1) * sub + 1
    const nv = this.maxSamples * radial
    this.pos = new Float32Array(nv * 3)
    this.nor = new Float32Array(nv * 3)
    this.col = new Float32Array(nv * 3)
    this.samples = Array.from({ length: this.maxSamples }, () => new THREE.Vector3())
    this.tangents = Array.from({ length: this.maxSamples }, () => new THREE.Vector3())
    const idx: number[] = []
    for (let k = 0; k < this.maxSamples - 1; k++) {
      for (let r = 0; r < radial; r++) {
        const a = k * radial + r, b = k * radial + ((r + 1) % radial), c = a + radial, d = b + radial
        idx.push(a, c, b, b, c, d)
      }
    }
    this.geometry.setIndex(idx)
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage))
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
  }

  /**
   * @param pts pontos de controle (usa os `n` primeiros)
   * @param radius raio no ponto i, fração u ∈ [0,1) até o ponto i+1
   * @param color cor do ponto i (escrita em `out`)
   */
  update(pts: THREE.Vector3[], n: number, radius: (i: number, u: number) => number, color: (i: number, out: THREE.Color) => void) {
    const { sub, radial, samples: S, tangents: Tg } = this
    if (n < 2) { this.geometry.setDrawRange(0, 0); return }
    const m = (n - 1) * sub + 1
    // amostragem Catmull-Rom uniforme
    for (let k = 0; k < m; k++) {
      const i = Math.min(n - 2, Math.floor(k / sub))
      const u = k === m - 1 ? 1 : (k - i * sub) / sub
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)]
      const u2 = u * u, u3 = u2 * u
      const a = -0.5 * u3 + u2 - 0.5 * u, b = 1.5 * u3 - 2.5 * u2 + 1, c = -1.5 * u3 + 2 * u2 + 0.5 * u, d = 0.5 * u3 - 0.5 * u2
      S[k].set(p0.x * a + p1.x * b + p2.x * c + p3.x * d, p0.y * a + p1.y * b + p2.y * c + p3.y * d, p0.z * a + p1.z * b + p2.z * c + p3.z * d)
    }
    for (let k = 0; k < m; k++) Tg[k].subVectors(S[Math.min(m - 1, k + 1)], S[Math.max(0, k - 1)]).normalize()

    // referenciais por transporte paralelo (sem as torções bruscas de Frenet)
    const N = _n, B = _b
    N.set(0, 0, 1)
    if (Math.abs(Tg[0].dot(N)) > 0.9) N.set(0, 1, 0)
    N.addScaledVector(Tg[0], -N.dot(Tg[0])).normalize()
    const col = _c
    let ci = -1
    for (let k = 0; k < m; k++) {
      const T = Tg[k]
      N.addScaledVector(T, -N.dot(T)).normalize()
      B.crossVectors(T, N)
      const i = Math.min(n - 1, Math.floor(k / sub))
      const u = k === m - 1 ? 0 : (k - i * sub) / sub
      const r = radius(Math.min(i, n - 1), u)
      if (i !== ci) { color(i, col); ci = i }
      const P = S[k]
      for (let j = 0; j < radial; j++) {
        const ang = (j / radial) * Math.PI * 2
        const cx = Math.cos(ang), sy = Math.sin(ang)
        const nx = N.x * cx + B.x * sy, ny = N.y * cx + B.y * sy, nz = N.z * cx + B.z * sy
        const o = (k * radial + j) * 3
        this.pos[o] = P.x + nx * r; this.pos[o + 1] = P.y + ny * r; this.pos[o + 2] = P.z + nz * r
        this.nor[o] = nx; this.nor[o + 1] = ny; this.nor[o + 2] = nz
        this.col[o] = col.r; this.col[o + 1] = col.g; this.col[o + 2] = col.b
      }
    }
    this.geometry.setDrawRange(0, (m - 1) * radial * 6)
    for (const k of ['position', 'normal', 'color'] as const) {
      const attr = this.geometry.getAttribute(k) as THREE.BufferAttribute
      attr.clearUpdateRanges()
      attr.addUpdateRange(0, m * radial * 3)
      attr.needsUpdate = true
    }
  }

  dispose() { this.geometry.dispose() }
}

const _n = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color()

/** Afinamento de uma quebra entre os pontos `at-1` e `at`: raio → 0 no meio do intervalo. */
export const breakTaper = (i: number, u: number, at: number, amt: number) => {
  if (amt <= 0 || i !== at - 1) return 1
  return THREE.MathUtils.lerp(1, Math.abs(2 * u - 1) ** 0.45, Math.min(1, amt))
}
