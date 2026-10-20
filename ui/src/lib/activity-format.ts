import { t as translate } from "@/i18n";
import { priorityLabel, statusLabel } from "@/i18n/status";
import type { Agent } from "@paperclipai/shared";
import type { CompanyUserProfile } from "./company-members";
import { formatReviewPolicyValue } from "./review-policy";

type ActivityDetails = Record<string, unknown> | null | undefined;

type ActivityParticipant = {
  type: "agent" | "user";
  agentId?: string | null;
  userId?: string | null;
};

type ActivityIssueReference = {
  id?: string | null;
  identifier?: string | null;
  title?: string | null;
};

interface ActivityFormatOptions {
  agentMap?: Map<string, Agent>;
  userProfileMap?: Map<string, CompanyUserProfile>;
  currentUserId?: string | null;
}

const ACTIVITY_TEXT_KEYS: Record<string, string> = {
  "created": "activityText.p000",
  "updated": "activityText.p001",
  "read": "activityText.p002",
  "marked unread": "activityText.p003",
  "checked out": "activityText.p004",
  "released": "activityText.p005",
  "commented on": "activityText.p006",
  "cancelled a queued comment on": "activityText.p007",
  "edited a queued comment on": "activityText.p008",
  "reordered queued comments on": "activityText.p009",
  "discarded a queued comment on": "activityText.p010",
  "deleted a comment on": "activityText.p011",
  "attached file to": "activityText.p012",
  "removed attachment from": "activityText.p013",
  "created document for": "activityText.p014",
  "updated document on": "activityText.p015",
  "locked document on": "activityText.p016",
  "unlocked document on": "activityText.p017",
  "deleted document from": "activityText.p018",
  "scheduled monitor on": "activityText.p019",
  "triggered monitor for": "activityText.p020",
  "cleared monitor on": "activityText.p021",
  "skipped monitor for": "activityText.p022",
  "exhausted monitor on": "activityText.p023",
  "queued monitor recovery for": "activityText.p024",
  "created monitor recovery for": "activityText.p025",
  "escalated monitor for": "activityText.p026",
  "deleted": "activityText.p027",
  "flagged missing next step on": "activityText.p028",
  "recorded next step chosen on": "activityText.p029",
  "escalated missing next step on": "activityText.p030",
  "updated accepted-plan decomposition on": "activityText.p031",
  "opened a recovery action on": "activityText.p032",
  "resolved the recovery action on": "activityText.p033",
  "escalated the recovery action on": "activityText.p034",
  "paused": "activityText.p035",
  "resumed": "activityText.p036",
  "cleared error on": "activityText.p037",
  "terminated": "activityText.p038",
  "created API key for": "activityText.p039",
  "updated budget for": "activityText.p040",
  "reset session for": "activityText.p041",
  "invoked heartbeat for": "activityText.p042",
  "cancelled heartbeat for": "activityText.p043",
  "system-folded stale run on": "activityText.p044",
  "refused recovery-on-recovery for": "activityText.p045",
  "requested approval": "activityText.p046",
  "approved": "activityText.p047",
  "rejected": "activityText.p048",
  "asked for a decision on": "activityText.p049",
  "accepted the request on": "activityText.p050",
  "rejected the request on": "activityText.p051",
  "answered the request on": "activityText.p052",
  "withdrew the request on": "activityText.p053",
  "cancelled the request on": "activityText.p054",
  "skipped the request on": "activityText.p055",
  "expired the request on": "activityText.p056",
  "submitted verdicts on": "activityText.p057",
  "recorded a review verdict on": "activityText.p058",
  "reported cost for": "activityText.p059",
  "recorded cost for": "activityText.p060",
  "created organization": "activityText.p061",
  "updated organization": "activityText.p062",
  "archived": "activityText.p063",
  "reactivated": "activityText.p064",
  "exported the agent audit log for": "activityText.p065",
  "connected": "activityText.p066",
  "connected credentials for": "activityText.p067",
  "failed to connect credentials for": "activityText.p068",
  "finished credential access for": "activityText.p069",
  "finished setup for": "activityText.p070",
  "reconnected": "activityText.p071",
  "removed": "activityText.p072",
  "refreshed actions for": "activityText.p073",
  "changed agent installs for": "activityText.p074",
  "extended agent access for": "activityText.p075",
  "changed human access for": "activityText.p076",
  "added credentials to": "activityText.p077",
  "revoked credentials from": "activityText.p078",
  "delegated credentials for": "activityText.p079",
  "revoked credential delegation for": "activityText.p080",
  "created the issue": "activityText.p081",
  "updated the issue": "activityText.p082",
  "checked out the issue": "activityText.p083",
  "released the issue": "activityText.p084",
  "added a comment": "activityText.p085",
  "cancelled a queued comment": "activityText.p086",
  "edited a queued comment": "activityText.p087",
  "reordered queued comments": "activityText.p088",
  "discarded a queued comment": "activityText.p089",
  "deleted a comment": "activityText.p090",
  "saved feedback on an AI output": "activityText.p091",
  "added an attachment": "activityText.p092",
  "removed an attachment": "activityText.p093",
  "created a document": "activityText.p094",
  "updated a document": "activityText.p095",
  "locked a document": "activityText.p096",
  "unlocked a document": "activityText.p097",
  "deleted a document": "activityText.p098",
  "scheduled a monitor": "activityText.p099",
  "triggered a monitor": "activityText.p100",
  "cleared a monitor": "activityText.p101",
  "skipped a monitor": "activityText.p102",
  "exhausted a monitor": "activityText.p103",
  "queued a monitor recovery wake": "activityText.p104",
  "created a monitor recovery issue": "activityText.p105",
  "escalated a monitor to the board": "activityText.p106",
  "deleted the issue": "activityText.p107",
  "Run finished without a clear next step": "activityText.p108",
  "Next step chosen": "activityText.p109",
  "Run finished without a next step - recovery escalated": "activityText.p110",
  "hit the per-run cross-task write cap": "activityText.p111",
  "made a cross-task write": "activityText.p112",
  "tried to choose its own responsible user": "activityText.p113",
  "Opened a source-scoped recovery action": "activityText.p114",
  "Resolved the recovery action": "activityText.p115",
  "Escalated the recovery action": "activityText.p116",
  "updated the accepted-plan decomposition": "activityText.p117",
  "created an agent": "activityText.p118",
  "updated the agent": "activityText.p119",
  "paused the agent": "activityText.p120",
  "resumed the agent": "activityText.p121",
  "cleared the agent error": "activityText.p122",
  "terminated the agent": "activityText.p123",
  "invoked a heartbeat": "activityText.p124",
  "cancelled a heartbeat": "activityText.p125",
  "System folded a stale run": "activityText.p126",
  "Refused recovery-on-recovery escalation": "activityText.p127",
  "asked for a decision": "activityText.p128",
  "accepted the request": "activityText.p129",
  "rejected the request": "activityText.p130",
  "answered the request": "activityText.p131",
  "withdrew the request": "activityText.p132",
  "cancelled the request": "activityText.p133",
  "skipped the request": "activityText.p134",
  "expired the request": "activityText.p135",
  "submitted verdicts on the request": "activityText.p136",
  "recorded a review verdict": "activityText.p137",
  "started local AI sign-in": "activityText.p138",
  "cancelled local AI sign-in": "activityText.p139",
  "submitted a local AI sign-in code": "activityText.p140",
  "changed the default AI connection": "activityText.p141",
  "refreshed AI connection credentials": "activityText.p142",
  "failed AI connection authentication": "activityText.p143",
  "saved the AI connection pool": "activityText.p144",
  "deleted the AI connection pool": "activityText.p145",
  "selected an AI connection pool member": "activityText.p146",
};

function translateActivityPhrase(value: string | undefined): string | undefined {
  if (!value) return value;
  const key = ACTIVITY_TEXT_KEYS[value];
  return key ? translate(key) : value;
}

const ACTIVITY_ROW_VERBS: Record<string, string> = {
  "issue.created": "created",
  "issue.updated": "updated",
  "issue.read_marked": "read",
  "issue.read_unmarked": "marked unread",
  "issue.checked_out": "checked out",
  "issue.released": "released",
  "issue.comment_added": "commented on",
  "issue.comment_cancelled": "cancelled a queued comment on",
  "issue.queued_comment_edited": "edited a queued comment on",
  "issue.queued_comments_reordered": "reordered queued comments on",
  "issue.queued_comment_discarded": "discarded a queued comment on",
  "issue.comment_deleted": "deleted a comment on",
  "issue.attachment_added": "attached file to",
  "issue.attachment_removed": "removed attachment from",
  "issue.document_created": "created document for",
  "issue.document_updated": "updated document on",
  "issue.document_locked": "locked document on",
  "issue.document_unlocked": "unlocked document on",
  "issue.document_deleted": "deleted document from",
  "issue.monitor_scheduled": "scheduled monitor on",
  "issue.monitor_triggered": "triggered monitor for",
  "issue.monitor_cleared": "cleared monitor on",
  "issue.monitor_skipped": "skipped monitor for",
  "issue.monitor_exhausted": "exhausted monitor on",
  "issue.monitor_recovery_wake_queued": "queued monitor recovery for",
  "issue.monitor_recovery_issue_created": "created monitor recovery for",
  "issue.monitor_escalated_to_board": "escalated monitor for",
  "issue.commented": "commented on",
  "issue.deleted": "deleted",
  "issue.successful_run_handoff_required": "flagged missing next step on",
  "issue.successful_run_handoff_resolved": "recorded next step chosen on",
  "issue.successful_run_handoff_escalated": "escalated missing next step on",
  "issue.accepted_plan_decomposition_updated": "updated accepted-plan decomposition on",
  "issue.recovery_action_opened": "opened a recovery action on",
  "issue.recovery_action_resolved": "resolved the recovery action on",
  "issue.recovery_action_escalated": "escalated the recovery action on",
  "agent.created": "created",
  "agent.updated": "updated",
  "agent.paused": "paused",
  "agent.resumed": "resumed",
  "agent.error_cleared": "cleared error on",
  "agent.terminated": "terminated",
  "agent.key_created": "created API key for",
  "agent.budget_updated": "updated budget for",
  "agent.runtime_session_reset": "reset session for",
  "heartbeat.invoked": "invoked heartbeat for",
  "heartbeat.cancelled": "cancelled heartbeat for",
  "heartbeat.output_stale_source_resolved": "system-folded stale run on",
  "heartbeat.output_stale_recovery_recursion_refused": "refused recovery-on-recovery for",
  "approval.created": "requested approval",
  "approval.approved": "approved",
  "approval.rejected": "rejected",
  // Interaction outcomes (PAP-16506). An agent may now resolve one — including a
  // review of its own work — so these must read as outcomes in the feed instead
  // of falling through to the raw "issue thread interaction accepted" action id.
  // `details.interactionKind` sharpens the wording; see INTERACTION_OUTCOME_LABELS.
  "issue.thread_interaction_created": "asked for a decision on",
  "issue.thread_interaction_accepted": "accepted the request on",
  "issue.thread_interaction_rejected": "rejected the request on",
  "issue.thread_interaction_answered": "answered the request on",
  "issue.thread_interaction_withdrawn": "withdrew the request on",
  "issue.thread_interaction_cancelled": "cancelled the request on",
  "issue.thread_interaction_skipped": "skipped the request on",
  "issue.thread_interaction_expired": "expired the request on",
  "issue.thread_interaction_item_verdicts_submitted": "submitted verdicts on",
  "issue.stalled_review_decided": "recorded a review verdict on",
  "project.created": "created",
  "project.updated": "updated",
  "project.deleted": "deleted",
  "goal.created": "created",
  "goal.updated": "updated",
  "goal.deleted": "deleted",
  "cost.reported": "reported cost for",
  "cost.recorded": "recorded cost for",
  "company.created": "created organization",
  "company.updated": "updated organization",
  "company.archived": "archived",
  "company.reactivated": "reactivated",
  "company.budget_updated": "updated budget for",
  "audit.exported": "exported the agent audit log for",
  "tool_app.connected": "connected",
  "tool_app.oauth_connected": "connected credentials for",
  "tool_app.oauth_failed": "failed to connect credentials for",
  "tool_app.oauth_access_finalized": "finished credential access for",
  "tool_app.finished": "finished setup for",
  "tool_app.reconnected": "reconnected",
  "ai_connection.local_login_started": "started local AI sign-in",
  "ai_connection.local_login_cancelled": "cancelled local AI sign-in",
  "ai_connection.local_login_code_submitted": "submitted a local AI sign-in code",
  "ai_connection.default_changed": "changed the default AI connection",
  "ai_connection.connected": "connected",
  "ai_connection.reconnected": "reconnected",
  "ai_connection.credential_refreshed": "refreshed AI connection credentials",
  "ai_connection.authentication_failed": "failed AI connection authentication",
  "ai_connection.pool_saved": "saved the AI connection pool",
  "ai_connection.pool_deleted": "deleted the AI connection pool",
  "ai_connection.pool_selected": "selected an AI connection pool member",
  "tool_connection.created": "created",
  "tool_connection.updated": "updated",
  "tool_connection.archived": "removed",
  "tool_connection.catalog_refresh": "refreshed actions for",
  "tool_connection.installs_synced": "changed agent installs for",
  "tool_connection.install_access_extended": "extended agent access for",
  "tool_connection.grant_audience_replaced": "changed human access for",
  "tool_connection.grant_added": "added credentials to",
  "tool_connection.grant_revoked": "revoked credentials from",
  "tool_connection.grant_delegated": "delegated credentials for",
  "tool_connection.grant_delegation_revoked": "revoked credential delegation for",
};

const ISSUE_ACTIVITY_LABELS: Record<string, string> = {
  "issue.created": "created the issue",
  "issue.updated": "updated the issue",
  "issue.checked_out": "checked out the issue",
  "issue.released": "released the issue",
  "issue.comment_added": "added a comment",
  "issue.comment_cancelled": "cancelled a queued comment",
  "issue.queued_comment_edited": "edited a queued comment",
  "issue.queued_comments_reordered": "reordered queued comments",
  "issue.queued_comment_discarded": "discarded a queued comment",
  "issue.comment_deleted": "deleted a comment",
  "issue.feedback_vote_saved": "saved feedback on an AI output",
  "issue.attachment_added": "added an attachment",
  "issue.attachment_removed": "removed an attachment",
  "issue.document_created": "created a document",
  "issue.document_updated": "updated a document",
  "issue.document_locked": "locked a document",
  "issue.document_unlocked": "unlocked a document",
  "issue.document_deleted": "deleted a document",
  "issue.monitor_scheduled": "scheduled a monitor",
  "issue.monitor_triggered": "triggered a monitor",
  "issue.monitor_cleared": "cleared a monitor",
  "issue.monitor_skipped": "skipped a monitor",
  "issue.monitor_exhausted": "exhausted a monitor",
  "issue.monitor_recovery_wake_queued": "queued a monitor recovery wake",
  "issue.monitor_recovery_issue_created": "created a monitor recovery issue",
  "issue.monitor_escalated_to_board": "escalated a monitor to the board",
  "issue.deleted": "deleted the issue",
  "issue.successful_run_handoff_required": "Run finished without a clear next step",
  "issue.successful_run_handoff_resolved": "Next step chosen",
  "issue.successful_run_handoff_escalated": "Run finished without a next step - recovery escalated",
  "issue.cross_issue_influence_cap_rejected": "hit the per-run cross-task write cap",
  "issue.cross_issue_influence_observed": "made a cross-task write",
  "issue.attribution_spoof_rejected": "tried to choose its own responsible user",
  "issue.recovery_action_opened": "Opened a source-scoped recovery action",
  "issue.recovery_action_resolved": "Resolved the recovery action",
  "issue.recovery_action_escalated": "Escalated the recovery action",
  "issue.accepted_plan_decomposition_updated": "updated the accepted-plan decomposition",
  "agent.created": "created an agent",
  "agent.updated": "updated the agent",
  "agent.paused": "paused the agent",
  "agent.resumed": "resumed the agent",
  "agent.error_cleared": "cleared the agent error",
  "agent.terminated": "terminated the agent",
  "heartbeat.invoked": "invoked a heartbeat",
  "heartbeat.cancelled": "cancelled a heartbeat",
  "heartbeat.output_stale_source_resolved": "System folded a stale run",
  "heartbeat.output_stale_recovery_recursion_refused": "Refused recovery-on-recovery escalation",
  "approval.created": "requested approval",
  "approval.approved": "approved",
  "approval.rejected": "rejected",
  "issue.thread_interaction_created": "asked for a decision",
  "issue.thread_interaction_accepted": "accepted the request",
  "issue.thread_interaction_rejected": "rejected the request",
  "issue.thread_interaction_answered": "answered the request",
  "issue.thread_interaction_withdrawn": "withdrew the request",
  "issue.thread_interaction_cancelled": "cancelled the request",
  "issue.thread_interaction_skipped": "skipped the request",
  "issue.thread_interaction_expired": "expired the request",
  "issue.thread_interaction_item_verdicts_submitted": "submitted verdicts on the request",
  "issue.stalled_review_decided": "recorded a review verdict",
};

/**
 * `issue.stalled_review_decided` carries the verb the actor chose, so the line
 * names the verdict ("approved the review") rather than the generic action.
 * Mirrors `StalledReviewDecisionAction` in shared.
 */
const STALLED_REVIEW_DECISION_LABELS: Record<string, string> = {
  approve: "approved the review",
  request_changes: "requested changes on the review",
  send_back: "sent the review back to work",
};

/**
 * `issue.thread_interaction_accepted` / `_rejected` fire for *every* interaction
 * kind, not only for a review. A task suggestion or a question is accepted, not
 * approved, so the kind on the event picks the verb. Kinds absent from a map
 * keep the neutral "accepted the request" wording from the tables above, which
 * is also the fallback for an event that carries no kind.
 */
const INTERACTION_ACCEPTED_LABELS: Record<string, string> = {
  request_confirmation: "approved the request",
  request_checkbox_confirmation: "approved the request",
  suggest_tasks: "accepted the task suggestions",
  ask_user_questions: "accepted the answers",
};

const INTERACTION_REJECTED_LABELS: Record<string, string> = {
  request_confirmation: "rejected the request",
  request_checkbox_confirmation: "rejected the request",
  suggest_tasks: "declined the task suggestions",
  ask_user_questions: "declined the questions",
};

/**
 * Kind-aware wording for an interaction outcome, or `null` when the tables
 * above already say it well enough.
 */
function formatInteractionOutcomeLabel(action: string, details: ActivityDetails): string | null {
  const table = action === "issue.thread_interaction_accepted"
    ? INTERACTION_ACCEPTED_LABELS
    : action === "issue.thread_interaction_rejected"
      ? INTERACTION_REJECTED_LABELS
      : null;
  if (!table) return null;
  const kind = typeof details?.interactionKind === "string" ? details.interactionKind : null;
  return kind ? table[kind] ?? null : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isActivityParticipant(value: unknown): value is ActivityParticipant {
  const record = asRecord(value);
  if (!record) return false;
  return record.type === "agent" || record.type === "user";
}

function isActivityIssueReference(value: unknown): value is ActivityIssueReference {
  return asRecord(value) !== null;
}

function readParticipants(details: ActivityDetails, key: string): ActivityParticipant[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityParticipant);
}

function readIssueReferences(details: ActivityDetails, key: string): ActivityIssueReference[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityIssueReference);
}

function formatUserLabel(userId: string | null | undefined, options: ActivityFormatOptions = {}): string {
  if (!userId || userId === "local-board") return translate("shell.account.board");
  if (options.currentUserId && userId === options.currentUserId) return "You";
  const profile = options.userProfileMap?.get(userId);
  if (profile) return profile.label;
  return `user ${userId.slice(0, 5)}`;
}

function formatParticipantLabel(participant: ActivityParticipant, options: ActivityFormatOptions): string {
  if (participant.type === "agent") {
    const agentId = participant.agentId ?? "";
    return options.agentMap?.get(agentId)?.name ?? "agent";
  }
  return formatUserLabel(participant.userId, options);
}

function formatIssueReferenceLabel(reference: ActivityIssueReference): string {
  if (reference.identifier) return reference.identifier;
  if (reference.title) return reference.title;
  if (reference.id) return reference.id.slice(0, 8);
  return "task";
}

function formatChangedEntityLabel(
  singular: string,
  plural: string,
  labels: string[],
): string {
  if (labels.length <= 0) return plural;
  if (labels.length === 1) return `${singular} ${labels[0]}`;
  return `${labels.length} ${plural}`;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function readStringArrayLength(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.filter((entry) => typeof entry === "string" && entry.length > 0).length;
}

function formatAcceptedPlanDecompositionDetail(details: ActivityDetails): string | null {
  if (!details) return null;
  const status = typeof details.status === "string" ? details.status : null;
  const requested = readNumber(details.requestedChildCount);
  const totalChildren = readStringArrayLength(details.childIssueIds);
  const newlyCreated = readStringArrayLength(details.newlyCreatedChildIssueIds);
  const reused = Math.max(0, totalChildren - newlyCreated);
  const parts: string[] = [];
  if (newlyCreated > 0) parts.push(`created ${newlyCreated} new`);
  if (reused > 0) parts.push(`reused ${reused} existing`);
  if (parts.length === 0 && requested !== null) parts.push(`${requested} requested`);
  const summary = parts.length > 0 ? parts.join(", ") : null;
  if (status === "completed" && summary) return `decomposition completed (${summary})`;
  if (status === "completed") return "decomposition completed";
  if (status === "in_flight" && summary) return `decomposition in flight (${summary})`;
  return summary;
}

function formatIssueUpdatedVerb(details: ActivityDetails): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  if (details.status !== undefined) {
    const from = previous.status;
    const status = details.status === "in_review" && details.externalConversationState === "waiting" ? "idle" : details.status;
    const to = statusLabel(String(status), translate);
    return from
      ? translate("activityText.issueChanges.statusVerbFromTo", { from: statusLabel(String(from), translate), to })
      : translate("activityText.issueChanges.statusVerbTo", { to });
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    return from
      ? translate("activityText.issueChanges.priorityVerbFromTo", {
          from: priorityLabel(String(from), translate),
          to: priorityLabel(String(details.priority), translate),
        })
      : translate("activityText.issueChanges.priorityVerbTo", { to: priorityLabel(String(details.priority), translate) });
  }
  return null;
}

function formatAssigneeName(details: ActivityDetails, options: ActivityFormatOptions): string | null {
  if (!details) return null;
  const agentId = details.assigneeAgentId;
  const userId = details.assigneeUserId;
  if (typeof agentId === "string" && agentId) {
    return options.agentMap?.get(agentId)?.name ?? translate("common.agent");
  }
  if (typeof userId === "string" && userId) {
    return formatUserLabel(userId, options);
  }
  return null;
}

function formatIssueUpdatedAction(details: ActivityDetails, options: ActivityFormatOptions = {}): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  const parts: string[] = [];

  if (details.status !== undefined) {
    const from = previous.status;
    const status = details.status === "in_review" && details.externalConversationState === "waiting" ? "idle" : details.status;
    const to = statusLabel(String(status), translate);
    parts.push(
      from
        ? translate("activityText.issueChanges.statusActionFromTo", { from: statusLabel(String(from), translate), to })
        : translate("activityText.issueChanges.statusActionTo", { to }),
    );
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    parts.push(
      from
        ? translate("activityText.issueChanges.priorityActionFromTo", {
            from: priorityLabel(String(from), translate),
            to: priorityLabel(String(details.priority), translate),
          })
        : translate("activityText.issueChanges.priorityActionTo", { to: priorityLabel(String(details.priority), translate) }),
    );
  }
  if (details.assigneeAgentId !== undefined || details.assigneeUserId !== undefined) {
    const assigneeName = formatAssigneeName(details, options);
    parts.push(assigneeName
      ? translate("activityText.issueChanges.assigneeSet", { name: assigneeName })
      : translate("activityText.issueChanges.assigneeCleared"));
  }
  if (details.reviewPolicy !== undefined) {
    // `null` is the default ("anyone can approve"), so it must not read as
    // "changed the review policy to none" (PAP-16506).
    parts.push(translate("activityText.issueChanges.reviewPolicy", {
      value: formatReviewPolicyValue(details.reviewPolicy),
    }));
  }
  if (details.title !== undefined) parts.push(translate("activityText.issueChanges.title"));
  if (details.description !== undefined) parts.push(translate("activityText.issueChanges.description"));

  return parts.length > 0 ? parts.join(", ") : null;
}

function formatStructuredIssueChange(input: {
  action: string;
  details: ActivityDetails;
  options: ActivityFormatOptions;
  forIssueDetail: boolean;
}): string | null {
  const details = input.details;
  if (!details) return null;

  if (input.action === "issue.blockers_updated") {
    const added = readIssueReferences(details, "addedBlockedByIssues").map(formatIssueReferenceLabel);
    const removed = readIssueReferences(details, "removedBlockedByIssues").map(formatIssueReferenceLabel);
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel("blocker", "blockers", added);
      return input.forIssueDetail ? `added ${changed}` : `added ${changed} to`;
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel("blocker", "blockers", removed);
      return input.forIssueDetail ? `removed ${changed}` : `removed ${changed} from`;
    }
    return input.forIssueDetail ? "updated blockers" : "updated blockers on";
  }

  if (input.action === "issue.reviewers_updated" || input.action === "issue.approvers_updated") {
    const added = readParticipants(details, "addedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const removed = readParticipants(details, "removedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const singular = input.action === "issue.reviewers_updated" ? "reviewer" : "approver";
    const plural = input.action === "issue.reviewers_updated" ? "reviewers" : "approvers";
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, added);
      return input.forIssueDetail ? `added ${changed}` : `added ${changed} to`;
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, removed);
      return input.forIssueDetail ? `removed ${changed}` : `removed ${changed} from`;
    }
    return input.forIssueDetail ? `updated ${plural}` : `updated ${plural} on`;
  }

  return null;
}

export function formatActivityVerb(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action.startsWith("tool_gateway.")) {
    const rawTool = typeof details?.tool === "string"
      ? details.tool
      : typeof details?.upstreamToolName === "string"
        ? details.upstreamToolName
        : "an app action";
    const tool = rawTool.replace(/[._-]+/g, " ");
    const isTest = details?.source === "test";
    if (action === "tool_gateway.call_completed") return `${isTest ? "tested" : "used"} ${tool} on`;
    if (action === "tool_gateway.call_allowed") return `${isTest ? "started a test of" : "was allowed to use"} ${tool} on`;
    if (action === "tool_gateway.call_denied") return `was blocked from using ${tool} on`;
    if (action === "tool_gateway.approval_requested") return `asked to use ${tool} on`;
    if (action === "tool_gateway.session_created") return "opened an app session for";
    if (action === "tool_gateway.session_rejected") return "was blocked from opening an app session for";
    if (action === "tool_gateway.discovery") return "discovered app actions for";
  }

  if (action === "issue.updated") {
    const issueUpdatedVerb = formatIssueUpdatedVerb(details);
    if (issueUpdatedVerb) return issueUpdatedVerb;
  }

  if (action === "issue.stalled_review_decided") {
    const decision = typeof details?.action === "string" ? details.action : null;
    const label = decision ? STALLED_REVIEW_DECISION_LABELS[decision] : null;
    if (label) return `${label} on`;
  }

  const outcomeLabel = formatInteractionOutcomeLabel(action, details);
  if (outcomeLabel) return `${outcomeLabel} on`;

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: false,
  });
  if (structuredChange) return structuredChange;

  return translateActivityPhrase(ACTIVITY_ROW_VERBS[action]) ?? action.replace(/[._]/g, " ");
}

export function formatIssueActivityAction(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action === "issue.updated") {
    const issueUpdatedAction = formatIssueUpdatedAction(details, options);
    if (issueUpdatedAction) return issueUpdatedAction;
  }

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: true,
  });
  if (structuredChange) return structuredChange;

  if (action === "issue.accepted_plan_decomposition_updated") {
    const detail = formatAcceptedPlanDecompositionDetail(details);
    if (detail) return detail;
  }

  if (action === "issue.stalled_review_decided") {
    const decision = typeof details?.action === "string" ? details.action : null;
    const label = decision ? STALLED_REVIEW_DECISION_LABELS[decision] : null;
    if (label) return label;
  }

  const outcomeLabel = formatInteractionOutcomeLabel(action, details);
  if (outcomeLabel) return outcomeLabel;

  if (action.startsWith("issue.monitor_") && details) {
    const serviceName = typeof details.serviceName === "string" && details.serviceName.trim()
      ? details.serviceName.trim()
      : null;
    const base = translateActivityPhrase(ISSUE_ACTIVITY_LABELS[action]) ?? action.replace(/[._]/g, " ");
    return serviceName ? `${base} for ${serviceName}` : base;
  }

  if (
    (
      action === "issue.document_created" ||
      action === "issue.document_updated" ||
      action === "issue.document_locked" ||
      action === "issue.document_unlocked" ||
      action === "issue.document_deleted"
    ) &&
    details
  ) {
    const key = typeof details.key === "string" ? details.key : "document";
    const title = typeof details.title === "string" && details.title ? ` (${details.title})` : "";
    return `${translateActivityPhrase(ISSUE_ACTIVITY_LABELS[action]) ?? action} ${key}${title}`;
  }

  return translateActivityPhrase(ISSUE_ACTIVITY_LABELS[action]) ?? action.replace(/[._]/g, " ");
}
