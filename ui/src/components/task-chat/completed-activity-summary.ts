import { Brain, CirclePause, Gauge, Layers3 } from "lucide-react";
import type { TaskChatActivityPhaseItem } from "./task-chat-model";
import {
  toolActivityPresentation,
  type ToolFamily,
  type ToolIcon,
} from "./tool-taxonomy";
import { protocolActivityPresentation, providerNoticeSeverity } from "./task-chat-activity-presentation";
import { t as translate } from "@/i18n";

type Activity = TaskChatActivityPhaseItem["items"][number];
const familyLabelKeys: Record<ToolFamily, string> = {
  terminal: "taskChatPage.summary.family.terminal",
  grep: "taskChatPage.summary.family.grep",
  search: "taskChatPage.summary.family.search",
  read: "taskChatPage.summary.family.read",
  edit: "taskChatPage.summary.family.edit",
  web: "taskChatPage.summary.family.web",
  plan: "taskChatPage.summary.family.plan",
  question: "taskChatPage.summary.family.question",
  agent: "taskChatPage.summary.family.agent",
  safety: "taskChatPage.summary.family.safety",
  image: "taskChatPage.summary.family.image",
  wait: "taskChatPage.summary.family.wait",
  mcp: "taskChatPage.summary.family.mcp",
  other: "taskChatPage.summary.family.other",
};
const providerLabelKeys: Record<string, string> = {
  research: "taskChatPage.summary.provider.research",
  plan: "taskChatPage.summary.provider.plan",
  delegation: "taskChatPage.summary.provider.delegation",
  artifact: "taskChatPage.summary.provider.artifact",
  context: "taskChatPage.summary.provider.context",
  memory: "taskChatPage.summary.provider.memory",
  model_identity: "taskChatPage.summary.provider.modelIdentity",
  review: "taskChatPage.summary.provider.review",
  hook: "taskChatPage.summary.provider.hook",
  safety: "taskChatPage.summary.provider.safety",
  terminal: "taskChatPage.summary.provider.terminal",
  wait: "taskChatPage.summary.provider.wait",
  workspace_change: "taskChatPage.summary.provider.workspaceChange",
  workspace_file: "taskChatPage.summary.provider.workspaceFile",
  resource: "taskChatPage.summary.provider.resource",
};

/** Describe observed activities, never infer success from a finished group. */
export function completedActivitySummary(items: Activity[]) {
  const categories = new Map<
    string,
    { label: string; icon: ToolIcon; order: number }
  >();
  const add = (label: string, icon: ToolIcon, order = 0) => {
    const existing = categories.get(label);
    if (!existing || order < existing.order)
      categories.set(label, { label, icon, order });
  };
  const tools: Array<{
    family: ToolFamily;
    icon: ToolIcon;
    completed: boolean;
    order: number;
  }> = [];
  const notices: Array<{
    summary: string | undefined;
    severity: "info" | "warning" | "error";
    icon: ToolIcon;
    order: number;
  }> = [];
  for (const [order, item] of items.entries()) {
    if (item.kind === "tool") {
      const p = toolActivityPresentation({
        name: item.rawName ?? item.name,
        target: item.target,
      });
      tools.push({ ...p, order, completed: item.status === "completed" });
    } else if (item.kind === "protocol") {
      if (
        item.surface === "provider_activity" &&
        item.family === "tool_execution"
      ) {
        const value = (label: string) =>
          item.details.find((d) => d.label === label)?.value;
        const p = toolActivityPresentation({
          name: value("Name"),
          operation: value("Operation"),
          transport: value("Transport"),
          namespace: value("Namespace"),
          target: value("Target"),
        });
        tools.push({ ...p, order, completed: item.status === "completed" });
      } else {
        const p = protocolActivityPresentation(item);
        if (!p) continue;
        if (item.surface === "provider_activity" && item.family === "provider_notice") {
          // Reuse only the normalized notice text already available in the row.
          const summary = item.summary?.trim()
            || item.details.find((entry) => entry.label === "Summary")?.value.trim();
          notices.push({ summary, severity: providerNoticeSeverity(item), icon: p.icon, order });
          continue;
        }
        const family =
          item.surface === "provider_activity" ? item.family : item.surface;
        const labelKey = providerLabelKeys[family];
        const translatedLabel = labelKey
          ? translate(labelKey)
          : translate(familyLabelKeys.other);
        add(translatedLabel, p.icon, order);
      }
    }
  }
  if (notices.length) {
    const strongest = notices.find((notice) => notice.severity === "error")
      ?? notices.find((notice) => notice.severity === "warning")
      ?? notices[0]!;
    const label = notices.length === 1
      ? strongest.summary || translate("taskChatPage.summary.receivedProviderUpdate")
      : strongest.severity === "error"
        ? translate("taskChatPage.summary.providerErrorReported")
        : strongest.severity === "warning"
          ? translate("taskChatPage.summary.providerWarningReported")
          : translate("taskChatPage.summary.receivedProviderUpdates");
    // One notice category leaves room for actual work. Keep warnings and errors
    // visible when the compact label truncates other activity categories.
    add(label, strongest.icon, strongest.severity === "info" ? notices[0]!.order : -1);
  }
  const completedFamilies = new Set(
    tools.filter((tool) => tool.completed).map((tool) => tool.family),
  );
  // Merge repeated families and retries. Terminal is an action, not an exit-status claim.
  for (const tool of tools) {
    const succeeded = completedFamilies.has(tool.family);
    const label =
      tool.family === "read" && !succeeded
        ? translate("taskChatPage.summary.checkedFiles")
        : tool.family === "edit" && !succeeded
          ? translate("taskChatPage.summary.workedOnFiles")
          : translate(familyLabelKeys[tool.family]);
    add(label, tool.icon, tool.order);
  }
  if (!categories.size) {
    if (items.some((item) => item.kind === "thinking"))
      add(translate("taskChatPage.summary.thoughtThroughTask"), Brain);
    else if (items.some((item) => item.kind === "marker"))
      add(translate("taskChatPage.summary.activityStopped"), CirclePause);
    else add(translate("taskChatPage.summary.recordedUsage"), Gauge);
  }
  const values = [...categories.values()].sort((a, b) => a.order - b.order);
  const join = (parts: string[]) =>
    parts
      .map((p, i) => (i ? p.charAt(0).toLowerCase() + p.slice(1) : p))
      .join(translate("taskChatPage.summary.separator"));
  const fullLabel = join(values.map((v) => v.label));
  return {
    label:
      values.length > 3
        ? `${join(values.slice(0, 2).map((v) => v.label))}${translate("taskChatPage.summary.andMore")}`
        : fullLabel,
    fullLabel,
    icon: values.length === 1 ? values[0].icon : Layers3,
  };
}
