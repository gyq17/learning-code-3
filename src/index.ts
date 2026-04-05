import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ ok: true })
})

// -------------------------------------------------------
// YOUR TASK — Day 2
// -------------------------------------------------------
// 1. Define a TypeScript interface called 'Task' with these fields:
//      id       - number
//      title    - string
//      done     - boolean
//
//    Put it above the app definition, or in a separate file
//    (src/types.ts) and import it — your choice.
//
// 2. Create a hardcoded array of 3 tasks, e.g.:
//      const tasks: Task[] = [ ... ]
//
// 3. Add a GET route at '/tasks' that returns the array as JSON.
//
// To test:
//   npm run dev → http://localhost:3000/tasks
//
// You should see something like:
//   [
//     { "id": 1, "title": "Learn TypeScript", "done": false },
//     { "id": 2, "title": "Build an API", "done": false },
//     { "id": 3, "title": "Ship it", "done": true }
//   ]
//
// BONUS (optional): What if someone hits GET /tasks and the
// list is empty? Should you return [] or something else?
// Think about what a good API contract looks like.
// -------------------------------------------------------

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running at http://localhost:3000')
})
