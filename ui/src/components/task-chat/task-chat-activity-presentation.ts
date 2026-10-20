import {
  AlertTriangle,
  BookOpen,
  Bot,
  Box,
  Clock3,
  Database,
  FileCheck2,
  FilePenLine,
  FileText,
  GitBranch,
  Info,
  ListChecks,
  PackageCheck,
  Search,
  ShieldCheck,
  TerminalSquare,
  Users,
} from "lucide-react";
import type {
  TaskChatMaterializedResourceItem,
  TaskChatProtocolItem,
  TaskChatProviderActivityItem,
  TaskChatWorkspaceChangeItem,
  TaskChatWorkspaceFileItem,
} from "./task-chat-model";
import {
  humanizeToolName,
  isGenericToolName,
  mcpToolIdentity,
  toolActivityPresentation,
  type ToolIcon,
} from "./tool-taxonomy";

export interface TaskChatActivityPresentation {
  icon: ToolIcon;
  runningLabel: string;
  completedLabel: string;
  failedLabel?: string;
  interruptedLabel?: string;
  runningKey?: string;
  completedKey?: string;
  failedKey?: string;
  interruptedKey?: string;
  detail?: string;
}

export function providerNoticeSeverity(item: TaskChatProviderActivityItem): "info" | "warning" | "error" {
  const severity = item.details.find((entry) => entry.label === "Severity")?.value;
  if (item.status === "failed" || severity === "error") return "error";
  return severity === "info" ? "info" : "warning";
}

function providerDetail(item: TaskChatProviderActivityItem, ...labels: string[]): string | undefined {
  return item.details.find((entry) => labels.includes(entry.label))?.value;
}

function meaningfulToolDetail(value: string | undefined): string | undefined {
  if (!value || isGenericToolName(value) || /^tool(?:\s+|_)call\b/i.test(value)) return undefined;
  return value;
}

export function providerActivityPresentation(item: TaskChatProviderActivityItem): TaskChatActivityPresentation {
  const detail = item.summary
    ?? providerDetail(item, "Query", "URL", "Target", "Name", "Reference", "Reason", "Summary");
  switch (item.family) {
    case "research": {
      const action = providerDetail(item, "Action")?.toLowerCase();
      if (action === "open_page") {
        return { icon: Search, runningLabel: "Opening a web page", completedLabel: "Opened a web page", failedLabel: "Couldn’t open the web page", interruptedLabel: "Stopped opening the web page", runningKey: "openingWebPage", completedKey: "openedWebPage", failedKey: "couldntOpenWebPage", interruptedKey: "stoppedOpeningWebPage", detail };
      }
      if (action === "find_in_page") {
        return { icon: Search, runningLabel: "Searching the page", completedLabel: "Searched the page", failedLabel: "Page search failed", interruptedLabel: "Page search stopped", runningKey: "searchingPage", completedKey: "searchedPage", failedKey: "pageSearchFailed", interruptedKey: "pageSearchStopped", detail };
      }
      return { icon: Search, runningLabel: "Searching the web", completedLabel: "Searched the web", failedLabel: "Web search failed", interruptedLabel: "Web search stopped", runningKey: "searchingWeb", completedKey: "searchedWeb", failedKey: "webSearchFailed", interruptedKey: "webSearchStopped", detail };
    }
    case "tool_execution": {
      const name = providerDetail(item, "Name");
      const target = providerDetail(item, "Target");
      const progress = providerDetail(item, "Progress");
      const tool = toolActivityPresentation({
        name,
        transport: providerDetail(item, "Transport"),
        namespace: providerDetail(item, "Namespace"),
        operation: providerDetail(item, "Operation"),
        target,
        progress,
      });
      const boundedActivity = meaningfulToolDetail(item.summary)
        ?? meaningfulToolDetail(progress)
        ?? meaningfulToolDetail(target);
      const activityIsIdentity = Boolean(
        boundedActivity && name && humanizeToolName(boundedActivity) === humanizeToolName(name),
      );
      const technicalName = name ? mcpToolIdentity(name)?.name ?? name : tool.displayName;
      const source = tool.sourceLabel
        ? `${tool.sourceLabel} · ${technicalName}`
        : name && !isGenericToolName(name) && humanizeToolName(name) !== tool.runningLabel.replace(/^Running /, "")
          ? name
          : undefined;
      return {
        icon: tool.icon,
        runningLabel: tool.runningLabel,
        completedLabel: tool.completedLabel,
        failedLabel: tool.failedLabel,
        interruptedLabel: tool.interruptedLabel,
        detail: [activityIsIdentity ? undefined : boundedActivity, source].filter(Boolean).join(" · ") || undefined,
      };
    }
    case "plan":
      return { icon: ListChecks, runningLabel: "Updating the plan", completedLabel: "Updated the plan", failedLabel: "Plan update failed", interruptedLabel: "Plan update stopped", runningKey: "updatingPlan", completedKey: "updatedPlan", failedKey: "planUpdateFailed", interruptedKey: "planUpdateStopped", detail };
    case "delegation": {
      const action = providerDetail(item, "Action")?.toLowerCase();
      if (action === "message") return { icon: Users, runningLabel: "Messaging a subagent", completedLabel: "Messaged a subagent", failedLabel: "Subagent message failed", interruptedLabel: "Subagent message stopped", runningKey: "messagingSubagent", completedKey: "messagedSubagent", failedKey: "subagentMessageFailed", interruptedKey: "subagentMessageStopped", detail };
      if (action === "resume") return { icon: Users, runningLabel: "Resuming a subagent", completedLabel: "Resumed a subagent", failedLabel: "Couldn’t resume the subagent", interruptedLabel: "Subagent resume stopped", runningKey: "resumingSubagent", completedKey: "resumedSubagent", failedKey: "couldntResumeSubagent", interruptedKey: "subagentResumeStopped", detail };
      if (action === "close") return { icon: Users, runningLabel: "Closing a subagent", completedLabel: "Closed a subagent", failedLabel: "Couldn’t close the subagent", interruptedLabel: "Subagent close stopped", runningKey: "closingSubagent", completedKey: "closedSubagent", failedKey: "couldntCloseSubagent", interruptedKey: "subagentCloseStopped", detail };
      if (action === "wait") return { icon: Users, runningLabel: "Waiting for subagents", completedLabel: "Finished waiting for subagents", failedLabel: "Subagent wait failed", interruptedLabel: "Stopped waiting for subagents", runningKey: "waitingForSubagents", completedKey: "finishedWaitingForSubagents", failedKey: "subagentWaitFailed", interruptedKey: "stoppedWaitingForSubagents", detail };
      return { icon: Users, runningLabel: "Starting a subagent", completedLabel: "Started a subagent", failedLabel: "Subagent start failed", interruptedLabel: "Subagent start stopped", runningKey: "startingSubagent", completedKey: "startedSubagent", failedKey: "subagentStartFailed", interruptedKey: "subagentStartStopped", detail };
    }
    case "model_identity":
      return item.eventType === "model.route.changed"
        ? { icon: Bot, runningLabel: "Switching models", completedLabel: "Switched models", failedLabel: "Model switch failed", interruptedLabel: "Model switch stopped", runningKey: "switchingModels", completedKey: "switchedModels", failedKey: "modelSwitchFailed", interruptedKey: "modelSwitchStopped", detail }
        : { icon: Bot, runningLabel: "Verifying the model", completedLabel: "Verified the model", failedLabel: "Model verification failed", interruptedLabel: "Model verification stopped", runningKey: "verifyingModel", completedKey: "verifiedModel", failedKey: "modelVerificationFailed", interruptedKey: "modelVerificationStopped", detail };
    case "context":
      return { icon: Database, runningLabel: "Compacting context", completedLabel: "Compacted context", failedLabel: "Context compaction failed", interruptedLabel: "Context compaction stopped", runningKey: "compactingContext", completedKey: "compactedContext", failedKey: "contextCompactionFailed", interruptedKey: "contextCompactionStopped", detail };
    case "artifact": {
      const viewed = item.eventType === "artifact.viewed";
      return viewed
        ? { icon: Box, runningLabel: "Viewing an artifact", completedLabel: "Viewed an artifact", failedLabel: "Couldn’t view the artifact", interruptedLabel: "Artifact view stopped", runningKey: "viewingArtifact", completedKey: "viewedArtifact", failedKey: "couldntViewArtifact", interruptedKey: "artifactViewStopped", detail }
        : { icon: Box, runningLabel: "Generating an artifact", completedLabel: "Generated an artifact", failedLabel: "Artifact generation failed", interruptedLabel: "Artifact generation stopped", runningKey: "generatingArtifact", completedKey: "generatedArtifact", failedKey: "artifactGenerationFailed", interruptedKey: "artifactGenerationStopped", detail };
    }
    case "review": {
      const state = providerDetail(item, "State")?.toLowerCase();
      return state === "exited"
        ? { icon: FileCheck2, runningLabel: "Leaving review mode", completedLabel: "Left review mode", failedLabel: "Couldn’t leave review mode", interruptedLabel: "Review-mode change stopped", runningKey: "leavingReviewMode", completedKey: "leftReviewMode", failedKey: "couldntLeaveReviewMode", interruptedKey: "reviewModeChangeStopped", detail }
        : { icon: FileCheck2, runningLabel: "Entering review mode", completedLabel: "Entered review mode", failedLabel: "Couldn’t enter review mode", interruptedLabel: "Review-mode change stopped", runningKey: "enteringReviewMode", completedKey: "enteredReviewMode", failedKey: "couldntEnterReviewMode", interruptedKey: "reviewModeChangeStopped", detail };
    }
    case "hook":
      return { icon: GitBranch, runningLabel: "Running a hook", completedLabel: "Ran a hook", failedLabel: "Hook failed", interruptedLabel: "Hook stopped", runningKey: "runningHook", completedKey: "ranHook", failedKey: "hookFailed", interruptedKey: "hookStopped", detail };
    case "memory":
      return { icon: BookOpen, runningLabel: "Checking memory", completedLabel: "Referenced memory", failedLabel: "Memory lookup failed", interruptedLabel: "Memory lookup stopped", runningKey: "checkingMemory", completedKey: "referencedMemory", failedKey: "memoryLookupFailed", interruptedKey: "memoryLookupStopped", detail };
    case "safety":
      return { icon: ShieldCheck, runningLabel: "Reviewing safety", completedLabel: "Reviewed safety", failedLabel: "Safety review failed", interruptedLabel: "Safety review stopped", runningKey: "reviewingSafety", completedKey: "reviewedSafety", failedKey: "safetyReviewFailed", interruptedKey: "safetyReviewStopped", detail };
    case "terminal":
      return { icon: TerminalSquare, runningLabel: "Sending terminal input", completedLabel: "Sent terminal input", failedLabel: "Terminal input failed", interruptedLabel: "Terminal input stopped", runningKey: "sendingTerminalInput", completedKey: "sentTerminalInput", failedKey: "terminalInputFailed", interruptedKey: "terminalInputStopped", detail };
    case "wait":
      return { icon: Clock3, runningLabel: "Waiting", completedLabel: "Finished waiting", failedLabel: "Wait failed", interruptedLabel: "Wait stopped", runningKey: "waiting", completedKey: "finishedWaiting", failedKey: "waitFailed", interruptedKey: "waitStopped", detail };
    case "provider_notice":
      return { icon: providerNoticeSeverity(item) === "info" ? Info : AlertTriangle, runningLabel: "Provider notice", completedLabel: "Provider notice", failedLabel: "Provider error", interruptedLabel: "Provider notice", runningKey: "providerNotice", completedKey: "providerNotice", failedKey: "providerError", interruptedKey: "providerNotice", detail };
  }
}

function workspaceChangePresentation(item: TaskChatWorkspaceChangeItem): TaskChatActivityPresentation {
  const count = item.totals.files || item.files.length;
  const detail = count > 0 ? `${count} ${count === 1 ? "file" : "files"}` : undefined;
  return { icon: FilePenLine, runningLabel: "Editing files", completedLabel: "Edited files", runningKey: "editingFiles", completedKey: "editedFiles", detail };
}

function workspaceFilePresentation(item: TaskChatWorkspaceFileItem): TaskChatActivityPresentation {
  return {
    icon: FileText,
    runningLabel: "Referencing a file",
    completedLabel: "Referenced a file",
    runningKey: "referencingFile",
    completedKey: "referencedFile",
    detail: item.line == null ? item.path : `${item.path}:${item.line}`,
  };
}

function resourcePresentation(item: TaskChatMaterializedResourceItem): TaskChatActivityPresentation {
  return {
    icon: item.resourceKind === "document" ? FileText : PackageCheck,
    runningLabel: "Saving a resource",
    completedLabel: item.resourceKind === "document" ? "Added a document" : "Added a deliverable",
    runningKey: "savingResource",
    completedKey: item.resourceKind === "document" ? "addedDocument" : "addedDeliverable",
    detail: item.title,
  };
}

export function protocolActivityPresentation(item: TaskChatProtocolItem): TaskChatActivityPresentation | null {
  switch (item.surface) {
    case "provider_activity": return providerActivityPresentation(item);
    case "workspace_change": return workspaceChangePresentation(item);
    case "workspace_file": return workspaceFilePresentation(item);
    case "resource": return resourcePresentation(item);
    case "runtime_request":
    case "run_result":
    case "run_terminal":
      return null;
  }
}

export function protocolActivityIsRunning(item: TaskChatProtocolItem): boolean {
  if (item.surface === "provider_activity") return item.status === "running";
  if (item.surface === "workspace_change") return !item.complete;
  return false;
}

export function protocolActivityLabel(item: TaskChatProtocolItem, presentation: TaskChatActivityPresentation): string {
  if (item.surface !== "provider_activity") {
    return protocolActivityIsRunning(item) ? presentation.runningLabel : presentation.completedLabel;
  }
  if (item.status === "failed") return presentation.failedLabel ?? `${presentation.completedLabel} · failed`;
  if (item.status === "interrupted") return presentation.interruptedLabel ?? `${presentation.completedLabel} · interrupted`;
  return item.status === "running" ? presentation.runningLabel : presentation.completedLabel;
}

export function protocolActivityTranslationKey(
  item: TaskChatProtocolItem,
  presentation: TaskChatActivityPresentation,
): string | undefined {
  const key = item.surface === "provider_activity"
    ? item.status === "failed"
      ? presentation.failedKey
      : item.status === "interrupted"
        ? presentation.interruptedKey
        : item.status === "running"
          ? presentation.runningKey
          : presentation.completedKey
    : protocolActivityIsRunning(item)
      ? presentation.runningKey
      : presentation.completedKey;
  return key ? `taskChatPage.activity.${key}` : undefined;
}
