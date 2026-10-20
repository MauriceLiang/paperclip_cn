import { useQuery } from "@tanstack/react-query";
import { grokBotApi } from "@/api/grokBot";
import { Link } from "@/lib/router";
import { useTranslation } from "@/i18n";
import { formatDateTime } from "@/i18n/formatters";
/** Reports observed Paperclip activity; this is not a provider availability indicator. */
export function GrokBotWorkSummary({ companyId, agentId }: { companyId: string; agentId: string }) {
  const { t } = useTranslation();
  const state = useQuery({ queryKey: ["grok-binding", companyId, agentId], queryFn: ({ signal }) => grokBotApi.connection(companyId, agentId, signal), retry: false, refetchInterval: 10000 });
  const data = state.data, binding = data?.binding, routine = binding?.routine;
  return <div className="space-y-2 text-sm">
    {state.error && <p role="alert" className="text-destructive">{t("agentSetupPage.grokBotWorkSummary.refreshFailed", { error: state.error.message })}</p>}
    <p>{data?.recoveryNeeded ? t("agentSetupPage.grokBotWorkSummary.recoveryNeeded") : binding?.assignment?.status === "offered" ? t("agentSetupPage.grokBotWorkSummary.awaitingAcknowledgement") : binding?.assignment ? t("agentSetupPage.grokBotWorkSummary.workingInGrokBot") : routine?.verified ? t("agentSetupPage.grokBotWorkSummary.noActiveWork") : t("agentSetupPage.grokBotWorkSummary.connectionIncomplete")}</p>
    {data?.currentTask && <Link className="underline" to={`/issues/${data.currentTask.id}`}>{data.currentTask.identifier}: {data.currentTask.title}</Link>}
    <p className="text-muted-foreground">{t("agentSetupPage.grokBotWorkSummary.queuedTasks", { count: data?.queuedTaskCount ?? t("common.loading") })}</p>
    <p className="text-muted-foreground">{t("agentSetupPage.grokBotWorkSummary.lastContact", { time: routine?.lastContactAt ? formatDateTime(routine.lastContactAt) : t("agentSetupPage.grokBotWorkSummary.notObserved") })}</p>
    <p className="text-xs text-muted-foreground">{t("agentSetupPage.grokBotWorkSummary.description")}</p>
  </div>;
}
