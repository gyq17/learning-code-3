import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

// -------------------------------------------------------
// YOUR TASK — Day 1
// -------------------------------------------------------
// Add a GET route at the path '/health'
// It should return a JSON response: { ok: true }
//
// Hints:
//   - use app.get('/your-path', (c) => { ... })
//   - use c.json({ ... }) to return JSON
//   - to test it, run: npm run dev
//     then open: http://localhost:3000/health
// -------------------------------------------------------

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running at http://localhost:3000')
})
