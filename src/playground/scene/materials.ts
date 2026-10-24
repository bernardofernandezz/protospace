import * as THREE from 'three'

// Simplex noise 3D (Ashima Arts / Stefan Gustavson, MIT).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`

export interface OrganicOptions {
  color: THREE.ColorRepresentation
  rim?: THREE.ColorRepresentation
  opacity?: number
  amp?: number
  freq?: number
  speed?: number
  power?: number
  /** 0–1: filme fino iridescente (membranas). */
  irid?: number
}

/**
 * Superfície "orgânica": deslocamento por ruído (aspecto de superfície molecular), normal
 * recalculada no vertex shader, fresnel/rim e transparência mais forte no centro — o DNA
 * continua visível através da proteína.
 */
export function organicMaterial(o: OrganicOptions) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(o.color) },
      uRim: { value: new THREE.Color(o.rim ?? o.color) },
      uOpacity: { value: o.opacity ?? 0.5 },
      uAmp: { value: o.amp ?? 0.12 },
      uFreq: { value: o.freq ?? 1.6 },
      uSpeed: { value: o.speed ?? 0.12 },
      uPow: { value: o.power ?? 2.2 },
      uIrid: { value: o.irid ?? 0 },
      uGlow: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uAmp, uFreq, uTime, uSpeed;
      varying vec3 vN; varying vec3 vV; varying float vNoise;
      ${NOISE}
      float field(vec3 p){
        // relevo globular (domínios) + textura fina (resíduos)
        return 0.78*snoise(p*uFreq + vec3(uTime*uSpeed)) + 0.22*snoise(p*uFreq*3.1 - vec3(uTime*uSpeed*0.7));
      }
      void main(){
        vec3 n = normalize(normal);
        vec3 t = normalize(abs(n.y) < 0.99 ? cross(n, vec3(0.0,1.0,0.0)) : cross(n, vec3(1.0,0.0,0.0)));
        vec3 b = cross(n, t);
        float e = 0.02;
        float f0 = field(position);
        vec3 p0 = position + n * f0 * uAmp;
        vec3 p1 = position + t*e; p1 += normalize(normal + 0.0) * field(p1) * uAmp;
        vec3 p2 = position + b*e; p2 += normalize(normal + 0.0) * field(p2) * uAmp;
        vec3 dn = normalize(cross(p1 - p0, p2 - p0));
        if (dot(dn, n) < 0.0) dn = -dn;
        vNoise = f0;
        vec4 mv = modelViewMatrix * vec4(p0, 1.0);
        vV = -mv.xyz;
        vN = normalize(normalMatrix * dn);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor, uRim; uniform float uOpacity, uPow, uIrid, uGlow;
      varying vec3 vN; varying vec3 vV; varying float vNoise;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        float ndv = abs(dot(N, V));
        float fr = pow(1.0 - ndv, uPow);
        vec3 L = normalize(vec3(0.45, 0.8, 0.55));
        float lam = 0.45 + 0.55 * max(dot(N, L), 0.0);
        float spec = pow(max(dot(reflect(-L, N), V), 0.0), 24.0);
        // cavidades: o ruído escurece vales, clareia cristas
        float cav = 0.7 + 0.45 * vNoise;
        vec3 col = uColor * lam * cav * 0.55 + uRim * fr * (1.1 + 2.5 * uGlow) + vec3(spec) * 0.25;
        // filme fino: matiz deslizando com o ângulo de visão
        vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ndv * 1.4 + vNoise * 0.3));
        col = mix(col, col * 0.4 + irid * fr * 1.3, uIrid);
        float a = uOpacity * (0.28 + 0.72 * fr) + uGlow * 0.15;
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      }`,
  })
}

/**
 * MeshPhysicalMaterial em que a cor por instância/vértice também emite luz:
 * cores com valor > 1 brilham e ativam o bloom (destaques, mismatches, edições).
 */
export function glowingPhysical(params: THREE.MeshPhysicalMaterialParameters & { glow?: number }) {
  const { glow = 0.35, ...rest } = params
  const m = new THREE.MeshPhysicalMaterial(rest)
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = { value: glow }
    sh.fragmentShader =
      'uniform float uGlow;\n' +
      sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * uGlow;\n#endif',
      )
  }
  return m
}

let glowTex: THREE.Texture | null = null
/** Sprite radial suave gerado em canvas (partículas, halos). */
export function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}

/** Atualiza o relógio de todos os materiais orgânicos de um objeto. */
export function tickOrganic(root: THREE.Object3D, t: number) {
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
    if (m && m.uniforms?.uTime) m.uniforms.uTime.value = t
  })
}
