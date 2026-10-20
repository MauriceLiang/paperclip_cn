import { useMemo, type CSSProperties } from "react";
import { Folder, GitBranch, GitBranchPlus, Monitor } from "lucide-react";
import type { ExecutionWorkspaceSummary } from "@paperclipai/shared";
import { SearchableSelect, type SearchableSelectOption } from "@/components/SearchableSelect";
import { orderReusableExecutionWorkspaces } from "@/lib/reusable-execution-workspaces";
import { useTranslation } from "@/i18n";

interface WorktreeOption extends SearchableSelectOption {
  mode: string;
  workspaceId?: string;
  description: string;
}

type WorktreeMode = "isolated_workspace" | "shared_workspace" | "operator_branch" | "agent_default" | "inherit";

interface WorktreeModeOption {
  key: string;
  value: string;
  mode: WorktreeMode;
}

interface ComposerWorktreePickerProps {
  mode: string;
  workspaceId: string;
  workspaces: readonly ExecutionWorkspaceSummary[];
  onChange: (mode: string, workspaceId: string) => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  disabled?: boolean;
  mobile?: boolean;
  contentStyle?: CSSProperties;
  selectedWorkspaceLabel?: string;
}

const MODE_OPTIONS: WorktreeModeOption[] = [
  { key: "isolated_workspace", value: "isolated_workspace", mode: "isolated_workspace" },
  { key: "shared_workspace", value: "shared_workspace", mode: "shared_workspace" },
  { key: "operator_branch", value: "operator_branch", mode: "operator_branch" },
  { key: "agent_default", value: "agent_default", mode: "agent_default" },
  { key: "inherit", value: "inherit", mode: "inherit" },
];

/** Reuses the searchable selector and the existing workspace recency ordering. */
export function ComposerWorktreePicker({
  mode, workspaceId, workspaces, onChange, loading, error, onRetry,
  disabled, mobile, contentStyle, selectedWorkspaceLabel,
}: ComposerWorktreePickerProps) {
  const { t } = useTranslation();
  const groups = useMemo(() => {
    const modeCopy: Record<WorktreeMode, { label: string; description: string }> = {
      isolated_workspace: {
        label: t("taskChatPage.worktree.newWorktree"),
        description: t("taskChatPage.worktree.newWorktreeDescription"),
      },
      shared_workspace: {
        label: t("taskChatPage.worktree.projectWorkspace"),
        description: t("taskChatPage.worktree.projectWorkspaceDescription"),
      },
      operator_branch: {
        label: t("taskChatPage.worktree.newBranch"),
        description: t("taskChatPage.worktree.newBranchDescription"),
      },
      agent_default: {
        label: t("taskChatPage.worktree.agentDefault"),
        description: t("taskChatPage.worktree.agentDefaultDescription"),
      },
      inherit: {
        label: t("taskChatPage.worktree.projectDefault"),
        description: t("taskChatPage.worktree.projectDefaultDescription"),
      },
    };
    return [
    { id: "new", options: [{ ...MODE_OPTIONS[0]!, ...modeCopy.isolated_workspace }] },
    {
      id: "reuse", label: t("taskChatPage.worktree.reuseWorktree"),
      options: orderReusableExecutionWorkspaces(workspaces).map((workspace): WorktreeOption => ({
        key: `reuse:${workspace.id}`, value: `reuse:${workspace.id}`,
        workspaceId: workspace.id, mode: "reuse_existing", label: workspace.name,
        description: workspace.branchName ?? t("taskChatPage.worktree.existingWorkspace"),
        searchText: `${workspace.branchName ?? ""} ${workspace.id}`,
      })),
    },
    {
      id: "other", label: t("taskChatPage.worktree.otherOptions"),
      options: MODE_OPTIONS.filter((option) => option.mode === "shared_workspace"
        || (option.mode !== "isolated_workspace" && option.mode === mode))
        .map((option) => ({ ...option, ...modeCopy[option.mode] })),
    },
  ];
  }, [mode, workspaces, t]);

  const value = mode === "reuse_existing" ? `reuse:${workspaceId}` : mode;
  return (
    <SearchableSelect<string, WorktreeOption>
      value={value}
      groups={groups}
      onValueChange={(_, option) => onChange(option.mode, option.workspaceId ?? "")}
      placeholder={t("taskChatPage.worktree.worktrees")}
      triggerAriaLabel={t("taskChatPage.worktree.worktrees")}
      mobileTitle={t("taskChatPage.worktree.worktrees")}
      searchPlaceholder={t("taskChatPage.worktree.searchWorktrees")}
      emptyMessage={t("taskChatPage.worktree.noMatchingWorktrees")}
      disabled={disabled}
      modal={mobile}
      contentStyle={contentStyle}
      contentWidth="auto"
      className="min-w-0 flex-1 sm:flex-none sm:max-w-72"
      triggerClassName="h-8 gap-1.5 border-0 bg-transparent px-2 text-xs font-medium shadow-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-0"
      renderValue={(option) => (
        <span className="flex min-w-0 items-center gap-1.5">
          <GitBranch className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            <span className="hidden text-muted-foreground sm:inline">{t("taskChatPage.worktree.worktreesLabel")}</span>
            {option?.label ?? selectedWorkspaceLabel ?? t("taskChatPage.worktree.selectWorktree")}
          </span>
        </span>
      )}
      renderOption={(option) => {
        const Icon = option.workspaceId ? GitBranch : option.mode === "isolated_workspace" ? GitBranchPlus
          : option.mode === "agent_default" ? Monitor : option.mode === "operator_branch" ? GitBranch : Folder;
        return (
          <>
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{option.label}</span>
              <span className="truncate text-xs text-muted-foreground">{option.description}</span>
            </span>
          </>
        );
      }}
      listFooter={loading || error || workspaces.length === 0 ? (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground" role="status">
          {loading ? t("taskChatPage.worktree.loadingWorktrees") : error ? (
            <span className="flex items-center justify-between gap-2">
              {t("taskChatPage.worktree.loadFailed")}
              <button type="button" className="rounded px-2 py-1 text-foreground hover:bg-accent" onClick={onRetry}>{t("common.tryAgain")}</button>
            </span>
          ) : t("taskChatPage.worktree.noWorktrees")}
        </div>
      ) : undefined}
    />
  );
}
