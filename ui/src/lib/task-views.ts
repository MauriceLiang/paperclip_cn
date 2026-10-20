import type { InboxTab } from "./inbox";

/**
 * The single view registry behind the merged Tasks surface (PAP-670).
 *
 * Inbox stopped being its own nav row and its five tabs became views inside
 * Tasks, alongside the status presets that used to live only inside the task
 * list's filter popover. Every view is addressed as `/issues?view=<key>`.
 *
 * Each view declares which surface renders it:
 *   - `inbox`  — the attention-ordered inbox list (unread state, archive,
 *                date groups, mixed approval/failed-run/join-request rows).
 *   - `issues` — the task collection list (board/list modes, filters, columns).
 *
 * Views are *not* reimplemented on the other surface: pointing a view at the
 * component that already owns those behaviours is what keeps them intact.
 */
export const TASK_VIEW_KEYS = [
  "mine",
  "unread",
  "blocked",
  "recent",
  "everything",
  "all",
  "active",
  "backlog",
  "done",
] as const;

export type TaskViewKey = (typeof TASK_VIEW_KEYS)[number];
export type TaskViewSurface = "inbox" | "issues";

export interface TaskView {
  key: TaskViewKey;
  label: string;
  labelKey: string;
  surface: TaskViewSurface;
  /** Which inbox tab renders this view (`inbox` surface only). */
  inboxTab?: InboxTab;
  /** Status filter applied on entry (`issues` surface only). */
  statuses?: string[];
  /** One-line description shown in the Views menu. */
  hint: string;
  hintKey: string;
}

export interface TaskViewGroup {
  label: string;
  labelKey: string;
  views: TaskView[];
}

export const TASK_VIEW_GROUPS: TaskViewGroup[] = [
  {
    label: "My work",
    labelKey: "taskViews.groups.myWork",
    views: [
      { key: "mine", label: "Mine", labelKey: "taskViews.views.mine", surface: "inbox", inboxTab: "mine", hint: "Assigned to you or waiting on you", hintKey: "taskViews.hints.mine" },
      { key: "unread", label: "Unread", labelKey: "taskViews.views.unread", surface: "inbox", inboxTab: "unread", hint: "Tasks you touched with new activity", hintKey: "taskViews.hints.unread" },
      { key: "blocked", label: "Blocked", labelKey: "taskViews.views.blocked", surface: "inbox", inboxTab: "blocked", hint: "Blocked tasks, grouped by blocker", hintKey: "taskViews.hints.blocked" },
      { key: "recent", label: "Recent", labelKey: "taskViews.views.recent", surface: "inbox", inboxTab: "recent", hint: "Everything you touched lately", hintKey: "taskViews.hints.recent" },
      { key: "everything", label: "Everything", labelKey: "taskViews.views.everything", surface: "inbox", inboxTab: "all", hint: "Tasks, approvals, failed runs and join requests", hintKey: "taskViews.hints.everything" },
    ],
  },
  {
    label: "Organization",
    labelKey: "taskViews.groups.organization",
    views: [
      { key: "all", label: "All tasks", labelKey: "taskViews.views.all", surface: "issues", statuses: [], hint: "Every task in the organization", hintKey: "taskViews.hints.all" },
      { key: "active", label: "Active", labelKey: "taskViews.views.active", surface: "issues", statuses: ["todo", "in_progress", "in_review", "blocked"], hint: "Open tasks, running or not", hintKey: "taskViews.hints.active" },
      { key: "backlog", label: "Backlog", labelKey: "taskViews.views.backlog", surface: "issues", statuses: ["backlog"], hint: "Not started yet", hintKey: "taskViews.hints.backlog" },
      { key: "done", label: "Done", labelKey: "taskViews.views.done", surface: "issues", statuses: ["done", "cancelled"], hint: "Completed and cancelled", hintKey: "taskViews.hints.done" },
    ],
  },
];

const VIEWS_BY_KEY = new Map<TaskViewKey, TaskView>(
  TASK_VIEW_GROUPS.flatMap((group) => group.views.map((view) => [view.key, view] as const)),
);

export const DEFAULT_TASK_VIEW: TaskViewKey = "mine";
export const TASK_VIEW_PARAM = "view";
export const TASK_LAST_VIEW_KEY = "paperclip:tasks:last-view";

export function isTaskViewKey(value: unknown): value is TaskViewKey {
  return typeof value === "string" && VIEWS_BY_KEY.has(value as TaskViewKey);
}

export function taskView(key: TaskViewKey): TaskView {
  return VIEWS_BY_KEY.get(key)!;
}

/** Resolves a `?view=` value, falling back to `null` so callers can pick a default. */
export function normalizeTaskViewKey(value: string | null | undefined): TaskViewKey | null {
  return isTaskViewKey(value) ? value : null;
}

export function taskViewPath(key: TaskViewKey): string {
  return `/issues?${TASK_VIEW_PARAM}=${key}`;
}

/** Inbox tab → view key, for redirecting the retired `/inbox/*` URLs. */
const VIEW_BY_INBOX_TAB: Record<InboxTab, TaskViewKey> = {
  mine: "mine",
  unread: "unread",
  blocked: "blocked",
  recent: "recent",
  all: "everything",
};

export function taskViewForInboxTab(tab: string | null | undefined): TaskViewKey {
  return (tab && tab in VIEW_BY_INBOX_TAB)
    ? VIEW_BY_INBOX_TAB[tab as InboxTab]
    : DEFAULT_TASK_VIEW;
}

export function loadLastTaskView(): TaskViewKey {
  try {
    return normalizeTaskViewKey(window.localStorage.getItem(TASK_LAST_VIEW_KEY)) ?? DEFAULT_TASK_VIEW;
  } catch {
    return DEFAULT_TASK_VIEW;
  }
}

export function saveLastTaskView(key: TaskViewKey): void {
  try {
    window.localStorage.setItem(TASK_LAST_VIEW_KEY, key);
  } catch {
    /* Navigation still works without storage; the default view just returns. */
  }
}

/**
 * Query params that only the organization task list understands. A deep link
 * carrying one of these (the dashboard's "assigned to me", a workspace
 * drill-in, a search hand-off) must not land on a My-work view, so it resolves
 * to `All tasks` instead of the user's last-used view.
 */
export const ORGANIZATION_SCOPED_PARAMS = [
  "assignee",
  "workspace",
  "participantAgentId",
  "q",
] as const;

/** Resolves which view a `/issues` visit opens. */
export function resolveInitialTaskView(
  requested: string | null,
  hasOrganizationScopedParam: boolean,
  lastUsed: TaskViewKey,
): TaskViewKey {
  const explicit = normalizeTaskViewKey(requested);
  // Inbox views can't apply organization filters, so a link carrying one
  // opens All tasks rather than silently dropping the filter.
  if (hasOrganizationScopedParam && (!explicit || taskView(explicit).surface === "inbox")) return "all";
  return explicit ?? lastUsed;
}
