import type { TFunction } from "i18next";

/**
 * Explicit machine-value → translation-key maps. Server values and stored enum
 * names never change; only the displayed label is localized. Unknown values
 * fall back to the machine value with separators replaced by spaces.
 */
const STATUS_LABEL_KEYS: Record<string, string> = {
  backlog: "status.backlog",
  todo: "status.todo",
  in_progress: "status.in_progress",
  in_review: "status.in_review",
  done: "status.done",
  blocked: "status.blocked",
  cancelled: "status.cancelled",
  idle: "status.idle",
  active: "status.active",
  running: "status.running",
  paused: "status.paused",
  error: "status.error",
  terminated: "status.terminated",
  pending: "status.pending",
  pending_approval: "status.pending_approval",
  queued: "status.queued",
  succeeded: "status.succeeded",
  failed: "status.failed",
  timed_out: "status.timed_out",
  planning: "status.planning",
  planned: "status.planned",
  approved: "status.approved",
  rejected: "status.rejected",
  revision_requested: "status.revision_requested",
  achieved: "status.achieved",
  on_track: "status.on_track",
  at_risk: "status.at_risk",
  off_track: "status.off_track",
  in_queue: "status.in_queue",
  waiting: "status.waiting",
  needs_setup: "status.needs_setup",
  archived: "status.archived",
};

const PRIORITY_LABEL_KEYS: Record<string, string> = {
  critical: "priority.critical",
  high: "priority.high",
  medium: "priority.medium",
  low: "priority.low",
};

export function statusLabel(status: string, t: TFunction): string {
  const key = STATUS_LABEL_KEYS[status];
  return key ? t(key) : status.replace(/[_-]/g, " ");
}

export function sentenceCaseStatusLabel(status: string, t: TFunction): string {
  const label = statusLabel(status, t);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function titleCaseStatusLabel(status: string, t: TFunction): string {
  return statusLabel(status, t).replace(/\b\w/g, (character) => character.toUpperCase());
}

export function priorityLabel(priority: string, t: TFunction): string {
  const key = PRIORITY_LABEL_KEYS[priority];
  return key ? t(key) : priority.replace(/[_-]/g, " ");
}
