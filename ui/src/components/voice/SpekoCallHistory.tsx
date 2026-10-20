import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/i18n";
import { formatDateTime } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { VoiceCallHistoryEntry, VoiceCallReport, VoiceUnapprovedCallHistoryEntry } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { voiceSessionsApi } from "@/api/voiceSessions";
import { voicePhoneApi } from "@/api/voicePhone";
import { voiceHistoryApi } from "@/api/voiceHistory";

function charge(amount: string | null, t: ReturnType<typeof useTranslation>["t"]) {
  if (amount === null) return t("appsPage.chatDetail.callHistory.notReported");
  const value = BigInt(amount);
  const whole = value / 1_000_000n, fraction = (value % 1_000_000n).toString().padStart(6, "0");
  return t("appsPage.chatDetail.callHistory.chargeAmount", { amount: `${whole}.${fraction}` });
}
export function SpekoCallReport({ report }: { report: VoiceCallReport }) {
  const { t } = useTranslation();
  return <div className="space-y-3">
    <dl className="flex flex-wrap gap-4 text-sm"><div><dt className="text-muted-foreground">{t("appsPage.chatDetail.callHistory.chargeLabel")}</dt><dd>{charge(report.costMicroUsd, t)}</dd></div>{report.durationSeconds !== null && <div><dt className="text-muted-foreground">{t("appsPage.chatDetail.callHistory.durationLabel")}</dt><dd>{t("appsPage.chatDetail.callHistory.durationSeconds", { seconds: report.durationSeconds })}</dd></div>}</dl>
    <p className="text-xs text-muted-foreground">{t("appsPage.chatDetail.callHistory.costsNote")}</p>
    {report.transcript.length ? <ol aria-label={t("appsPage.chatDetail.callHistory.transcriptLabel")} className="space-y-3">{report.transcript.map(turn => <li key={turn.id} className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{turn.speaker === "caller" ? t("appsPage.chatDetail.callHistory.speakerYou") : t("appsPage.chatDetail.callHistory.speakerAgent")}{turn.interrupted ? t("appsPage.chatDetail.callHistory.interruptedSuffix") : ""}</p><p className="whitespace-pre-wrap break-words text-sm">{turn.text}</p></li>)}</ol>
      : <p className="text-sm text-muted-foreground">{report.status === "unavailable" ? t("appsPage.chatDetail.callHistory.transcriptUnavailable") : report.status === "pending" ? t("appsPage.chatDetail.callHistory.transcriptPending") : t("appsPage.chatDetail.callHistory.transcriptMissing")}</p>}
  </div>;
}
const modeNameKeys = {
  browser: "appsPage.chatDetail.callHistory.mode.browser",
  inbound_phone: "appsPage.chatDetail.callHistory.mode.incoming",
  outbound_phone: "appsPage.chatDetail.callHistory.mode.outgoing",
} as const;
const stateNameKeys = {
  reserved: "appsPage.chatDetail.callHistory.state.preparing",
  creating: "appsPage.chatDetail.callHistory.state.connecting",
  creation_unknown: "appsPage.chatDetail.callHistory.state.checkingConnection",
  connecting: "appsPage.chatDetail.callHistory.state.connecting",
  active: "appsPage.chatDetail.callHistory.state.inProgress",
  awaiting_approval: "appsPage.chatDetail.callHistory.state.awaitingApproval",
  ending: "appsPage.chatDetail.callHistory.state.ending",
  ended: "appsPage.chatDetail.callHistory.state.completed",
  failed: "appsPage.chatDetail.callHistory.state.failed",
  expired: "appsPage.chatDetail.callHistory.state.expired",
} as const;
export function SpekoCallActivityItem({ entry: { session, report }, onEnd, ending, presentation = "history" }: { entry: VoiceCallHistoryEntry; onEnd?(sessionId: string): void; ending?: boolean; presentation?: "history" | "activity" }) {
  const { t } = useTranslation();
  const summary = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (restoreFocus.current && ["ended", "failed", "expired"].includes(session.state)) { summary.current?.focus(); restoreFocus.current = false; }
  }, [session.state]);
  return <details data-activity-kind="call" className={presentation === "activity" ? "px-2 py-3 transition-colors hover:bg-accent/50" : "rounded-md border border-border p-3"}>
    <summary ref={summary} className="cursor-pointer break-words text-sm font-medium">{t(modeNameKeys[session.mode])} · {t(stateNameKeys[session.state])}<span className="ml-2 text-xs font-normal text-muted-foreground">{formatDateTime(session.createdAt)}</span></summary>
    <div className="mt-3 space-y-3"><Link className="text-sm text-primary underline" to={`/issues/${encodeURIComponent(session.issueId)}`}>{t("appsPage.chatDetail.callHistory.conversationTask")}</Link>
      {session.errorCode && <p className="text-sm text-muted-foreground">{session.errorCode === "cleanup_pending" ? t("appsPage.chatDetail.callHistory.cleanupPending") : t("appsPage.chatDetail.callHistory.connectionProblem")}</p>}
      {!session.endedAt && !["ended", "failed", "expired"].includes(session.state) && session.callerAuthority !== "guest_intake" && onEnd && <Button size="sm" variant="outline" disabled={ending} onClick={() => { restoreFocus.current = true; onEnd(session.id); }}>{ending ? t("appsPage.chatDetail.callHistory.endingCall") : t("appsPage.chatDetail.callHistory.endCall")}</Button>}
      <SpekoCallReport report={report} />
    </div>
  </details>;
}
export function SpekoUnapprovedCallActivityItem({ call, presentation = "history" }: { call: VoiceUnapprovedCallHistoryEntry; presentation?: "history" | "activity" }) {
  const { t } = useTranslation();
  const stateKey = call.state === "denied"
    ? "appsPage.chatDetail.callHistory.callDenied"
    : call.state === "expired"
      ? "appsPage.chatDetail.callHistory.approvalExpired"
      : "appsPage.chatDetail.callHistory.missedCall";
  return <div data-activity-kind="unapproved_call" className={presentation === "activity" ? "px-2 py-3 text-sm" : "rounded-md border border-border p-3 text-sm"}><p>{t(stateKey)} · {formatDateTime(call.createdAt)}</p><p className="text-xs text-muted-foreground">{t("appsPage.chatDetail.callHistory.noPrivateTask")}</p></div>;
}
export interface SpekoCallHistoryViewProps { entries?: VoiceCallHistoryEntry[]; unapprovedCalls?: VoiceUnapprovedCallHistoryEntry[]; loading?: boolean; error?: string; incomingError?: string; endError?: string; onRetry(): void; onEnd?(sessionId: string): void; endingSessionId?: string }
export function SpekoCallHistoryView({ entries = [], unapprovedCalls = [], loading, error, incomingError, endError, onRetry, onEnd, endingSessionId }: SpekoCallHistoryViewProps) {
  const { t } = useTranslation();
  return <section className="max-w-xl space-y-3" aria-label={t("appsPage.chatDetail.callHistory.title")}>
    <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{t("appsPage.chatDetail.callHistory.title")}</h2><Button size="sm" variant="ghost" onClick={onRetry} disabled={loading}>{t("appsPage.chatDetail.callHistory.refresh")}</Button></div>
    {loading && <p role="status" className="text-sm text-muted-foreground">{t("appsPage.chatDetail.callHistory.loading")}</p>}
    {error && <div className="space-y-2"><p role="alert" className="text-sm text-destructive">{t("appsPage.chatDetail.callActivityLoadFailed", { error })}</p><Button size="sm" variant="outline" onClick={onRetry}>{t("common.tryAgain")}</Button></div>}
    {incomingError && <p role="alert" className="text-sm text-destructive">{t("appsPage.chatDetail.unapprovedCallsLoadFailed", { error: incomingError })}</p>}
    {endError && <p role="alert" className="text-sm text-destructive">{t("appsPage.chatDetail.callEndFailed", { error: endError })}</p>}
    {!loading && !error && !incomingError && !entries.length && !unapprovedCalls.length && <p className="text-sm text-muted-foreground">{t("appsPage.chatDetail.callHistory.empty")}</p>}
    {!error && entries.map(entry => <SpekoCallActivityItem key={entry.session.id} entry={entry} onEnd={onEnd} ending={endingSessionId === entry.session.id} />)}
    {!incomingError && unapprovedCalls.length > 0 && <div className="space-y-2"><h3 className="text-sm font-medium">{t("appsPage.chatDetail.callHistory.unapprovedIncomingCalls")}</h3><ul className="space-y-2">{unapprovedCalls.map(call => <li key={call.id}><SpekoUnapprovedCallActivityItem call={call} /></li>)}</ul></div>}
  </section>;
}
export function useSpekoCallHistory(companyId: string, endpointId: string, enabled = true) {
  const query = useQuery({ queryKey: ["speko-history", companyId, endpointId], queryFn: () => voiceHistoryApi.list(companyId, endpointId), enabled, retry: false, refetchInterval: enabled ? 30_000 : false });
  const incoming = useQuery({queryKey: ["speko-unapproved-history", companyId, endpointId], queryFn: () => voicePhoneApi.history(companyId, endpointId), retry: false, enabled: enabled && query.isSuccess, refetchInterval: enabled ? 30_000 : false});
  const ending = useMutation({mutationFn: (sessionId: string) => voiceSessionsApi.end(companyId, sessionId), onSuccess: () => query.refetch()});
  return { entries: query.data ?? [], unapprovedCalls: incoming.data ?? [], loading: query.isLoading || incoming.isLoading, error: query.error?.message, incomingError: incoming.error?.message, endError: ending.error?.message, endingSessionId: ending.isPending ? ending.variables : undefined,
    onEnd: (sessionId: string) => ending.mutate(sessionId), onRetry: () => { ending.reset(); void query.refetch(); void incoming.refetch(); } };
}
export function SpekoCallHistory({ companyId, endpointId }: { companyId: string; endpointId: string }) {
  return <SpekoCallHistoryView {...useSpekoCallHistory(companyId, endpointId)} />;
}
