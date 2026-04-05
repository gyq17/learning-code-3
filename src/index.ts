import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()
app.get('/health', async (c) => {
  try {return c.json({ ok: true })} catch (error) {
    return c.json({ ok: false }, 500)
  }
})

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running at http://localhost:3000')
})
