import { t as translate } from "@/i18n";
export type {
  AskUserQuestionsAnswer,
  AskUserQuestionsInteraction,
  AskUserQuestionsPayload,
  AskUserQuestionsQuestion,
  AskUserQuestionsQuestionOption,
  AskUserQuestionsResult,
  ConnectionIntentInteraction,
  ConnectionIntentPayload,
  ConnectionIntentResult,
  IssueThreadInteraction,
  IssueThreadInteractionActorFields,
  IssueThreadInteractionBase,
  IssueThreadInteractionContinuationPolicy,
  IssueThreadInteractionStatus,
  RequestCheckboxConfirmationInteraction,
  RequestCheckboxConfirmationOption,
  RequestCheckboxConfirmationPayload,
  RequestCheckboxConfirmationResult,
  RequestConfirmationInteraction,
  RequestConfirmationIssueDocumentTarget,
  RequestConfirmationPayload,
  RequestConfirmationResult,
  RequestConfirmationSecretProposalPayload,
  RequestConfirmationSecretProposalResult,
  RequestConfirmationTarget,
  RequestConfirmationToolActionPayload,
  RequestConfirmationToolActionResult,
  RequestItemVerdictsInteraction,
  RequestItemVerdictsItem,
  RequestItemVerdictsPayload,
  RequestItemVerdictsResult,
  RequestItemVerdictsResultItem,
  RequestItemVerdictValue,
  SubmitIssueThreadInteractionVerdicts,
  SuggestedTaskDraft,
  SuggestTasksInteraction,
  SuggestTasksPayload,
  SuggestTasksResult,
  SuggestTasksResultCreatedTask,
} from "@paperclipai/shared";
import type {
  AskUserQuestionsAnswer,
  AskUserQuestionsInteraction,
  AskUserQuestionsQuestion,
  ConnectionIntentInteraction,
  IssueThreadInteraction,
  RequestCheckboxConfirmationPayload,
  RequestCheckboxConfirmationResult,
  RequestConfirmationInteraction,
  RequestConfirmationTarget,
  RequestItemVerdictsInteraction,
  RequestItemVerdictsPayload,
  RequestItemVerdictsResult,
  RequestItemVerdictValue,
  SuggestedTaskDraft,
  SuggestTasksInteraction,
  SuggestTasksResultCreatedTask,
} from "@paperclipai/shared";

export function isInteractionPreparingApproval(interaction: IssueThreadInteraction): boolean {
  return interaction.status === "pending"
    && interaction.acceptanceBlocker === "workspace_sync_pending";
}

/** Poll only while an approval is preparing; retain each surface's idle cadence. */
export function interactionReadinessRefetchInterval(
  interactions: IssueThreadInteraction[] | undefined,
  fallback: number | false = false,
): number | false {
  return interactions?.some(isInteractionPreparingApproval) ? 2_000 : fallback;
}

export interface SuggestedTaskTreeNode {
  task: SuggestedTaskDraft;
  children: SuggestedTaskTreeNode[];
}

/**
 * These takeovers already expose a deliberate non-accept path in their form.
 * Showing the composer's generic Skip beside Reject/Revise duplicates that
 * escape hatch and makes the action hierarchy ambiguous.
 */
export function interactionReplacesComposerSkip(
  interaction: IssueThreadInteraction,
): boolean {
  return interaction.kind === "request_confirmation"
    || interaction.kind === "request_checkbox_confirmation"
    || interaction.kind === "suggest_tasks";
}

export function isIssueThreadInteraction(
  value: unknown,
): value is IssueThreadInteraction {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<IssueThreadInteraction>;
  return typeof candidate.id === "string"
    && typeof candidate.companyId === "string"
    && typeof candidate.issueId === "string"
    && (
      candidate.kind === "suggest_tasks"
      || candidate.kind === "ask_user_questions"
      || candidate.kind === "request_confirmation"
      || candidate.kind === "request_checkbox_confirmation"
      || candidate.kind === "request_item_verdicts"
      || candidate.kind === "connection_intent"
    );
}

export interface ItemVerdictProgress {
  total: number;
  decided: number;
  approved: number;
  rejected: number;
  deferred: number;
  /** ids in payload order that still have no verdict. */
  pendingItemIds: string[];
}

/**
 * Derive the `M of N decided` progress for a per-item verdict interaction from
 * its payload (the full item roster) and result (verdicts accumulated so far).
 * Present-tense verdict values (`approve`/`reject`/`defer`) are what the server
 * stores in `result.items[].verdict` (see PAP-13247).
 */
export function getItemVerdictProgress(args: {
  payload: RequestItemVerdictsPayload;
  result?: RequestItemVerdictsResult | null;
}): ItemVerdictProgress {
  const { payload, result } = args;
  const resolvedById = new Map<string, RequestItemVerdictValue>(
    (result?.items ?? []).map((item) => [item.id, item.verdict] as const),
  );
  let approved = 0;
  let rejected = 0;
  let deferred = 0;
  const pendingItemIds: string[] = [];
  for (const item of payload.items) {
    const verdict = resolvedById.get(item.id);
    if (verdict === "approve") approved += 1;
    else if (verdict === "reject") rejected += 1;
    else if (verdict === "defer") deferred += 1;
    else pendingItemIds.push(item.id);
  }
  const decided = approved + rejected + deferred;
  return { total: payload.items.length, decided, approved, rejected, deferred, pendingItemIds };
}

export function buildItemVerdictsSummary(
  interaction: RequestItemVerdictsInteraction,
): string {
  const progress = getItemVerdictProgress({
    payload: interaction.payload,
    result: interaction.result,
  });
  if (interaction.status === "answered") {
    const parts = [translate("interactions.decided", { count: progress.decided })];
    if (progress.approved > 0) parts.push(translate("interactions.approved", { count: progress.approved }));
    if (progress.rejected > 0) parts.push(translate("interactions.rejected", { count: progress.rejected }));
    if (progress.deferred > 0) parts.push(translate("interactions.deferred", { count: progress.deferred }));
    return parts.join(" · ");
  }
  if (interaction.status === "expired") {
    const outcome = interaction.result?.outcome;
    if (outcome === "superseded_by_comment") return translate("interactions.verdictsExpiredAfterComment");
    if (outcome === "stale_target") return translate("interactions.verdictsExpiredAfterTarget");
    return translate("interactions.verdictsExpired");
  }
  return translate("interactions.decidedOfTotal", { decided: progress.decided, total: progress.total });
}

export function getCheckboxConfirmationSelectedLabels(args: {
  payload: RequestCheckboxConfirmationPayload;
  result?: RequestCheckboxConfirmationResult | null;
}): string[] {
  const { payload, result } = args;
  const selectedIds = result?.selectedOptionIds ?? [];
  const optionLabelById = new Map(
    payload.options.map((option) => [option.id, option.label] as const),
  );
  return selectedIds
    .map((optionId) => optionLabelById.get(optionId))
    .filter((label): label is string => typeof label === "string");
}

export function normalizeRequestConfirmationTargetHref(href: string) {
  const value = href.trim();
  if (value.startsWith("#")) return value;
  if (value.startsWith("/")) return value.startsWith("//") ? null : value;
  return /^https?:\/\//i.test(value) ? value : null;
}

export function getRequestConfirmationTargetHref({
  issueId,
  target,
}: {
  issueId: string;
  target: RequestConfirmationTarget;
}) {
  if (target.href) {
    const safeHref = normalizeRequestConfirmationTargetHref(target.href);
    if (safeHref) return safeHref;
  }
  if (target.type === "issue_document") {
    const targetIssueId = target.issueId ?? issueId;
    return `/issues/${targetIssueId}#document-${encodeURIComponent(target.key)}`;
  }
  return null;
}

export function buildIssueThreadInteractionSummary(
  interaction: IssueThreadInteraction,
) {
  const administrativeOutcome = interaction.result && "outcome" in interaction.result
    ? interaction.result.outcome
    : null;
  if (administrativeOutcome === "skipped") return translate("interactions.skipped");
  if (administrativeOutcome === "withdrawn") return translate("interactions.withdrawn");
  if (administrativeOutcome === "issue_closed") return translate("interactions.expiredIssueClosed");
  if (administrativeOutcome === "addressee_deleted") return translate("interactions.cancelledAddresseeDeleted");
  if (interaction.kind === "suggest_tasks") {
    const count = interaction.payload.tasks.length;
    if (interaction.status === "accepted") {
      const createdCount = interaction.result?.createdTasks?.length ?? 0;
      const skippedCount = interaction.result?.skippedClientKeys?.length ?? 0;
      if (skippedCount > 0) {
        return translate("interactions.acceptedTasksOf", { created: createdCount, total: count });
      }
      return translate("interactions.acceptedTasks", { count: createdCount });
    }
    if (interaction.status === "rejected") {
      return translate("interactions.rejectedTasks", { count });
    }
    return translate("interactions.suggestedTasks", { count });
  }

  if (interaction.kind === "request_confirmation") {
    if (interaction.status === "accepted") return translate("interactions.confirmedRequest");
    if (interaction.status === "rejected") {
      const rejectLabel = interaction.payload.rejectLabel?.trim();
      return rejectLabel ? translate("interactions.selectedOption", { label: rejectLabel }) : translate("interactions.declinedRequest");
    }
    if (interaction.status === "expired") {
      const outcome = interaction.result?.outcome;
      if (outcome === "superseded_by_comment") return translate("interactions.confirmationExpiredAfterComment");
      if (outcome === "stale_target") return translate("interactions.confirmationExpiredAfterTarget");
      return translate("interactions.confirmationExpired");
    }
    return translate("interactions.requestedConfirmation");
  }

  if (interaction.kind === "request_checkbox_confirmation") {
    const optionCount = interaction.payload.options.length;
    if (interaction.status === "accepted") {
      const selectedCount = interaction.result?.selectedOptionIds?.length ?? 0;
      if (selectedCount === 0) return translate("interactions.confirmedNoOptions");
      return translate("interactions.confirmedOptions", { selected: selectedCount, total: optionCount });
    }
    if (interaction.status === "rejected") return translate("interactions.declinedSelection");
    if (interaction.status === "expired") {
      const outcome = interaction.result?.outcome;
      if (outcome === "superseded_by_comment") return translate("interactions.selectionExpiredAfterComment");
      if (outcome === "stale_target") return translate("interactions.selectionExpiredAfterTarget");
      return translate("interactions.selectionExpired");
    }
    return translate("interactions.requestedSelection", { count: optionCount });
  }

  if (interaction.kind === "request_item_verdicts") {
    return buildItemVerdictsSummary(interaction);
  }

  if (interaction.kind === "connection_intent") {
    if (interaction.status === "accepted") return translate("interactions.serviceConnected", { service: interaction.payload.serviceName });
    if (interaction.status === "rejected") return translate("interactions.serviceDeclined", { service: interaction.payload.serviceName });
    if (interaction.status === "expired") {
      return interaction.result?.outcome === "superseded"
        ? translate("interactions.serviceRequestSuperseded", { service: interaction.payload.serviceName })
        : translate("interactions.serviceRequestExpired", { service: interaction.payload.serviceName });
    }
    return translate("interactions.connectService", { service: interaction.payload.serviceName });
  }

  const count = interaction.payload.questions.length;
  if (interaction.status === "answered") {
    return translate("interactions.answeredQuestions", { count });
  }
  if (interaction.status === "cancelled") {
    return translate("interactions.cancelledQuestions", { count });
  }
  if (interaction.status === "expired") {
    if (interaction.result?.expirationReason === "superseded_by_comment") {
      return translate("interactions.questionExpiredAfterComment", { count });
    }
    return translate("interactions.questionExpired", { count });
  }
  return translate("interactions.askedQuestions", { count });
}

/** Readable model input for a durable answer delivered into a successor run. */
export function buildAnsweredQuestionsDeliveryText(
  interaction: AskUserQuestionsInteraction,
): string {
  const questionSet = interaction.payload.questionSet;
  const legacyQuestionById = new Map(
    interaction.payload.questions.map((question) => [question.id, question] as const),
  );
  const canonicalQuestionById = new Map(
    (questionSet?.questions ?? []).map((question) => [question.id, question] as const),
  );
  const lines = (interaction.result?.answers ?? []).map((answer) => {
    const canonical = canonicalQuestionById.get(answer.questionId);
    const legacy = legacyQuestionById.get(answer.questionId);
    const optionLabels = new Map(
      (canonical?.options ?? legacy?.options ?? []).map((option) => [option.id, option.label] as const),
    );
    const values = answer.optionIds.map((optionId) => optionLabels.get(optionId) ?? optionId);
    if (answer.otherText?.trim()) values.push(answer.otherText.trim());
    const prompt = canonical?.prompt ?? legacy?.prompt ?? answer.questionId;
    const label = canonical?.header && canonical.header !== prompt
      ? `${canonical.header} — ${prompt}`
      : prompt;
    return `- ${label}: ${values.join(", ") || translate("interactions.noAnswer")}`;
  });
  return [translate("interactions.answeredQuestionsHeader"), ...(lines.length > 0 ? ["", ...lines] : [])].join("\n");
}

export function buildSuggestedTaskTree(
  tasks: readonly SuggestedTaskDraft[],
): SuggestedTaskTreeNode[] {
  const nodes = new Map<string, SuggestedTaskTreeNode>();
  for (const task of tasks) {
    nodes.set(task.clientKey, { task, children: [] });
  }

  const roots: SuggestedTaskTreeNode[] = [];
  for (const task of tasks) {
    const node = nodes.get(task.clientKey);
    if (!node) continue;
    const parentNode = task.parentClientKey ? nodes.get(task.parentClientKey) : null;
    if (parentNode) {
      parentNode.children.push(node);
      continue;
    }
    roots.push(node);
  }

  return roots;
}

export function countSuggestedTaskNodes(node: SuggestedTaskTreeNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countSuggestedTaskNodes(child), 0);
}

export function collectSuggestedTaskClientKeys(node: SuggestedTaskTreeNode): string[] {
  return [
    node.task.clientKey,
    ...node.children.flatMap((child) => collectSuggestedTaskClientKeys(child)),
  ];
}

export function getQuestionAnswerLabels(args: {
  question: AskUserQuestionsQuestion;
  answers: readonly AskUserQuestionsAnswer[];
}) {
  const { question, answers } = args;
  const answer = answers.find((candidate) => candidate.questionId === question.id);
  const selectedIds = answer?.optionIds ?? [];
  const optionLabelById = new Map(
    question.options.map((option) => [option.id, option.label] as const),
  );
  const labels = selectedIds
    .map((optionId) => optionLabelById.get(optionId))
    .filter((label): label is string => typeof label === "string");
  const otherText = answer?.otherText?.trim();
  if (otherText) labels.push(`Other: ${otherText}`);
  return labels;
}

/**
 * A single `ask_user_questions` question is degenerate when it offers *no way at
 * all* to answer — hiding it therefore strands nothing the user could have
 * resolved. Structural only, no semantic guessing about the wording:
 *
 *  - its `prompt` is empty / whitespace-only, OR
 *  - it presents nothing to respond to: no first-class free-text option (the
 *    PAP-419 `freeText` flag) AND no selectable fixed option.
 *
 * A question with even a single fixed option is answerable (the user selects it
 * and submits), so it is NOT degenerate and must keep rendering — otherwise a
 * hidden-but-pending interaction would strand the assignee waiting on a response
 * that can never arrive. Legitimate shapes all pass: yes/no, multi-select,
 * free-text, and single-option acknowledgements.
 */
function isDegenerateAskUserQuestion(question: AskUserQuestionsQuestion): boolean {
  if (question.prompt.trim().length === 0) return true;
  const hasFreeTextOption = question.options.some((option) => option.freeText === true);
  if (hasFreeTextOption) return false;
  const selectableOptionCount = question.options.filter(
    (option) => option.freeText !== true,
  ).length;
  return selectableOptionCount === 0;
}

/**
 * Structural render guard for `ask_user_questions` cards. A card is degenerate —
 * safe to never draw because it strands nothing the user could resolve — when it
 * offers no answerable question: it has zero questions, OR every question is
 * degenerate (see {@link isDegenerateAskUserQuestion}: blank prompt, or no
 * option and no free-text). A card with any answerable question — including a
 * single fixed option — always renders.
 *
 * UI-only: the interaction is still created and stored server-side (audit
 * intact); callers use this purely to decide whether to draw the card. Returns
 * false for any other interaction kind — the guard is scoped to
 * `ask_user_questions`.
 */
export function isDegenerateAskUserQuestions(
  interaction: IssueThreadInteraction,
): boolean {
  if (interaction.kind !== "ask_user_questions") return false;
  const questions = interaction.payload.questions;
  if (questions.length === 0) return true;
  return questions.every(isDegenerateAskUserQuestion);
}

/**
 * A stale sibling `ask_user_questions` that the server auto-expired when its own
 * creator posted a newer one on the same issue (PAP-437). The replacement card
 * is already in the thread, so this expired shell adds nothing and is never
 * drawn. Gated on `status === "expired"` so a still-pending card is never hidden
 * (PAP-424 / 00b136f45: hiding a pending question would strand the assignee).
 * Distinct from `superseded_by_comment`, which keeps its stale notice.
 */
export function isSupersededByNewerSiblingInteraction(
  interaction: IssueThreadInteraction,
): boolean {
  if (interaction.kind !== "ask_user_questions") return false;
  if (interaction.status !== "expired") return false;
  return interaction.result?.expirationReason === "superseded_by_newer_interaction";
}

/**
 * Single enforcement point for whether an interaction card should be suppressed
 * from every thread surface. Routing all render sites through this one predicate
 * keeps composition backbones and the card in lockstep, so a suppressed card
 * never leaves an empty slot in one place while another still draws it.
 */
export function shouldHideInteractionCard(
  interaction: IssueThreadInteraction,
): boolean {
  return (
    isDegenerateAskUserQuestions(interaction)
    || isSupersededByNewerSiblingInteraction(interaction)
  );
}
