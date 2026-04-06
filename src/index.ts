import { Hono, type Context } from 'hono'
import { serve } from '@hono/node-server'
import { randomUUID } from 'node:crypto'
import { SUPPORTED_TASKS, type Job } from './types'
import { createJob, getJob, idempotencyKeys, transitionJob, saveJob } from './store'

const app = new Hono()
app.get('/health', (c: Context) => {
  return c.json({ ok: true })
})

function isSupportedTask(task: unknown): task is (typeof SUPPORTED_TASKS)[number] {
  return typeof task === 'string' && (SUPPORTED_TASKS as readonly string[]).includes(task)
}

type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500
function jsonError(c: Context, status: HttpStatus, message: string, details?: unknown) {
  return c.json({ error: message, details }, status)
}

// Simple in-memory simulation of async job execution.
// In real life you’d enqueue to a queue and run workers separately.
const jobTimers = new Map<string, NodeJS.Timeout[]>()
function clearTimers(jobId: string) {
  const timers = jobTimers.get(jobId)
  if (!timers) return
  for (const t of timers) clearTimeout(t)
  jobTimers.delete(jobId)
}

function simulateExecution(jobId: string) {
  clearTimers(jobId)

  const t1 = setTimeout(() => {
    const job = getJob(jobId)
    if (!job) return
    if (job.status !== 'pending') return
    transitionJob(job, 'running')
  }, 50)

  const t2 = setTimeout(() => {
    const job = getJob(jobId)
    if (!job) return
    if (job.status !== 'running') return

    // Mock outcome: 20% fail rate for practice
    const shouldFail = Math.random() < 0.2
    if (shouldFail) {
      const failed = transitionJob(job, 'failed')
      if (failed.ok) {
        saveJob({ ...failed.job, error: { code: 'MOCK_DOWNSTREAM', message: 'Mock downstream failed' } })
      }
    } else {
      transitionJob(job, 'completed')
    }
  }, 250)

  jobTimers.set(jobId, [t1, t2])
}

app.post('/jobs', async (c: Context) => {
  let body: any
  try {
    body = await c.req.json()
  } catch {
    return jsonError(c, 400, 'Invalid JSON body')
  }

  const { task, data } = body ?? {}
  if (!isSupportedTask(task)) {
    return jsonError(c, 400, 'Unsupported or missing task', { supported: SUPPORTED_TASKS })
  }

  // Basic idempotency for create: caller can safely retry.
  const idemKey = c.req.header('Idempotency-Key')?.trim()
  if (idemKey) {
    const existingId = idempotencyKeys.get(idemKey)
    if (existingId) {
      const existingJob = getJob(existingId)
      if (existingJob) {
        return c.json(
          { id: existingJob.id, status: existingJob.status, retryCount: existingJob.retryCount, idempotent: true },
          200
        )
      }
      // If store was cleared but key remained, fall through and recreate.
    }
  }

  const now = new Date()
  const job: Omit<Job, 'updatedAt'> = {
    id: randomUUID(),
    task,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
    completedAt: undefined,
    failedAt: undefined,
    cancelledAt: undefined,
    lastRetriedAt: undefined,
    data,
    error: undefined
  }

  const saved = createJob(job)
  if (idemKey) idempotencyKeys.set(idemKey, saved.id)

  simulateExecution(saved.id)
  return c.json({ id: saved.id, status: saved.status, retryCount: saved.retryCount }, 201)
})
app.get('/jobs/:id', (c: Context) => {
  const id = c.req.param('id')
  if (!id) return jsonError(c, 400, 'Missing job id')
  const job = getJob(id)
  if (!job) return jsonError(c, 404, 'Job not found')
  return c.json({
    id: job.id,
    task: job.task,
    status: job.status,
    retryCount: job.retryCount,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    failedAt: job.failedAt,
    cancelledAt: job.cancelledAt,
    lastRetriedAt: job.lastRetriedAt,
    error: job.error
  })
})
app.post('/jobs/:id/cancel', (c: Context) => {
  const id = c.req.param('id')
  if (!id) return jsonError(c, 400, 'Missing job id')
  const job = getJob(id)
  if (!job) return jsonError(c, 404, 'Job not found')

  // Only pending or running can be cancelled
  if (job.status !== 'pending' && job.status !== 'running') {
    return jsonError(c, 409, 'Invalid state transition', {
      from: job.status,
      to: 'cancelled'
    })
  }

  const res = transitionJob(job, 'cancelled')
  if (!res.ok) return jsonError(c, 409, 'Invalid state transition', { message: res.error })
  clearTimers(id)
  return c.json({ id: res.job.id, status: res.job.status, retryCount: res.job.retryCount })
})

app.post('/jobs/:id/retry', (c: Context) => {
  const id = c.req.param('id')
  if (!id) return jsonError(c, 400, 'Missing job id')
  const job = getJob(id)
  if (!job) return jsonError(c, 404, 'Job not found')

  if (job.status !== 'failed') {
    return jsonError(c, 409, 'Invalid state transition', {
      from: job.status,
      to: 'pending'
    })
  }

  // Retry means "reset back to pending" and bump retryCount.
  const next: Job = {
    ...job,
    status: 'pending',
    retryCount: job.retryCount + 1,
    lastRetriedAt: new Date(),
    failedAt: undefined,
    completedAt: undefined,
    cancelledAt: undefined,
    error: undefined,
    updatedAt: new Date()
  }
  saveJob(next)
  simulateExecution(id)
  return c.json({ id: next.id, status: next.status, retryCount: next.retryCount })
})

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running at http://localhost:3000')
})
