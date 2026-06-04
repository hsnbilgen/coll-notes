// Tiny structured-line logger for ops-visible events (auth, ws connects).
// Format: [tag] event key=value key=value
// Designed to be greppable in Dokploy container logs.

type Fields = Record<string, string | number | boolean | undefined>

function fmt(tag: string, event: string, fields: Fields): string {
  const ts = new Date().toISOString()
  const parts: string[] = [ts, `[${tag}]`, event]
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === '') continue
    const s = String(v).replace(/\s+/g, '_')
    parts.push(`${k}=${s}`)
  }
  return parts.join(' ')
}

export const log = {
  auth(event: string, fields: Fields): void {
    console.log(fmt('auth', event, fields))
  },
  ws(event: string, fields: Fields): void {
    console.log(fmt('ws', event, fields))
  },
}
