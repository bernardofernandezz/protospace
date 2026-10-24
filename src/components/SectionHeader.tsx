import type { ReactNode } from 'react'

export default function SectionHeader({ n, eyebrow, title, lead }: { n: string; eyebrow: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <header className="mb-14 md:mb-20" data-reveal>
      <p className="eyebrow">
        <span className="text-mist/60">{n} —</span> {eyebrow}
      </p>
      <h2 className="h2 mt-4 max-w-4xl">{title}</h2>
      {lead && <p className="lead mt-6">{lead}</p>}
    </header>
  )
}
