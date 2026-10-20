import { Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trans } from "react-i18next";
import { museDetectorCleanupAttestationSchema } from "@paperclipai/shared";
import type { MuseConnection, MusePairing, MuseAttestStopInput, MuseDetectorCleanupAttestationInput } from "@paperclipai/shared";
import { agentsApi } from "@/api/agents";
import { useMuseConnection, useMuseConnectionState } from "@/hooks/useMuseConnection";
import { queryKeys } from "@/lib/queryKeys";
import { formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { AgentSetupPrompt } from "./AgentSetupPrompt";
import { MuseConnectionChecks } from "./new-agent/ExternalAgentInviteContent";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export interface MuseConnectionDetailsProps {
  connection: MuseConnection;
  pairing?: MusePairing | null;
  busy?: boolean;
  error?: string;
  offline?: boolean;
  onTest: () => void;
  onRepair: () => void;
  onPause: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  onAttest: (input: MuseAttestStopInput) => void;
  onAttestDetectorCleanup?: (input: MuseDetectorCleanupAttestationInput) => void;
}

/** The settings view uses the same connection evidence as the invitation. */
export function MuseConnectionDetails({ connection, pairing, busy, error, offline = false, onTest, onRepair, onPause, onDisconnect, onRefresh, onAttest, onAttestDetectorCleanup }: MuseConnectionDetailsProps) {
  const { t } = useTranslation();
  const b = connection.binding;
  const [attestation, setAttestation] = useState<MuseAttestStopInput | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [detectorSnapshot, setDetectorSnapshot] = useState<Omit<MuseDetectorCleanupAttestationInput, "observation" | "detectorRemoved"> | null>(null);
  const [detectorHookId, setDetectorHookId] = useState("");
  const [observationDigest, setObservationDigest] = useState("");
  const [detectorObservedAt, setDetectorObservedAt] = useState("");
  const detectorObservedAtValid = museDetectorCleanupAttestationSchema.shape.observation.shape.observedAt.safeParse(detectorObservedAt).success;
  const [detectorConfirmed, setDetectorConfirmed] = useState(false);
  const detectorIdentity = JSON.stringify([b?.id, b?.generation, b?.revision, b?.qualification?.id, b?.cleanup.hookScript, b?.cleanup.attestationEligible, offline]);
  useEffect(() => { setDetectorSnapshot(null); setObservationDigest(""); setDetectorObservedAt(""); setDetectorHookId(""); setDetectorConfirmed(false); }, [detectorIdentity]);
  const boundaryIdentity = JSON.stringify(b?.stop.boundary);
  const stopBindingRevision = b?.stop.bindingRevision;
  useEffect(() => { setAttestation(null); setConfirmed(false); }, [boundaryIdentity, stopBindingRevision]);
  const live = !!b && b.status !== "revoked";
  const state = useMuseConnectionState(connection, { offline });
  const testing = state.testing;
  const configure = !offline && connection.enabled && connection.canConfigureConnection && !!connection.publicOrigin;
  const timestamp = (value: string | null) => value ? formatDateTime(value, { includeSeconds: true }) : t("runnerComponents.museRunnerConnection.notObserved");
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">{t("runnerComponents.museRunnerConnection.intro")}</p>
    {!connection.enabled && <p className="text-sm text-muted-foreground">{t("runnerComponents.museRunnerConnection.disabled")}</p>}
    {!connection.publicOrigin && <p className="text-sm text-muted-foreground">{t("runnerComponents.museRunnerConnection.publicOriginRequired")}</p>}
    {b && <>
      <MuseConnectionChecks state={state} />
      <dl className="space-y-2 text-xs">
        {[
          [t("runnerComponents.museRunnerConnection.fields.lastReceiverContact"), timestamp(b.lastReceiverContactAt)],
          [t("runnerComponents.museRunnerConnection.fields.workerActivity"), timestamp(b.lastWorkerActivityAt)],
          [t("runnerComponents.museRunnerConnection.fields.lastVerifiedReply"), timestamp(b.lastVerifiedReplyAt)],
          [t("runnerComponents.museRunnerConnection.fields.credentialStatus"), b.credentialState],
          [t("runnerComponents.museRunnerConnection.fields.refreshExpires"), timestamp(b.refreshExpiresAt)],
          [t("runnerComponents.museRunnerConnection.fields.clientVersion"), b.clientVersion ?? t("runnerComponents.museRunnerConnection.notReported")],
          [t("runnerComponents.museRunnerConnection.fields.liveAssignments"), String(b.liveAssignments)],
          [t("runnerComponents.museRunnerConnection.fields.uncertainOperations"), String(b.uncertainOperations)],
          [t("runnerComponents.museRunnerConnection.fields.pendingAnswers"), String(b.pendingInputs)],
          [t("runnerComponents.museRunnerConnection.fields.usageAndCost"), t("runnerComponents.museRunnerConnection.unavailable")],
        ].map(([label, value]) => <div key={label} className="flex flex-wrap items-baseline justify-between gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="font-mono">{value}</dd></div>)}
      </dl>
      <p className="text-xs text-muted-foreground">{t("runnerComponents.museRunnerConnection.lagNote", { seconds: Math.ceil(b.contactPersistenceLagMs / 1000) })}</p>
      {b.status === "revoked" && <p role="status" className="text-sm text-muted-foreground">{t("runnerComponents.museRunnerConnection.disconnected")}</p>}
      {(b.cleanup.pending || b.status === "revoked") && <div className="space-y-2 text-sm text-muted-foreground">
        {"detectorRemovalRequested" in b.cleanup && b.cleanup.detectorRemovalRequested === true && !b.cleanup.detectorRemoved && <p>{t("runnerComponents.museRunnerConnection.cleanup.removalRequested")}</p>}
        <p>{t("runnerComponents.museRunnerConnection.cleanup.statusSummary", {
          detector: b.cleanup.detectorEvidence?.source === "operator_runtime_attestation" ? t("runnerComponents.museRunnerConnection.cleanup.operatorAttested") : b.cleanup.detectorRemoved ? t("runnerComponents.museRunnerConnection.cleanup.acknowledged") : t("runnerComponents.museRunnerConnection.cleanup.notConfirmed"),
          worker: b.cleanup.workerQuiescenceReported ? t("runnerComponents.museRunnerConnection.cleanup.reported") : t("runnerComponents.museRunnerConnection.cleanup.notConfirmed"),
        })}</p>
        {b.cleanup.authenticatedAfterRevocation === false && <p>{t("runnerComponents.museRunnerConnection.cleanup.receiverDisables")}</p>}
        {b.cleanup.expiresAt && <p className="text-xs">{t("runnerComponents.museRunnerConnection.cleanup.capabilityExpires", { date: formatDateTime(b.cleanup.expiresAt) })}</p>}
        {b.cleanup.detectorEvidence && <p>{t("runnerComponents.museRunnerConnection.cleanup.recorded", { recordedAt: timestamp(b.cleanup.detectorEvidence.recordedAt), source: b.cleanup.detectorEvidence.source === "operator_runtime_attestation" ? t("runnerComponents.museRunnerConnection.cleanup.sourceOperator") : t("runnerComponents.museRunnerConnection.cleanup.sourceWorker") })}</p>}
        {b.cleanup.attestationEligible && onAttestDetectorCleanup && !detectorSnapshot && <Button type="button" variant="outline" disabled={busy || offline} onClick={() => {
          if (!b.cleanup.hookScript) return;
          setDetectorSnapshot({ bindingId: b.id, generation: b.generation, expectedRevision: b.revision, qualificationId: b.qualification?.id ?? null, hookScript: b.cleanup.hookScript });
        }}>{t("runnerComponents.museRunnerConnection.cleanup.recordObservation")}</Button>}
        <p>{t("runnerComponents.museRunnerConnection.cleanup.boundaries")}</p>
      </div>}
      {b.stop.status !== "none" && <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">{b.stop.status === "operator_attested" ? t("runnerComponents.museRunnerConnection.stop.operatorAttested")
          : b.stop.status === "worker_reported" ? t("runnerComponents.museRunnerConnection.stop.workerReported")
          : t("runnerComponents.museRunnerConnection.stop.fenced")}</p>
        {b.stop.nativeEffectsUnknown && <p role="status" className="text-muted-foreground">{t("runnerComponents.museRunnerConnection.stop.unknownEffects")}</p>}
        {b.stop.boundary && stopBindingRevision == null && b.stop.status !== "operator_attested" && <p role="status" className="text-muted-foreground">{t("runnerComponents.museRunnerConnection.stop.bindingUnavailable")}</p>}
        {b.stop.boundary && b.stop.status !== "operator_attested" && !attestation && <Button type="button" variant="outline" disabled={busy || stopBindingRevision == null} onClick={() => {
          if (!b.stop.boundary || stopBindingRevision == null) return;
          setAttestation({ boundary: { ...b.stop.boundary }, expectedRevision: stopBindingRevision, workerStopped: true }); setConfirmed(false);
        }}>{t("runnerComponents.museRunnerConnection.stop.attest")}</Button>}
      </div>}
    </>}
    {detectorSnapshot && <section aria-label={t("runnerComponents.museRunnerConnection.detector.sectionLabel")} className="space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium">{t("runnerComponents.museRunnerConnection.detector.title")}</p>
      <p className="break-all font-mono text-xs">{detectorSnapshot.hookScript}</p>
      <p className="text-sm text-muted-foreground"><Trans i18nKey="runnerComponents.museRunnerConnection.detector.instruction" components={{ code: <code /> }} /></p>
      <label className="block space-y-2 text-sm">{t("runnerComponents.museRunnerConnection.detector.hookIdLabel")}<Input aria-label={t("runnerComponents.museRunnerConnection.detector.hookIdAria")} value={detectorHookId} onChange={event => { setDetectorHookId(event.target.value); setDetectorConfirmed(false); }} autoComplete="off" /></label>
      <label className="block space-y-2 text-sm">{t("runnerComponents.museRunnerConnection.detector.shaLabel")}<Input aria-label={t("runnerComponents.museRunnerConnection.detector.shaAria")} value={observationDigest} onChange={event => { setObservationDigest(event.target.value); setDetectorConfirmed(false); }} autoComplete="off" /></label>
      <p className="text-xs text-muted-foreground">{t("runnerComponents.museRunnerConnection.detector.digestNote")}</p>
      <label className="block space-y-2 text-sm">{t("runnerComponents.museRunnerConnection.detector.observedAtLabel")}<Input aria-label={t("runnerComponents.museRunnerConnection.detector.observedAtAria")} value={detectorObservedAt} onChange={event => { setDetectorObservedAt(event.target.value); setDetectorConfirmed(false); }} placeholder="YYYY-MM-DDTHH:mm:ss.sssZ" autoComplete="off" /></label>
      <p className="text-xs text-muted-foreground">{t("runnerComponents.museRunnerConnection.detector.observedAtNote")}</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={detectorConfirmed} onChange={event => setDetectorConfirmed(event.target.checked)} className="mt-1 accent-primary" /><span>{t("runnerComponents.museRunnerConnection.detector.confirm")}</span></label>
      <div className="flex items-center justify-between gap-3"><Button type="button" variant="ghost" onClick={() => setDetectorSnapshot(null)}>{t("common.actions.cancel")}</Button><Button type="button" disabled={!detectorConfirmed || !detectorObservedAtValid || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(detectorHookId) || !/^[a-f0-9]{64}$/.test(observationDigest) || busy || offline} onClick={() => onAttestDetectorCleanup?.({ ...detectorSnapshot, detectorRemoved: true, observation: { method: "hooks.list", includeDisabled: true, hookId: detectorHookId, outcome: "exact_hook_absent", observedAt: detectorObservedAt, sha256: observationDigest } })}>{t("runnerComponents.museRunnerConnection.detector.submit")}</Button></div>
    </section>}
    {attestation && <section aria-label={t("runnerComponents.museRunnerConnection.attest.sectionLabel")} className="space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium">{t("runnerComponents.museRunnerConnection.attest.title")}</p>
      <dl className="space-y-2 text-xs">
        {Object.entries(attestation.boundary).map(([key, value]) => <div key={key} className="flex flex-wrap items-baseline justify-between gap-2"><dt className="text-muted-foreground">{key}</dt><dd className="break-all font-mono">{value === null ? t("runnerComponents.museRunnerConnection.attest.none") : String(value)}</dd></div>)}
      </dl>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 accent-primary" /><span>{t("runnerComponents.museRunnerConnection.attest.confirm")}</span></label>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setAttestation(null)}>{t("common.actions.cancel")}</Button>
        <Button type="button" disabled={!confirmed || busy} onClick={() => onAttest(attestation)}>{t("runnerComponents.museRunnerConnection.attest.submit")}</Button>
      </div>
    </section>}
    {pairing && !b?.paired && <div className="space-y-2">
      <AgentSetupPrompt key={pairing.bindingId + pairing.revision} prompt={pairing.setupInstruction} label={t("runnerComponents.museRunnerConnection.pairing.copyPrompt")} title={t("runnerComponents.museRunnerConnection.pairing.title")} agent={{ name: "Muse", icon: <Bot className="size-5" /> }} description={t("runnerComponents.museRunnerConnection.pairing.description")} />
      <p className="text-xs text-muted-foreground">{t("runnerComponents.museRunnerConnection.pairing.expires", { date: formatDateTime(pairing.expiresAt) })}</p>
    </div>}
    <div className="flex flex-wrap items-center gap-2">
      {live && <Button type="button" variant="outline" disabled={!configure || b.credentialState !== "active" || !b.paired || busy || testing} onClick={onTest}>{testing ? t("runnerComponents.museRunnerConnection.actions.testingReply") : t("runnerComponents.museRunnerConnection.actions.testReply")}</Button>}
      <Button type="button" variant="outline" disabled={!configure || busy} onClick={onRepair}>{b?.credentialState === "expired" ? t("runnerComponents.museRunnerConnection.actions.reconnect") : live ? t("runnerComponents.museRunnerConnection.actions.repair") : t("runnerComponents.museRunnerConnection.actions.connect")}</Button>
      {connection.agentStatus !== "paused" && connection.agentStatus !== "terminated" && <Button type="button" variant="outline" disabled={busy} onClick={onPause}>{t("runnerComponents.museRunnerConnection.actions.pauseAgent")}</Button>}
      {live && <Button type="button" variant="outline" disabled={busy} onClick={onDisconnect}>{t("runnerComponents.museRunnerConnection.actions.disconnect")}</Button>}
      <Button type="button" variant="ghost" disabled={busy} onClick={onRefresh}>{t("runnerComponents.museRunnerConnection.actions.refresh")}</Button>
      <Button type="button" asChild variant="ghost"><a href="https://muse.ai" target="_blank" rel="noopener noreferrer">{t("runnerComponents.museRunnerConnection.actions.openMuse")}</a></Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}

export function MuseRunnerConnection({ companyId, agentId }: { companyId?: string; agentId?: string }) {
  const { t } = useTranslation();
  const cache = useQueryClient();
  const muse = useMuseConnection(companyId, agentId);
  const pause = useMutation({ mutationFn: () => agentsApi.pause(agentId!, companyId), onSuccess: () => {
    void muse.refresh(); void cache.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId!) });
    if (companyId) void cache.invalidateQueries({ queryKey: queryKeys.agents.list(companyId) });
  } });
  if (!agentId) return <p className="text-sm text-muted-foreground">{t("runnerComponents.museRunnerConnection.saveFirst")}</p>;
  const error = muse.state.error ?? muse.pair.error ?? muse.verify.error ?? muse.revoke.error ?? muse.attest.error ?? muse.attestDetector.error ?? pause.error;
  if (muse.identity.failed) return <div className="space-y-3"><p role="alert" className="text-sm text-destructive">{t("runnerComponents.museRunnerConnection.identityFailed")}</p><Button type="button" variant="outline" onClick={() => { void cache.invalidateQueries({ queryKey: queryKeys.auth.session }); }}>{t("runnerComponents.museRunnerConnection.actions.refresh")}</Button></div>;
  if (!muse.state.data) return <div className="space-y-3"><p role="status" className="text-sm text-muted-foreground">{muse.state.error ? t("runnerComponents.museRunnerConnection.loadFailed") : t("runnerComponents.museRunnerConnection.loading")}</p>{error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}<Button type="button" variant="outline" onClick={() => { void muse.state.refetch(); }}>{t("runnerComponents.museRunnerConnection.actions.refresh")}</Button></div>;
  return <MuseConnectionDetails key={muse.identity.userId} connection={muse.state.data} pairing={muse.pairing} offline={muse.state.isError}
    busy={muse.pair.isPending || muse.verify.isPending || muse.revoke.isPending || muse.attest.isPending || muse.attestDetector.isPending || pause.isPending}
    error={error?.message} onTest={() => { if (muse.binding) muse.verify.mutate(muse.binding); }} onRepair={muse.repair}
    onPause={() => pause.mutate()} onDisconnect={() => { if (muse.binding) muse.revoke.mutate(muse.binding); }}
    onRefresh={() => { void muse.state.refetch(); }} onAttest={input => muse.attest.mutate(input)} onAttestDetectorCleanup={input => muse.attestDetector.mutate(input)} />;
}
