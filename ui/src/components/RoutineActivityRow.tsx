import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { ActivityEvent } from "@paperclipai/shared";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { getIntlLocale } from "@/i18n/formatters";
import type { TFunction } from "i18next";
import { statusLabel } from "@/i18n/status";

export type RoutineActivityEvent = Pick<ActivityEvent, "id" | "action" | "details" | "createdAt">;

function formatTime(value: string | Date, locale: string): string {
  try {
    return new Date(value).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(value);
  }
}

function runStatusLabel(status: unknown, t: TFunction): string {
  if (status === "issue_created") return t("operationsPage.routines.triggerList.status.taskCreated");
  if (status === "received") return t("agentSetupPage.routineSections.operate.activityRow.summary.runStatusReceived");
  if (status === "skipped") return t("agentSetupPage.routineSections.operate.activityRow.summary.runStatusSkipped");
  if (status === "coalesced") return t("agentSetupPage.routineSections.operate.activityRow.summary.runStatusCoalesced");
  return typeof status === "string" ? statusLabel(status, t) : "";
}

function summarizeEvent(event: RoutineActivityEvent, t: TFunction): string {
  const details = event.details;
  if (event.action === "routine.webhook_test_received") return t("agentSetupPage.routineSections.operate.activityRow.summary.connectionWorking");
  if (event.action === "routine.webhook_test_rejected") return t("agentSetupPage.routineSections.operate.activityRow.summary.updateKeyAndResend");
  if (event.action === "routine.webhook_received") return t("agentSetupPage.routineSections.operate.activityRow.summary.authenticationPassed");
  if (event.action === "routine.webhook_rejected") return t("agentSetupPage.routineSections.operate.activityRow.summary.checkSendingAppKey");
  if (!details) return "";
  if (typeof details.changeSummary === "string") return details.changeSummary;
  if (event.action === "routine.webhook_ignored" && details.reason === "event_not_subscribed") {
    return t("agentSetupPage.routineSections.operate.activityRow.summary.webhookEventNotSubscribed");
  }
  if (event.action === "routine.run_skipped") {
    const reasonKey = details.reason === "paused"
      ? "agentSetupPage.routineSections.operate.activityRow.summary.runSkippedPaused"
      : details.reason === "no_external_activity"
        ? "agentSetupPage.routineSections.operate.activityRow.summary.runSkippedNoActivity"
        : details.reason === "worktree_execution_cutoff"
          ? "agentSetupPage.routineSections.operate.activityRow.summary.runSkippedWorkspaceLimit"
          : null;
    return reasonKey ? t(reasonKey) : "";
  }
  if (event.action === "routine.run_triggered") {
    const sourceKey = details.source === "webhook"
      ? "agentSetupPage.routineSections.operate.activityRow.sources.webhook"
      : details.source === "schedule"
        ? "agentSetupPage.routineSections.operate.activityRow.sources.schedule"
        : "agentSetupPage.routineSections.operate.activityRow.sources.manual";
    const status = runStatusLabel(details.status, t);
    return [t(sourceKey), status].filter(Boolean).join(" · ");
  }
  return Object.entries(details).filter(([key]) => !/id$/i.test(key)).slice(0, 3)
    .map(([key, value]) => `${key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").toLowerCase()}: ${formatDetailValue(value)}`)
    .join(" · ");
}

function formatDetailValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.length === 0 ? "[]" : value.map(formatDetailValue).join(", ");
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

const actionLabelKeys: Record<string, string> = {
  "routine.webhook_test_received": "agentSetupPage.routineSections.operate.activityRow.actions.connectionTestPassed",
  "routine.webhook_test_rejected": "agentSetupPage.routineSections.operate.activityRow.actions.connectionTestRejected",
  "routine.webhook_received": "agentSetupPage.routineSections.operate.activityRow.actions.webhookEventReceived",
  "routine.webhook_rejected": "agentSetupPage.routineSections.operate.activityRow.actions.webhookAuthenticationFailed",
  "routine.webhook_ignored": "agentSetupPage.routineSections.operate.activityRow.actions.webhookEventIgnored",
  "routine.created": "agentSetupPage.routineSections.operate.activityRow.actions.routineCreated",
  "routine.updated": "agentSetupPage.routineSections.operate.activityRow.actions.routineUpdated",
  "routine.trigger_created": "agentSetupPage.routineSections.operate.activityRow.actions.triggerAdded",
  "routine.trigger_updated": "agentSetupPage.routineSections.operate.activityRow.actions.triggerUpdated",
  "routine.trigger_deleted": "agentSetupPage.routineSections.operate.activityRow.actions.triggerDeleted",
  "routine.trigger_removed": "agentSetupPage.routineSections.operate.activityRow.actions.triggerRemoved",
  "routine.trigger_restored": "agentSetupPage.routineSections.operate.activityRow.actions.triggerRestored",
  "routine.trigger_setup_finished": "agentSetupPage.routineSections.operate.activityRow.actions.webhookSetupFinished",
  "routine.trigger_secret_rotated": "agentSetupPage.routineSections.operate.activityRow.actions.webhookKeyReplaced",
  "routine.run_triggered": "agentSetupPage.routineSections.operate.activityRow.actions.routineStarted",
  "routine.run_skipped": "agentSetupPage.routineSections.operate.activityRow.actions.routineRunSkipped",
  "routine.run_created": "agentSetupPage.routineSections.operate.activityRow.actions.runCreated",
  "routine.revision_created": "agentSetupPage.routineSections.operate.activityRow.actions.revisionCreated",
  "routine.revision_restored": "agentSetupPage.routineSections.operate.activityRow.actions.revisionRestored",
  "routine.document_annotation_thread_created": "agentSetupPage.routineSections.operate.activityRow.actions.annotationThreadCreated",
  "routine.document_annotation_thread_reopened": "agentSetupPage.routineSections.operate.activityRow.actions.annotationThreadReopened",
  "routine.document_annotation_thread_resolved": "agentSetupPage.routineSections.operate.activityRow.actions.annotationThreadResolved",
  "routine.document_annotation_comment_added": "agentSetupPage.routineSections.operate.activityRow.actions.annotationCommentAdded",
  "routine.document_annotation_remapped": "agentSetupPage.routineSections.operate.activityRow.actions.annotationRemapped",
  "routine.origin_stamped": "agentSetupPage.routineSections.operate.activityRow.actions.routineOriginSet",
  "routine.origin_cleared": "agentSetupPage.routineSections.operate.activityRow.actions.routineOriginCleared",
};
function actionLabel(action: string, t: TFunction) {
  const key = actionLabelKeys[action];
  return key ? t(key) : action.replace(/^routine[._]/, "").replaceAll("_", " ").replaceAll(".", " ").replace(/^./, (char) => char.toUpperCase());
}

/** Activity log row with an expandable JSON payload (§3.7). */
export function RoutineActivityRow({ event }: { event: RoutineActivityEvent }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasPayload = event.details != null && Object.keys(event.details).length > 0;
  const eventLabel = actionLabel(event.action, t);
  const summary = summarizeEvent(event, t);

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        disabled={!hasPayload}
        aria-expanded={hasPayload ? expanded : undefined}
        onClick={() => setExpanded((value) => !value)}
        className={cn(
          "flex min-w-0 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs whitespace-nowrap",
          hasPayload ? "hover:bg-accent/30" : "cursor-default",
        )}
      >
        <span className="w-16 shrink-0 whitespace-nowrap font-mono tabular-nums text-muted-foreground">
          {formatTime(event.createdAt, getIntlLocale())}
        </span>
        <span title={eventLabel} className="min-w-0 max-w-1/2 shrink-0 truncate font-medium text-foreground">
          {eventLabel}
        </span>
        <span title={summary} className="min-w-0 flex-1 truncate text-muted-foreground">
          {summary}
        </span>
        {hasPayload ? (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
        ) : null}
      </button>
      {expanded && hasPayload ? (
        <pre className="mx-2 mb-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">
          {JSON.stringify(event.details, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
