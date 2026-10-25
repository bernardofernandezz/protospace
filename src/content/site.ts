// Dados do projeto e do autor: um único lugar para nome, links e URL pública.
// O LinkedIn só aparece no site quando `linkedin` estiver preenchido.

export const SITE = {
  /** URL pública (definida no build: VITE_SITE_URL ou o domínio de produção da Vercel). */
  url: import.meta.env.VITE_SITE_URL as string,
  name: 'Protospace',
  repo: 'https://github.com/bernardofernandezz/protospace',
  author: {
    name: 'Bernardo Fernandez',
    github: 'https://github.com/bernardofernandezz',
    linkedin: 'https://www.linkedin.com/in/bernardofernandezz',
  },
  stack: ['React', 'TypeScript', 'Three.js', 'React Three Fiber', 'GLSL', 'GSAP', 'Tailwind CSS v4', 'Vite'],
} as const
