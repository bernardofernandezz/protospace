import type { CSSProperties, ReactNode } from 'react'

/** Tamanho de projeto dos slides: o palco é desenhado em 1920×1080 e escalado para a tela. */
export const W = 1920
export const H = 1080

/** Moldura padrão: sobrelinha, título grande e o conteúdo ocupando o resto do slide. */
export function Frame({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden px-[120px] pb-[110px] pt-[84px]" data-frame>
      <p className="font-mono text-[22px] uppercase tracking-[0.3em] text-dna">{eyebrow}</p>
      <h2 className="mt-5 max-w-[1560px] font-display text-[68px] font-semibold leading-[1.05] tracking-tight">{title}</h2>
      <div className="mt-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

/** Cartão de vidro com filete de cor no topo. */
export function Card({ color, className = '', style, children }: { color?: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`glass rounded-[28px] p-9 ${className}`} style={{ ...(color ? { borderTop: `4px solid ${color}` } : null), ...style }}>
      {children}
    </div>
  )
}

/** Texto corrido do deck. */
export const P = ({ size = 28, className = '', children }: { size?: number; className?: string; children: ReactNode }) => (
  <p className={`leading-[1.45] text-mist ${className}`} style={{ fontSize: size }}>
    {children}
  </p>
)

/** Título de cartão. */
export const H3 = ({ size = 38, color, children }: { size?: number; color?: string; children: ReactNode }) => (
  <h3 className="font-display font-semibold leading-[1.15]" style={{ fontSize: size, color }}>
    {children}
  </h3>
)
