import { useId } from "react";
import { useTranslation } from "@/i18n";
import { Check, Circle, Loader2 } from "lucide-react";
import { AGENT_ROLES, type CreateGrokInvitation, type DotPairing, type GrokConnection } from "@paperclipai/shared";
import { AdapterMark } from "../AdapterMark";
import { AgentSetupPrompt } from "../AgentSetupPrompt";
import { Button, buttonVariants } from "../ui/button";
import { CopyText } from "../CopyText";
import { Input } from "../ui/input";
import { NativeSelect } from "../ui/select";
import { DialogDescription, DialogTitle } from "../ui/dialog";
import { buildGrokAccessPrompt, buildGrokRoutinePrompt } from "@/lib/grok-bot-setup-prompt";
import { Link } from "@/lib/router";

export type GrokSetupStep = 0 | 1 | 2 | 3;
export interface GrokBotSetupContentProps {
  step: GrokSetupStep; companyName: string; details: CreateGrokInvitation;
  created: boolean; loading?: boolean; busy?: boolean; error?: string;
  managers: Array<{ id: string; name: string }>;
  connection?: GrokConnection; pairing: DotPairing | null; approvalHref?: string;
  webhookUrl: string; webhookKey: string; editingCredentials?: boolean;
  onEditCredentials?: () => void;
  onDetails: (details: CreateGrokInvitation) => void;
  onCredentials: (url: string, key: string) => void;
  onBack: () => void; onExit: () => void; onNext: () => void; onRetry: () => void;
}
const steps = ["identify", "access", "assignments", "verify"] as const;
export function GrokBotSetupContent(p: GrokBotSetupContentProps) {
  const { t, i18n } = useTranslation();
  const pairingCodeId = useId();
  const binding = p.connection?.binding;
  const routine = binding?.routine;
  const exchange = routine?.lastExchange;
  const delivered = exchange?.status === "accepted" || exchange?.status === "acknowledged";
  const replied = !!routine?.verified && exchange?.status === "acknowledged";
  const ready = replied && p.connection?.agentLifecycleState === "ready" && !!p.connection.canConfigureConnection && !routine?.recoveryNeeded;
  const pending = exchange && ["prepared", "sending", "accepted"].includes(exchange.status) && Date.parse(exchange.expiresAt) > Date.now();
  const nextDisabled = p.busy || p.loading || !!p.approvalHref
    || p.step === 0 && (!p.details.name.trim() || !p.details.botName.trim())
    || p.step === 1 && !binding?.connected
    || p.step === 2 && ((!routine?.configured || p.editingCredentials) && (!p.webhookUrl || !p.webhookKey))
    || p.step === 3 && !ready && (!!pending || !!routine?.recoveryNeeded || !!replied);
  return <>
    <div className="min-h-0 space-y-6 overflow-y-auto px-6 pb-6 pt-8 sm:px-8">
      <div className="space-y-3 pr-5">
        <AdapterMark type="grok_bot" className="size-10" />
        <DialogTitle className="text-xl font-semibold tracking-tight">{t(ready ? "agentSetupPage.grokBot.connectedTitle" : "agentSetupPage.grokBot.connectTitle")}</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed">{t(ready ? "agentSetupPage.grokBot.readySubtitle" : "agentSetupPage.grokBot.introSubtitle", { botName: p.details.botName, company: p.companyName })}</DialogDescription>
      </div>
      <ol aria-label={t("agentSetupPage.grokBot.setupAria")} className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
        {steps.map((key, index) => <li key={key} aria-current={p.step === index ? "step" : undefined} className={p.step === index ? "font-medium text-foreground" : ""}>{index + 1}. {t(`agentSetupPage.grokBot.steps.${key}`)}</li>)}
      </ol>
      {p.error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{p.error}</p><Button variant="outline" disabled={p.busy} onClick={p.onRetry}>{t("agentSetupPage.common.tryAgain")}</Button></div>}
      {p.loading ? <p role="status" className="text-sm text-muted-foreground">{t("agentSetupPage.grokBot.restoring")}</p> : p.approvalHref ? <p className="text-sm text-muted-foreground">{t("agentSetupPage.grokBot.approvalPending")}</p> : <>
        {p.step === 0 && <div className="space-y-4">
          <label className="block space-y-2 text-sm"><span>{t("agentSetupPage.grokBot.paperclipName")}</span><Input value={p.details.name} disabled={p.created} onChange={e => p.onDetails({ ...p.details, name: e.target.value })} autoComplete="off" maxLength={100} /></label>
          <label className="block space-y-2 text-sm"><span>{t("agentSetupPage.grokBot.botName")}</span><Input value={p.details.botName} disabled={p.created} onChange={e => p.onDetails({ ...p.details, botName: e.target.value })} autoComplete="off" maxLength={100} /></label>
          <p className="text-xs text-muted-foreground">{t("agentSetupPage.grokBot.botNameHint")}</p>
          <label className="block space-y-2 text-sm"><span>{t("agentSetupPage.common.role")}</span><NativeSelect disabled={p.created} value={p.details.role ?? "general"} onChange={e => p.onDetails({ ...p.details, role: e.target.value as CreateGrokInvitation["role"] })}>{AGENT_ROLES.map(role => <option key={role} value={role}>{t(`agentSetupPage.externalInvite.roles.${role}`)}</option>)}</NativeSelect></label>
          <label className="block space-y-2 text-sm"><span>{t("agentSetupPage.grokBot.manager")}</span><NativeSelect disabled={p.created} value={p.details.reportsTo ?? ""} onChange={e => p.onDetails({ ...p.details, reportsTo: e.target.value || null })}><option value="">{t("agentSetupPage.grokBot.noManager")}</option>{p.managers.map(manager => <option key={manager.id} value={manager.id}>{manager.name}</option>)}</NativeSelect></label>
        </div>}
        {p.step === 1 && <div className="space-y-4 text-sm">
          <p>{t("agentSetupPage.grokBot.copyConnectionInstructions")}</p>
          {p.connection?.resourceUrl && <AgentSetupPrompt prompt={buildGrokAccessPrompt(p.connection.resourceUrl, p.details.botName)} label={t("agentSetupPage.grokBot.copyConnectionInstructionsButton")} title={t("agentSetupPage.grokBot.connectAccessTitle")} description={t("agentSetupPage.grokBot.connectAccessDescription")} />}
          {!binding?.connected && p.pairing && <div className="space-y-2">
            <label htmlFor={pairingCodeId}>{t("agentSetupPage.grokBot.pairingCode")}</label>
            <div className="flex items-center gap-2">
              <Input id={pairingCodeId} value={p.pairing.pairingCode} readOnly type="password" autoComplete="off" />
              <CopyText text={p.pairing.pairingCode} ariaLabel={t("agentSetupPage.grokBot.copyPairingCode")} className={buttonVariants({ variant: "outline", size: "sm" })}>{t("agentSetupPage.grokBot.copyCode")}</CopyText>
            </div>
            <p className="text-xs text-muted-foreground">{t("agentSetupPage.grokBot.pairingCodeNote", { time: new Date(p.pairing.expiresAt).toLocaleTimeString(i18n.language) })}</p>
          </div>}
          <p role="status" aria-live="polite" className="text-muted-foreground">{t(binding?.connected ? "agentSetupPage.grokBot.accessConnected" : "agentSetupPage.grokBot.watchingAuthorization")}</p>
          <p className="text-xs text-muted-foreground">{t("agentSetupPage.grokBot.accountWideNotice")}</p>
        </div>}
        {p.step === 2 && <div className="space-y-4 text-sm">
          <p>{t("agentSetupPage.grokBot.routineIntro")}</p>
          {binding && <AgentSetupPrompt prompt={buildGrokRoutinePrompt(binding.id, p.details.botName)} label={t("agentSetupPage.grokBot.copyRoutineInstructions")} title={t("agentSetupPage.grokBot.enableAssignmentsTitle")} description={t("agentSetupPage.grokBot.enableAssignmentsDescription")} />}
          <p className="text-xs text-muted-foreground">{t("agentSetupPage.grokBot.routineHelp")}</p>
          {routine?.configured && !p.editingCredentials && !p.webhookUrl && !p.webhookKey ? <div className="space-y-2"><p role="status" className="text-muted-foreground">{t("agentSetupPage.grokBot.routineStored")}</p>{p.onEditCredentials && <Button variant="outline" onClick={p.onEditCredentials} disabled={p.busy}>{t("agentSetupPage.grokBot.replaceRoutineCredentials")}</Button>}</div> : <>
            <label className="block space-y-2"><span>{t("agentSetupPage.grokBot.webhookUrl")}</span><Input value={p.webhookUrl} onChange={e => p.onCredentials(e.target.value, p.webhookKey)} type="password" autoComplete="off" spellCheck={false} /></label>
            <label className="block space-y-2"><span>{t("agentSetupPage.grokBot.webhookKey")}</span><Input value={p.webhookKey} onChange={e => p.onCredentials(p.webhookUrl, e.target.value)} type="password" autoComplete="off" spellCheck={false} /></label>
          </>}
          <p className="text-xs text-muted-foreground">{t("agentSetupPage.grokBot.credentialsNote")}</p>
        </div>}
        {p.step === 3 && <section aria-label={t("agentSetupPage.grokBot.checksAria")} className="space-y-4 text-sm">
          {[{ key: "assignmentDelivered", done: delivered }, { key: "replyReceived", done: replied }].map(check => <p key={check.key} className="flex items-center gap-3">{check.done ? <Check className="size-4" /> : pending ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Circle className="size-4 text-muted-foreground" />}{t(`agentSetupPage.grokBot.${check.key}`)}<span className="text-muted-foreground">{t(check.done ? "agentSetupPage.grokBot.complete" : "agentSetupPage.grokBot.waiting")}</span></p>)}
          <p role="status" aria-live="polite" className="text-muted-foreground">{t(routine?.recoveryNeeded ? "agentSetupPage.grokBot.recoveryNeeded" : ready ? "agentSetupPage.grokBot.bothVerified" : replied ? "agentSetupPage.grokBot.finishingSetup" : exchange?.status === "rejected" ? "agentSetupPage.grokBot.deliveryRejected" : delivered ? "agentSetupPage.grokBot.deliveryAccepted" : "agentSetupPage.grokBot.sendChallenge")}</p>
          <p className="text-xs text-muted-foreground">{t("agentSetupPage.grokBot.externalNotice")}</p>
        </section>}
      </>}
    </div>
    <div className="flex items-center justify-between gap-3 border-t px-6 py-4 sm:px-8">
      <div className="flex items-center gap-2"><Button variant="ghost" onClick={p.onBack} disabled={p.busy}>{t("agentSetupPage.common.back")}</Button><Button variant="ghost" onClick={p.onExit} disabled={p.busy}>{t("agentSetupPage.externalInvite.content.saveAndExit")}</Button></div>
      {p.approvalHref ? <Button asChild><Link to={p.approvalHref} onClick={p.onExit}>{t("agentSetupPage.grokBot.reviewApproval")}</Link></Button> : <Button onClick={p.onNext} disabled={nextDisabled}>{p.busy ? t("agentSetupPage.common.saving") : ready ? t("agentSetupPage.common.done") : p.step === 3 ? pending ? t("agentSetupPage.grokBot.waitingForReply") : replied ? t("agentSetupPage.externalInvite.content.finishingSetup") : t("agentSetupPage.grokBot.verifyConnection") : t("agentSetupPage.common.continue")}</Button>}
    </div>
  </>;
}
