import { Job, JobStatus, VALID_TRANSITIONS } from './types'
// Two Maps: one for jobs, one for idempotency keys
// In production these would be Redis + Postgres
export const jobStore        = new Map<string, Job>()
export const idempotencyKeys = new Map<string, string>()  // key → jobId

export function saveJob(job: Job): Job {
    jobStore.set(job.id, { ...job, updatedAt: new Date() })
    return jobStore.get(job.id)!
  }

export function getJob(id: string): Job | undefined {
  return jobStore.get(id)
}

export function transitionJob(
  job: Job,
  to: JobStatus
): { ok: true; job: Job } | { ok: false; error: string } {
  if (!VALID_TRANSITIONS[job.status].includes(to)) {
    return {
      ok: false,
      error: `Cannot transition ${job.status} → ${to}`
    }
  }

  const next: Job = { ...job, status: to, updatedAt: new Date() }
  if (to === 'completed') next.completedAt = new Date()
  if (to === 'failed') next.failedAt = new Date()
  if (to === 'cancelled') next.cancelledAt = new Date()

  return { ok: true, job: saveJob(next) }
}

export function createJob(job: Omit<Job, 'updatedAt'>): Job {
  const toSave: Job = { ...job, updatedAt: new Date() }
  return saveJob(toSave)
}