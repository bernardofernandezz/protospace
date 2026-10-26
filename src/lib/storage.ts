// O localStorage pode lançar (modo privado, cota cheia, armazenamento bloqueado). Nesses casos a leitura
// devolve o padrão e a escrita é ignorada: a preferência vale só nesta visita.

export function readText(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeText(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* sem armazenamento */
  }
}

/** Valor salvo como JSON, ou `fallback` se não houver, não der para ler ou não for JSON válido. */
export function readJSON<T>(key: string, fallback: T): T {
  const raw = readText(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown) {
  writeText(key, JSON.stringify(value))
}
