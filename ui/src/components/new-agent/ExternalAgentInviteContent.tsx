import { useId } from "react";
import { AGENT_ROLES } from "@paperclipai/shared";
import { useTranslation } from "@/i18n";
import type { MuseInvitationDraft } from "@/lib/muse-invitation-draft";
import { Input } from "../ui/input";
import { Link } from "@/lib/router";
import { ArrowLeft, Bot, Check, Circle, CircleAlert, Loader2 } from "lucide-react";
import { AdapterMark } from "../AdapterMark";
import { AgentSetupPrompt } from "../AgentSetupPrompt";
import { Button } from "../ui/button";
import { DialogDescription, DialogTitle } from "../ui/dialog";
import { cn } from "@/lib/utils";

export type ExternalAgentPreset = "dot" | "grok_bot" | "muse" | "hermes" | "other";
export type DotConnectionState = {
  phase: "waiting" | "connected" | "subscribed" | "testing" | "finishing" | "ready";
  problem?: "event_timeout" | "prompt_unavailable" | "offline" | "agent_unavailable";
};

const presets = [
  { id: "dot", nameKey: "dot", descriptionKey: "dot", adapter: "openai_dot" },
  { id: "grok_bot", nameKey: "grokBot", descriptionKey: "grokBot", adapter: "grok_bot" },
  { id: "muse", nameKey: "muse", descriptionKey: "muse", adapter: "muse" },
  { id: "hermes", nameKey: "hermes", descriptionKey: "hermes", adapter: "hermes_gateway" },
  { id: "other", nameKey: "other", descriptionKey: "other", adapter: "http" },
] as const;

export function ExternalAgentPresetPicker({ onSelect, dotDisabledReason, grokDisabledReason, museEnabled = false }: { onSelect: (preset: ExternalAgentPreset) => void; dotDisabledReason?: string; grokDisabledReason?: string; museEnabled?: boolean }) {
  const { t } = useTranslation();
  return <div className={cn("grid grid-cols-2 gap-3", !museEnabled && "sm:grid-cols-4")}>
    {presets.filter(preset => preset.id !== "muse" || museEnabled).map(preset => <button
      key={preset.id}
      type="button"
      onClick={() => onSelect(preset.id)}
      disabled={preset.id === "dot" && !!dotDisabledReason || preset.id === "grok_bot" && !!grokDisabledReason}
      title={preset.id === "dot" ? dotDisabledReason : preset.id === "grok_bot" ? grokDisabledReason : undefined}
      className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-3 py-4 text-center transition-colors disabled:opacity-50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <AdapterMark type={preset.adapter} className="size-8" />
      <span className="text-sm font-medium">{t(`agentSetupPage.externalInvite.presetNames.${preset.nameKey}`)}</span>
      <span className="sr-only">{t(`agentSetupPage.externalInvite.presets.${preset.descriptionKey}`)}</span>
    </button>)}
  </div>;
}

const checks = [
  { titleKey: "connectedTitle", descriptionKey: "connectedDescription" },
  { titleKey: "updatesTitle", descriptionKey: "updatesDescription" },
  { titleKey: "testTitle", descriptionKey: "testDescription" },
];

/** Controlled by server evidence in the invite controller, never by copying a prompt. */
export function DotConnectionChecks({ state }: { state: DotConnectionState }) {
  const { t } = useTranslation();
  const completed = { waiting: 0, connected: 1, subscribed: 2, testing: 2, finishing: 3, ready: 3 }[state.phase];
  const problemMessageKeys: Record<NonNullable<DotConnectionState["problem"]>, string> = {
    agent_unavailable: "agentUnavailable",
    offline: "offline",
    prompt_unavailable: "promptUnavailable",
    event_timeout: "eventTimeout",
  };
  const phaseMessageKeys: Record<DotConnectionState["phase"], string> = {
    waiting: "watching",
    connected: "connectedPhase",
    subscribed: "confirming",
    testing: "confirming",
    finishing: "finishing",
    ready: "ready",
  };
  const message = t(`agentSetupPage.externalInvite.dotChecks.${state.problem
    ? problemMessageKeys[state.problem]
    : phaseMessageKeys[state.phase]}`);
  return <section aria-label={t("agentSetupPage.externalInvite.dotChecks.sectionAria")} className="space-y-4">
    <ol className="space-y-4">
      {checks.map((check, index) => {
        const done = index < completed;
        const failed = index === completed && state.problem === "event_timeout";
        const active = index === completed && !state.problem;
        const Icon = done ? Check : failed ? CircleAlert : active ? Loader2 : Circle;
        return <li key={check.titleKey} className="flex items-start gap-3" aria-current={active ? "step" : undefined}>
          <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", done ? "bg-accent text-foreground" : failed ? "text-destructive" : "text-muted-foreground")}>
            <Icon className={cn("size-4", active && "animate-spin motion-reduce:animate-none")} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className={cn("text-sm", done || active || failed ? "font-medium" : "text-muted-foreground")}>
              {t(`agentSetupPage.externalInvite.dotChecks.${check.titleKey}`)}<span className="sr-only">{t(`agentSetupPage.externalInvite.dotChecks.${done ? "complete" : failed ? "needsAttention" : active ? "inProgress" : "waiting"}`)}</span>
            </p>
            {done && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`agentSetupPage.externalInvite.dotChecks.${check.descriptionKey}`)}</p>}
          </div>
        </li>;
      })}
    </ol>
    <p role={state.problem && state.problem !== "prompt_unavailable" ? "alert" : "status"} aria-live="polite" className={cn("text-sm leading-relaxed", state.problem && state.problem !== "prompt_unavailable" ? "text-destructive" : "text-muted-foreground")}>{message}</p>
  </section>;
}

export type MuseConnectionState = {
  paired: boolean;
  receiverDetected: boolean;
  backgroundReplyVerified: boolean;
  ready: boolean;
  finishing?: boolean;
  testing?: boolean;
  problem?: "no_recent_response" | "prompt_unavailable" | "offline" | "agent_unavailable" | "disconnected" | "disabled" | "connection_expired";
};

/** Receiver contact is separate from an authenticated, independent worker reply. */
export function MuseConnectionChecks({ state }: { state: MuseConnectionState }) {
  const { t } = useTranslation();
  const milestones = [
    { titleKey: "pairedTitle", done: state.paired, descriptionKey: "pairedDescription" },
    { titleKey: "receiverTitle", done: state.receiverDetected, descriptionKey: "receiverDescription" },
    { titleKey: "verifiedTitle", done: state.backgroundReplyVerified, descriptionKey: "verifiedDescription" },
  ];
  const checksPassed = milestones.every(item => item.done);
  const problemMessageKeys: Record<NonNullable<MuseConnectionState["problem"]>, string> = {
    offline: "offline",
    disconnected: "disconnected",
    connection_expired: "connectionExpired",
    disabled: "disabled",
    prompt_unavailable: "promptUnavailable",
    agent_unavailable: "agentUnavailable",
    no_recent_response: "noRecentResponse",
  };
  const messageKey = state.problem
    ? problemMessageKeys[state.problem]
    : state.testing
      ? "testing"
      : checksPassed && state.ready
        ? "ready"
        : checksPassed
          ? "finishing"
          : !state.paired
            ? "waitingPair"
            : !state.receiverDetected
              ? "waitingReceiver"
              : "waitingVerified";
  const message = t(`agentSetupPage.externalInvite.museChecks.${messageKey}`);
  return <section aria-label={t("agentSetupPage.externalInvite.museChecks.sectionAria")} className="space-y-4">
    <ol className="space-y-4">
      {milestones.map(item => <li key={item.titleKey} className="flex items-start gap-3">
        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", item.done ? "bg-accent text-foreground" : "text-muted-foreground")}>
          {item.done ? <Check className="size-4" /> : <Circle className="size-4" />}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className={cn("text-sm", item.done ? "font-medium" : "text-muted-foreground")}>
            {t(`agentSetupPage.externalInvite.museChecks.${item.titleKey}`)}<span className="sr-only">{t(`agentSetupPage.externalInvite.museChecks.${item.done ? "complete" : "waiting"}`)}</span>
          </p>
          {item.done && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`agentSetupPage.externalInvite.museChecks.${item.descriptionKey}`)}</p>}
        </div>
      </li>)}
    </ol>
    <p role="status" aria-live="polite" className="text-sm leading-relaxed text-muted-foreground">{message}</p>
  </section>;
}

/** Shared presentation for the invitation flow. The caller owns invitations and watching. */
export function ExternalAgentInviteContent({
  preset, prompt, companyName, connection, onSelect, onBack, onClose, onCopied, onRetry, onNewPrompt,
  dotDisabledReason, grokDisabledReason, busy = false, error, approvalHref, museEnabled = false, museConnection, museDraft, onMuseDraftChange, onMuseContinue,
}: {
  museEnabled?: boolean;
  museConnection?: MuseConnectionState;
  museDraft?: MuseInvitationDraft;
  onMuseDraftChange?: (draft: MuseInvitationDraft) => void;
  onMuseContinue?: () => void;
  dotDisabledReason?: string;
  grokDisabledReason?: string;
  busy?: boolean;
  error?: string;
  approvalHref?: string;
  preset: ExternalAgentPreset | null;
  prompt: string;
  companyName: string;
  connection: DotConnectionState;
  onSelect: (preset: ExternalAgentPreset) => void;
  onBack: () => void;
  onClose: () => void;
  onCopied: () => void;
  onRetry: () => void;
  onNewPrompt: () => void;
}) {
  const { t } = useTranslation();
  const detailsId = useId();
  const muse = preset === "muse";
  const museDetails = muse && !!museDraft;
  const museAwaitingInvitation = muse && !museDetails && !museConnection && !approvalHref;
  const museReady = muse && !!museConnection?.ready && museConnection.paired && museConnection.receiverDetected && museConnection.backgroundReplyVerified && !museConnection.problem && !museConnection.testing;
  const provider = presets.find(item => item.id === preset);
  const dot = preset === "dot";
  const ready = museReady || (dot && connection.phase === "ready" && !connection.problem);
  const connecting = dot && connection.phase !== "waiting";
  const progressKey = connection.problem === "agent_unavailable" ? "agentUnavailable"
    : connection.problem === "offline" ? "updatesPaused"
    : connection.problem === "event_timeout" ? "needsAttention"
    : connection.phase === "finishing" ? "finishingSetup"
    : connection.phase === "connected" ? "connecting" : "confirmingConnection";
  const progressLabel = t(`agentSetupPage.externalInvite.content.${progressKey}`);
  const titleKey = !provider ? "inviteExternalAgent"
    : muse ? ready ? "museConnected" : museDetails || museAwaitingInvitation ? "inviteMuse" : "connectMuse"
    : dot ? ready ? "dotConnected" : "connectDot"
    : preset === "hermes" ? "inviteHermes" : "inviteAgent";
  const subtitleKey = !provider ? "bringAgentInto"
    : muse ? museDetails ? "museDetailsSubtitle"
      : museAwaitingInvitation ? "museNeedsInstance"
      : ready ? "museReadySubtitle"
      : !prompt && !museConnection?.paired ? "museChecking" : "musePromptInstructions"
    : ready ? "dotReadySubtitle"
    : connection.problem === "agent_unavailable" ? "dotAgentUnavailableSubtitle"
    : connection.phase === "finishing" ? "dotFinishingSubtitle"
    : connecting ? "dotConnectingSubtitle"
    : dot ? "dotPromptSubtitle"
    : preset === "hermes" ? "hermesPromptSubtitle" : "agentPromptSubtitle";
  const subtitle = t(`agentSetupPage.externalInvite.content.${subtitleKey}`, { company: companyName });
  return <>
    <div className="min-h-0 space-y-6 overflow-y-auto px-6 pb-6 pt-8 sm:px-8">
      <div className="space-y-3 pr-5">
        {muse && <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="size-4" />{t("agentSetupPage.common.back")}</Button>}
        {provider && <AdapterMark type={provider.adapter} className="size-10" />}
        <div className="space-y-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {t(`agentSetupPage.externalInvite.content.${titleKey}`)}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {subtitle}
          </DialogDescription>
        </div>
      </div>
      {error && <div role="alert" className="space-y-3 text-sm text-destructive"><p>{error}</p>{!museAwaitingInvitation && <Button variant="outline" disabled={busy} onClick={onRetry}>{t("agentSetupPage.common.tryAgain")}</Button>}</div>}
      {!provider ? <><ExternalAgentPresetPicker onSelect={onSelect} dotDisabledReason={dotDisabledReason} grokDisabledReason={grokDisabledReason} museEnabled={museEnabled} />
        {dotDisabledReason && <p className="text-sm text-muted-foreground">{dotDisabledReason}</p>}{grokDisabledReason && grokDisabledReason !== dotDisabledReason && <p className="text-sm text-muted-foreground">{grokDisabledReason}</p>}</>
        : approvalHref ? <p className="text-sm text-muted-foreground">{t("agentSetupPage.externalInvite.content.approvalPending", { who: muse ? "Muse" : "Dot" })}</p>
        : museAwaitingInvitation ? busy ? <p role="status" className="text-sm text-muted-foreground">{t("agentSetupPage.externalInvite.content.loadingMuseInvitation")}</p> : null
        : muse && busy && !museDetails && !prompt && !museConnection?.paired ? <p role="status" className="text-sm text-muted-foreground">{t("agentSetupPage.externalInvite.content.loadingMuseSetup")}</p>
        : museDetails ? <form id={detailsId} className="space-y-4" onSubmit={event => { event.preventDefault(); if (museDraft.name.trim() && !busy) onMuseContinue?.(); }}>
          <div className="space-y-2">
            <label htmlFor={`${detailsId}-name`} className="text-sm font-medium">{t("agentSetupPage.externalInvite.content.agentName")}</label>
            <Input id={`${detailsId}-name`} disabled={busy} autoFocus maxLength={100} value={museDraft.name} placeholder="Muse" onChange={event => onMuseDraftChange?.({ ...museDraft, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${detailsId}-role`} className="text-sm font-medium">{t("agentSetupPage.common.role")}</label>
            <select id={`${detailsId}-role`} disabled={busy} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={museDraft.role} onChange={event => {
              const role = AGENT_ROLES.find(value => value === event.target.value);
              if (role) onMuseDraftChange?.({ ...museDraft, role });
            }}>{AGENT_ROLES.map(role => <option key={role} value={role}>{t(`agentSetupPage.externalInvite.roles.${role}`)}</option>)}</select>
          </div>
          <p className="text-xs text-muted-foreground">{t("agentSetupPage.externalInvite.content.museUsesOwnTools")}</p>
        </form>
        : muse && museConnection ? <>
          <MuseConnectionChecks state={museConnection} />
          {museConnection.problem === "no_recent_response" && <Button variant="outline" disabled={busy} onClick={onRetry}>{t("agentSetupPage.externalInvite.content.testBackgroundReply")}</Button>}
          {museConnection.problem === "offline" && <Button variant="outline" disabled={busy} onClick={onRetry}>{t("agentSetupPage.externalInvite.content.refreshConnection")}</Button>}
          {!museConnection.paired && <a href="https://muse.ai" target="_blank" rel="noopener noreferrer" className="inline-flex text-sm text-foreground underline underline-offset-4">{t("agentSetupPage.externalInvite.content.openMuse")}</a>}
          <p className="text-xs text-muted-foreground">{t("agentSetupPage.externalInvite.content.receiverContactNote")}</p>
        </>
        : busy && !prompt && connection.phase === "waiting" ? <p role="status" className="text-sm text-muted-foreground">{t("agentSetupPage.externalInvite.content.preparingInvitation")}</p> : dot ? <>
        <div className="border-t pt-6"><DotConnectionChecks state={connection} />
          {connection.phase === "waiting" && <p className="mt-4 text-xs text-muted-foreground">{t("agentSetupPage.externalInvite.content.dotBillingNote")}</p>}</div>
        {connection.problem === "event_timeout" && <Button variant="outline" disabled={busy} onClick={onRetry}>{t("agentSetupPage.externalInvite.content.retryTestEvent")}</Button>}
        {connection.problem === "offline" && <Button variant="outline" disabled={busy} onClick={onRetry}>{t("agentSetupPage.externalInvite.content.reconnectUpdates")}</Button>}
      </> : <p className="text-sm leading-relaxed text-muted-foreground">{t("agentSetupPage.externalInvite.content.invitationIncludes", { company: companyName })}</p>}
    </div>
    <div className="flex items-center justify-between gap-3 border-t px-6 py-4 sm:px-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={muse ? onClose : provider ? onBack : onClose}>
          {provider && !muse && <ArrowLeft className="size-4" />}{t(muse ? ready ? "agentSetupPage.externalInvite.content.close" : "agentSetupPage.externalInvite.content.saveAndExit" : provider ? "agentSetupPage.common.back" : "agentSetupPage.common.cancel")}
        </Button>
      </div>
      {provider && (approvalHref ? <Button asChild><Link to={approvalHref} onClick={onClose}>{t("agentSetupPage.externalInvite.content.reviewApproval")}</Link></Button>
        : museDetails ? <Button type="submit" form={detailsId} disabled={busy || !museDraft.name.trim()}>{busy ? t("agentSetupPage.externalInvite.content.preparing") : t("agentSetupPage.common.continue")}</Button>
        : ready ? <Button onClick={onClose}>{t("agentSetupPage.externalInvite.content.done")}</Button>
        : museAwaitingInvitation ? <Button disabled={busy} onClick={onRetry}>{busy ? t("agentSetupPage.externalInvite.content.loadingSetup") : t("agentSetupPage.externalInvite.content.refreshSetup")}</Button>
        : muse ? museConnection?.problem === "disconnected" || museConnection?.problem === "connection_expired" ? <Button disabled={busy} onClick={onNewPrompt}>{t("agentSetupPage.externalInvite.content.reconnectMuse")}</Button>
          : museConnection?.problem === "prompt_unavailable" ? <Button disabled={busy} onClick={onNewPrompt}>{t("agentSetupPage.externalInvite.content.createNewPrompt")}</Button>
          : !museConnection?.paired && prompt ? <AgentSetupPrompt key={prompt} prompt={prompt} label={t("agentSetupPage.externalInvite.content.copySetupPrompt")} title={t("agentSetupPage.externalInvite.content.connectMuseTitle")} agent={{ name: "Muse", icon: <Bot className="size-5" /> }} description={t("agentSetupPage.externalInvite.content.musePromptDescription")} align="end" className="min-w-0 shrink" onCopied={onCopied} />
          : busy ? <Button disabled>{t("agentSetupPage.externalInvite.content.preparing")}</Button>
          : <Button asChild><a href="https://muse.ai" target="_blank" rel="noopener noreferrer">{t("agentSetupPage.externalInvite.content.openMuse")}</a></Button>
        : connecting ? <Button disabled aria-live="polite">
          {!connection.problem && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {progressLabel}
        </Button>
        : dot && connection.problem === "prompt_unavailable" ? <Button disabled={busy} onClick={onNewPrompt}>{t("agentSetupPage.externalInvite.content.createNewPrompt")}</Button>
        : !prompt || busy ? <Button disabled>{busy ? t("agentSetupPage.externalInvite.content.preparing") : t("agentSetupPage.externalInvite.content.waitingForDot")}</Button>
        : <AgentSetupPrompt
          key={preset}
          prompt={prompt}
          label={t(`agentSetupPage.externalInvite.content.${dot ? "copySetupPrompt" : "copyInvitationPrompt"}`)}
          title={t(`agentSetupPage.externalInvite.content.${dot ? "connectDotTitle" : "inviteAgentTitle"}`)}
          description={t(`agentSetupPage.externalInvite.content.${dot ? "dotPromptDescription" : "agentPromptDescription"}`)}
          agent={dot ? { name: "Dot", src: "/brands/adapters/openai-dot.svg" } : undefined}
          align="end"
          className="min-w-0 shrink"
          onCopied={onCopied}
        />)}
    </div>
  </>;
}
