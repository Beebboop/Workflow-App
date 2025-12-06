export const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done'
} as const

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export const BOARD_TYPE = {
  KANBAN: 'kanban',
  SCRUM: 'scrum'
} as const

export const SPRINT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed'
} as const

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  COMMENT_ADDED: 'comment_added',
  SPRINT_STARTED: 'sprint_started',
  DEADLINE_APPROACHING: 'deadline_approaching'
} as const