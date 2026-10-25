// Peças de interface compartilhadas entre os painéis e os controles do playground.
import type { ReactNode } from 'react'

/** Botão de um grupo de opções (cenário, nuclease, tipo de Cas, entrega, reparo). */
export function Seg({ children, on, cls, onClick, disabled }: { children: ReactNode; on: boolean; cls: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? cls : 'bg-white/5 text-mist hover:bg-white/10'}`}
    >
      {children}
    </button>
  )
}
