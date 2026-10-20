import { useQuery } from "@tanstack/react-query";
import type { DecisionHistoryEntry } from "@paperclipai/shared";
import { decisionModelsApi } from "@/api/decision-models";
import { Link } from "@/lib/router";
import { formatDateTime, formatTokens, formatDetailedCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFastResponsesEnabled } from "@/hooks/useFastResponsesEnabled";
import { useTranslation } from "@/i18n";

const STATUS_KEYS: Record<string, string> = {
  succeeded: "operationsPage.costs.decisionHistory.status.succeeded",
  running: "operationsPage.costs.decisionHistory.status.running",
  unknown: "operationsPage.costs.decisionHistory.status.unresolved",
  skipped: "operationsPage.costs.decisionHistory.status.skipped",
  pending: "operationsPage.costs.decisionHistory.status.pending",
  failed: "operationsPage.costs.decisionHistory.status.failed",
};

const PUBLICATION_STATUS_KEYS: Record<string, string> = {
  pending: "operationsPage.costs.decisionHistory.publicationStatus.pending",
  streaming: "operationsPage.costs.decisionHistory.publicationStatus.streaming",
  published: "operationsPage.costs.decisionHistory.publicationStatus.published",
  retry: "operationsPage.costs.decisionHistory.publicationStatus.retry",
  delivery_unknown: "operationsPage.costs.decisionHistory.publicationStatus.deliveryUnknown",
  failed: "operationsPage.costs.decisionHistory.publicationStatus.failed",
  cancelled: "operationsPage.costs.decisionHistory.publicationStatus.cancelled",
  awaiting_consent: "operationsPage.costs.decisionHistory.publicationStatus.awaitingConsent",
  suppressed: "operationsPage.costs.decisionHistory.publicationStatus.suppressed",
  test: "operationsPage.costs.decisionHistory.publicationStatus.test",
};

export function DecisionHistoryTable({ entries, fastResponse = false, connectionsEnabled = true }: { entries: (DecisionHistoryEntry & { publicationStatus?: string; connectionName?: string | null })[]; fastResponse?: boolean; connectionsEnabled?: boolean }) {
  const { t } = useTranslation();
  if (!entries.length) return <p className="text-sm text-muted-foreground">{t(fastResponse ? "operationsPage.costs.decisionHistory.noFastResponses" : "operationsPage.costs.decisionHistory.noDecisionRequests")} <Link to={connectionsEnabled ? "/company/settings/connections" : fastResponse ? "/company/settings/instance/experimental" : "/company/settings"} className="underline underline-offset-4">{t(fastResponse ? connectionsEnabled ? "operationsPage.costs.decisionHistory.configureFastResponse" : "operationsPage.costs.decisionHistory.enableFastResponses" : "operationsPage.costs.decisionHistory.configureDecisionModel")}</Link> {t("operationsPage.costs.decisionHistory.runTestSuffix")}</p>;
  const headers = [
    "whenFeature",
    "responsible",
    "task",
    ...(fastResponse ? ["connection"] : []),
    "model",
    "status",
    "duration",
    "tokensInOut",
    "cost",
  ];
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">{t("operationsPage.costs.decisionHistory.recentRequests")}</p>
    <div className="overflow-x-auto"><table className="w-full text-sm" aria-label={t(fastResponse ? "operationsPage.costs.decisionHistory.fastResponsesAria" : "operationsPage.costs.decisionHistory.decisionRequestsAria")}>
      <thead><tr className="border-b border-border text-muted-foreground">{headers.map(key => <th key={key} className="px-3 py-2 text-left font-medium">{t(`operationsPage.costs.decisionHistory.headers.${key}`)}</th>)}</tr></thead>
      <tbody>{entries.map(row => <tr key={row.id} className="border-b border-border last:border-0">
        <td className="px-3 py-3"><div className="whitespace-nowrap">{formatDateTime(row.startedAt)}</div><div className="text-xs text-muted-foreground">{row.feature === "settings.test" ? t("operationsPage.costs.decisionHistory.setupTest") : fastResponse && row.feature === "message" ? t("operationsPage.costs.decisionHistory.fastResponseFeature") : row.feature}</div></td>
        <td className="px-3 py-3">{row.actorType === "system" ? t("operationsPage.costs.paperclipServices") : row.userName ?? (row.responsibleUserId === "local-board" ? t("operationsPage.costs.decisionHistory.board") : t("operationsPage.costs.decisionHistory.formerUser"))}</td>
        <td className="px-3 py-3">{row.issueId ? <Link className="underline underline-offset-4" to={`/issues/${row.issueIdentifier ?? row.issueId}`}>{row.issueIdentifier ?? t("operationsPage.costs.decisionHistory.viewTask")}</Link> : "—"}</td>
        {fastResponse && <td className="px-3 py-3">{row.connectionName ?? (row.connectionId ? t("operationsPage.costs.decisionHistory.removedConnection") : "—")}</td>}
        <td className="px-3 py-3 font-mono text-xs">{row.model}</td>
        <td className="px-3 py-3"><div>{t(STATUS_KEYS[row.status] ?? STATUS_KEYS.failed!)}</div>{row.publicationStatus && <div className="text-xs text-muted-foreground">{PUBLICATION_STATUS_KEYS[row.publicationStatus] ? t(PUBLICATION_STATUS_KEYS[row.publicationStatus]!) : row.publicationStatus}</div>}{row.errorCode && <div className="text-xs text-muted-foreground">{row.errorCode.replaceAll("_", " ")}</div>}</td>
        <td className="px-3 py-3 font-mono">{row.durationMs === null ? "—" : t("operationsPage.costs.decisionHistory.durationSeconds", { duration: (row.durationMs / 1000).toFixed(1) })}</td>
        <td className="whitespace-nowrap px-3 py-3 font-mono">{row.inputTokens === null ? "—" : formatTokens(row.inputTokens)} / {row.outputTokens === null ? "—" : formatTokens(row.outputTokens)}</td>
        <td className="px-3 py-3 font-mono"><div>{row.costCents === null ? t("operationsPage.costs.decisionHistory.unknownCost") : formatDetailedCents(row.costCents)}</div>{row.costStatus !== "unpriced" && row.costStatus && <span className="text-xs text-muted-foreground">{t(row.costStatus === "estimated" ? "operationsPage.costs.decisionHistory.estimated" : "operationsPage.costs.decisionHistory.reported")}</span>}</td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}
export function DecisionHistory({ companyId, from, to }: { companyId: string; from?: string | null; to?: string | null }) {
  const { t } = useTranslation();
  const { enabled } = useFastResponsesEnabled();
  const query = useQuery({ queryKey: ["decision-history", companyId, from, to], queryFn: () => decisionModelsApi.history(companyId, from, to), refetchInterval: q => q.state.data?.some(row => row.status === "running") ? 5000 : false });
  if (query.isPending) return <p className="text-sm text-muted-foreground">{t("operationsPage.costs.decisionHistory.loadingDecisionRequests")}</p>;
  if (query.error) return <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{t("operationsPage.costs.decisionHistory.decisionRequestsLoadFailed")}</p><Button variant="outline" onClick={() => void query.refetch()}>{t("common.tryAgain")}</Button></div>;
  return <DecisionHistoryTable entries={query.data ?? []} connectionsEnabled={enabled} />;
}
