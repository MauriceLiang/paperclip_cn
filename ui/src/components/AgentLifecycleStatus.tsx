import { useQuery } from "@tanstack/react-query";
import { agentsApi } from "../api/agents";
import { queryKeys } from "../lib/queryKeys";
import type { Agent, AgentLifecycleState } from "@paperclipai/shared";
import { Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useTranslation } from "@/i18n";

const phases = {
  preparing: ["agentLifecycle.preparingTitle", "agentLifecycle.preparingDescription"],
  verifying: ["agentLifecycle.verifyingTitle", "agentLifecycle.verifyingDescription"],
  pausing: ["agentLifecycle.pausingTitle", "agentLifecycle.pausingDescription"],
  resuming: ["agentLifecycle.resumingTitle", "agentLifecycle.resumingDescription"],
  terminating: ["agentLifecycle.terminatingTitle", "agentLifecycle.terminatingDescription"],
  cleaning_up: ["agentLifecycle.cleaningUpTitle", "agentLifecycle.cleaningUpDescription"],
} satisfies Partial<Record<AgentLifecycleState, [string, string]>>;

const failedPhaseKeys = {
  preparing: "agentLifecycle.failedPreparing", verifying: "agentLifecycle.failedVerifying",
  pausing: "agentLifecycle.failedPausing", resuming: "agentLifecycle.failedResuming",
  terminating: "agentLifecycle.failedTerminating", cleaning_up: "agentLifecycle.failedCleaningUp",
};

function pendingPhase(state?: AgentLifecycleState) {
  return state && state in phases ? phases[state as keyof typeof phases] : undefined;
}

export function agentLifecycleRefetchInterval(state?: AgentLifecycleState) {
  return pendingPhase(state) ? 2_000 : 30_000;
}

/** Poll lifecycle fields without refreshing the record used by editable forms. */
export function useAgentLifecycleStatus(agent?: Agent) {
  return useQuery({
    queryKey: [...queryKeys.agents.detail(agent?.id ?? ""), "lifecycle", agent?.companyId],
    queryFn: () => agentsApi.get(agent!.id, agent!.companyId),
    enabled: Boolean(agent),
    select: current => ({ status: current.status, lifecycleState: current.lifecycleState,
      lifecycleVersion: current.lifecycleVersion, lifecycleError: current.lifecycleError }),
    refetchInterval: query => agentLifecycleRefetchInterval(query.state.data?.lifecycleState ?? agent?.lifecycleState),
  });
}

export function AgentLifecycleStatus({ agent, onRetry, retryPending, refreshError = false }: {
  agent: Pick<Agent, "lifecycleState" | "lifecycleError">;
  onRetry: () => void;
  retryPending: boolean;
  refreshError?: boolean;
}) {
  const { t } = useTranslation();
  const phase = pendingPhase(agent.lifecycleState);
  if (!phase && !refreshError) return null;
  return <div role="status" aria-live="polite" className="space-y-2 text-sm">
    {refreshError && <p className="text-destructive">{t("agentLifecycle.refreshError")}</p>}
    {phase && <div className="flex flex-wrap items-center gap-2">
      <Badge variant={agent.lifecycleError ? "destructive" : "secondary"}>
        {!agent.lifecycleError && <Loader2 aria-hidden="true" className="mr-1 size-3 animate-spin motion-reduce:animate-none" />}
        {agent.lifecycleError ? t(failedPhaseKeys[agent.lifecycleState as keyof typeof failedPhaseKeys]) : t(phase[0])}
      </Badge>
      {!agent.lifecycleError && <span className="text-muted-foreground">{t(phase[1])}</span>}
    </div>}
    {phase && agent.lifecycleError && <div className="flex flex-wrap items-center gap-2 text-destructive">
      <span>{agent.lifecycleError}</span>
      <Button variant="outline" size="sm" disabled={retryPending} onClick={onRetry}>
        {retryPending ? t("agentLifecycle.retrying") : t("agentLifecycle.retryNow")}
      </Button>
    </div>}
    {phase && agent.lifecycleError && <p className="text-muted-foreground">{t("agentLifecycle.autoRetryHint")}</p>}
  </div>;
}
