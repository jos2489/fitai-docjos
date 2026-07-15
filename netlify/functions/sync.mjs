// Sincronizzazione cloud dei dati FitAi tramite Netlify Blobs.
// Nessun account/chiave: Blobs è disponibile in automatico nelle Netlify Functions.
// Il "codice" scelto dall'utente fa da chiave+password: chi ha il codice legge/scrive.
import { getStore } from '@netlify/blobs'

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } })

const cleanCode = (c) => String(c || '').replace(/[^A-Za-z0-9-]/g, '').toUpperCase()

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  let body
  try { body = await req.json() } catch { return json({ error: 'bad-json' }, 400) }

  const action = body?.action
  const code = cleanCode(body?.code)
  if (code.length < 6 || code.length > 40) return json({ error: 'invalid-code' }, 400)

  const store = getStore('fitai-sync')
  const key = 'v1/' + code

  if (action === 'pull') {
    const val = await store.get(key, { type: 'json' })
    if (!val) return json({ error: 'not-found' }, 404)
    return json({ data: val.data, updatedAt: val.updatedAt })
  }

  if (action === 'push') {
    const data = body?.data
    if (!data || typeof data !== 'object') return json({ error: 'no-data' }, 400)
    if (JSON.stringify(data).length > 5_000_000) return json({ error: 'too-large' }, 413)
    await store.setJSON(key, { data, updatedAt: Date.now() })
    return json({ ok: true, updatedAt: Date.now() })
  }

  return json({ error: 'bad-action' }, 400)
}
