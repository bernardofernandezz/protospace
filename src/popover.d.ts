// A API nativa de popover só entrou nos tipos do React 19; este projeto ainda usa o 18.
// Atributos em minúsculas para o React 18 repassá-los ao DOM sem avisos.
import 'react'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- assinatura precisa casar com a do React
  interface HTMLAttributes<T> {
    popover?: 'auto' | 'manual'
    popovertarget?: string
  }
}
