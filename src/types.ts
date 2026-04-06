export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Job {
  id: string
  task: string
  status: JobStatus
  retryCount: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  failedAt?: Date
  cancelledAt?: Date
  lastRetriedAt?: Date
  data?: unknown
  error?: unknown
}
export type ValidTransitions = {
    [key in JobStatus]: JobStatus[]
}

// state management
export const VALID_TRANSITIONS: ValidTransitions = {
  pending: ['running', 'cancelled'],
  running: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: ['pending'],
  cancelled: []
}

export const SUPPORTED_TASKS = ['resize_image', 'send_email', 'generate_report'] as const
