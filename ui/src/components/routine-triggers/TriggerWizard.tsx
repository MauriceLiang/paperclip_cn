import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  AlertCircle,
  Globe,
  GitBranch,
  Radio,
  Webhook,
} from "lucide-react";
import {
  SetupWizardNavigation,
  SetupWizardFooter,
} from "@/components/SetupWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { t as translate, useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { AgentInstructions, CopyField } from "./WebhookFields";
import { WebhookUrlWarning } from "./WebhookUrlWarning";

export type TriggerDraft = {
  kind: "choose" | "schedule" | "webhook";
  step: number;
  availableStep: number;
  sender: "custom" | "github";
  /** Retained when resuming webhooks created before generic signed-app support. */
  signingMode?: "bearer" | "app_webhook" | "fireflies_hmac";
  frequency: string;
  time: string;
  weekday: string;
  timezone: string;
  created: boolean;
};
export const defaultTriggerDraft: TriggerDraft = {
  kind: "choose",
  step: 0,
  availableStep: 0,
  sender: "custom",
  frequency: "weekdays",
  time: "09:00",
  weekday: "Monday",
  timezone: "America/Chicago",
  created: false,
};
export function webhookAgentInstructions(
  sender: TriggerDraft["sender"],
  routineTitle: string,
  webhookUrl: string,
  webhookSecret: string,
  setupPending = true,
  signingMode: TriggerDraft["signingMode"] = "app_webhook",
) {
  const common = [
    translate("operationsPage.routines.triggerWizard.instructions.connect", { title: JSON.stringify(routineTitle) }),
    translate("operationsPage.routines.triggerWizard.instructions.url", { url: webhookUrl }),
    translate("operationsPage.routines.triggerWizard.instructions.post"),
    translate("operationsPage.routines.triggerWizard.instructions.contentType"),
  ];
  const auth =
    sender === "github"
      ? [
          translate("operationsPage.routines.triggerWizard.instructions.githubSettings"),
          translate("operationsPage.routines.triggerWizard.instructions.githubPayload"),
          translate("operationsPage.routines.triggerWizard.instructions.githubSecret", { secret: webhookSecret }),
          translate("operationsPage.routines.triggerWizard.instructions.githubSigning"),
          translate("operationsPage.routines.triggerWizard.instructions.githubEvents"),
          translate("operationsPage.routines.triggerWizard.instructions.githubTest"),
        ]
      : [
          translate("operationsPage.routines.triggerWizard.instructions.secret", { secret: webhookSecret }),
          ...(signingMode === "bearer" ? [] : [
            translate("operationsPage.routines.triggerWizard.instructions.signingSecret", { header: signingMode === "fireflies_hmac" ? "X-Hub-Signature" : "X-Hub-Signature or X-Hub-Signature-256" }),
          ]),
          ...(signingMode === "fireflies_hmac" ? [] : [
            translate("operationsPage.routines.triggerWizard.instructions.bearerHeader", { secret: webhookSecret }),
          ]),
          translate("operationsPage.routines.triggerWizard.instructions.subscribe"),
          translate("operationsPage.routines.triggerWizard.instructions.addWebhook"),
          translate("operationsPage.routines.triggerWizard.instructions.idempotency"),
          translate("operationsPage.routines.triggerWizard.instructions.example", { body: '{"event":"deployment.completed","environment":"production"}' }),
          translate("operationsPage.routines.triggerWizard.instructions.customTest"),
        ];
  return [
    ...common,
    ...auth,
    translate("operationsPage.routines.triggerWizard.instructions.checkConnection"),
    ...(setupPending
      ? [
          translate("operationsPage.routines.triggerWizard.instructions.setupOnly"),
          translate("operationsPage.routines.triggerWizard.instructions.finishSetup"),
        ]
      : [
          translate("operationsPage.routines.triggerWizard.instructions.active"),
        ]),
    translate("operationsPage.routines.triggerWizard.instructions.storeSecret"),
  ].join("\n");
}
export function describeSchedule(draft: TriggerDraft) {
  if (draft.frequency === "daily") {
    return translate("operationsPage.routines.triggerWizard.schedule.summaryDaily", { time: draft.time });
  }
  if (draft.frequency === "weekly") {
    return translate("operationsPage.routines.triggerWizard.schedule.summaryWeekly", {
      day: translate(`operationsPage.routines.triggerWizard.schedule.days.${draft.weekday.toLowerCase()}`),
      time: draft.time,
    });
  }
  return translate("operationsPage.routines.triggerWizard.schedule.summaryWeekdays", { time: draft.time });
}
export function RoutineTriggerWizard({
  initialDraft,
  onSaveExit,
  onFinish,
  onCreateWebhook,
  onRotateKey,
  routineTitle,
  routineId,
  routineActive = true,
  webhookUrl = "",
  webhookSecret = "",
  checkResult = "waiting",
}: {
  initialDraft: TriggerDraft;
  routineTitle: string;
  routineId: string;
  routineActive?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  onCreateWebhook?: (draft: TriggerDraft) => Promise<void>;
  onRotateKey?: () => Promise<void>;
  onSaveExit: (draft: TriggerDraft) => void | Promise<void>;
  onFinish: (draft: TriggerDraft) => void | Promise<void>;
  checkResult?: "waiting" | "received" | "rejected" | "no_event";
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { setBreadcrumbs } = useBreadcrumbs();
  const perform = useCallback(
    async (action: () => void | Promise<void>) => {
      if (busy) return;
      setBusy(true);
      setSaveError("");
      try {
        await action();
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : translate("operationsPage.routines.triggerWizard.errors.saveFailed"),
        );
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );
  const saveAndExit = useCallback(() => {
    void perform(() => onSaveExit(draft));
  }, [draft, onSaveExit, perform]);
  const addTriggerLabel = t("operationsPage.routines.editor.triggers.addTrigger");
  useEffect(() => {
    setBreadcrumbs([
      {
        label: routineTitle,
        href: `/routines/${routineId}/triggers`,
        onClick: (event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          event.preventDefault();
          saveAndExit();
        },
      },
      { label: addTriggerLabel },
    ]);
  }, [addTriggerLabel, saveAndExit, setBreadcrumbs, routineTitle, routineId]);
  const schedule = draft.kind === "schedule";
  const github = draft.sender === "github";
  const labels = schedule
    ? [t("operationsPage.routines.triggerWizard.steps.choose"), t("operationsPage.routines.triggerWizard.steps.schedule"), t("operationsPage.routines.triggerWizard.steps.reviewSchedule")]
    : [t("operationsPage.routines.triggerWizard.steps.choose"), t("operationsPage.routines.triggerWizard.steps.connectApp"), t("operationsPage.routines.triggerWizard.steps.checkConnection")];
  function patch(values: Partial<TriggerDraft>) {
    setDraft((current) => ({ ...current, ...values }));
  }
  function advance() {
    void perform(async () => {
      if (draft.kind === "webhook" && draft.step === 0 && !draft.created)
        await onCreateWebhook?.(draft);
      const step = draft.step + 1;
      patch({
        step,
        availableStep: Math.max(draft.availableStep, step),
        created:
          draft.created || (draft.kind === "webhook" && draft.step === 0),
      });
    });
  }
  const title =
    draft.step === 0
      ? t("operationsPage.routines.triggerWizard.title.choose")
      : schedule
        ? draft.step === 1
          ? t("operationsPage.routines.triggerWizard.title.setSchedule")
          : t("operationsPage.routines.triggerWizard.title.reviewSchedule")
        : draft.step === 1
          ? github ? t("operationsPage.routines.triggerWizard.title.connectGithub") : t("operationsPage.routines.triggerWizard.title.connectApp")
          : t("operationsPage.routines.triggerWizard.title.checkConnection");
  const subtitle =
    draft.step === 0
      ? t("operationsPage.routines.triggerWizard.subtitle.choose", { title: routineTitle })
      : schedule
        ? draft.step === 1
          ? t("operationsPage.routines.triggerWizard.subtitle.chooseSchedule")
          : t("operationsPage.routines.triggerWizard.subtitle.reviewSchedule")
        : draft.step === 1
          ? t("operationsPage.routines.triggerWizard.subtitle.connectApp")
          : t("operationsPage.routines.triggerWizard.subtitle.testConnection");
  const selectClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  const goBack = (
    <Button variant="outline" onClick={() => patch({ step: draft.step - 1 })}>
      {t("operationsPage.routines.triggerWizard.buttons.back")}
    </Button>
  );
  return (
    <div className="min-w-0 w-full max-w-2xl space-y-6">
      <SetupWizardNavigation
        takeover
        disabled={busy}
        ariaLabel={t("operationsPage.routines.triggerWizard.aria")}
        labels={labels}
        step={draft.step}
        availableStep={draft.availableStep}
        onSelect={(step) => patch({ step })}
      />
      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {!schedule && draft.step > 0 && <WebhookUrlWarning url={webhookUrl} />}
        {draft.step === 0 && (
          <fieldset className="space-y-3">
            <legend className="sr-only">{t("operationsPage.routines.editor.triggers.kind")}</legend>
            {(
              [
                {
                  kind: "schedule",
                  label: t("operationsPage.routines.triggerWizard.kinds.schedule"),
                  detail: t("operationsPage.routines.triggerWizard.kinds.scheduleDetail"),
                  Icon: CalendarClock,
                },
                {
                  kind: "webhook",
                  label: t("operationsPage.routines.triggerWizard.kinds.webhook"),
                  detail: t("operationsPage.routines.triggerWizard.kinds.webhookDetail"),
                  Icon: Webhook,
                },
              ] as const
            ).map(({ kind, label, detail, Icon }) => (
              <label
                key={kind}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border p-4 focus-within:ring-2 focus-within:ring-ring",
                  draft.kind === kind
                    ? "border-primary bg-accent/30"
                    : "border-border hover:bg-accent/20",
                )}
              >
                <input
                  type="radio"
                  name="trigger-kind"
                  checked={draft.kind === kind}
                  disabled={draft.created && kind !== draft.kind}
                  onChange={() =>
                    patch({
                      kind,
                      availableStep:
                        kind === draft.kind ? draft.availableStep : 0,
                    })
                  }
                  className="sr-only"
                />
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {detail}
                  </span>
                </span>
                {draft.kind === kind && <Check className="h-4 w-4" />}
              </label>
            ))}
          </fieldset>
        )}
        {schedule && draft.step === 1 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="repeat">{t("operationsPage.routines.triggerWizard.schedule.repeat")}</Label>
                <select
                  id="repeat"
                  className={selectClass}
                  value={draft.frequency}
                  onChange={(event) => patch({ frequency: event.target.value })}
                >
                  <option value="daily">{t("operationsPage.routines.triggerWizard.schedule.everyDay")}</option>
                  <option value="weekdays">{t("operationsPage.routines.triggerWizard.schedule.weekdays")}</option>
                  <option value="weekly">{t("operationsPage.routines.triggerWizard.schedule.everyWeek")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="run-time">{t("operationsPage.routines.triggerWizard.schedule.time")}</Label>
                <Input
                  id="run-time"
                  type="time"
                  value={draft.time}
                  onChange={(event) => patch({ time: event.target.value })}
                />
              </div>
            </div>
            {draft.frequency === "weekly" && (
              <div className="space-y-2">
                <Label htmlFor="run-day">{t("operationsPage.routines.triggerWizard.schedule.day")}</Label>
                <select
                  id="run-day"
                  className={selectClass}
                  value={draft.weekday}
                  onChange={(event) => patch({ weekday: event.target.value })}
                >
                  {[
                    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
                  ].map((day) => (
                    <option key={day} value={day}>{t(`operationsPage.routines.triggerWizard.schedule.days.${day.toLowerCase()}`)}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("operationsPage.routines.triggerWizard.schedule.timezone")}</Label>
              <select
                id="timezone"
                className={selectClass}
                value={draft.timezone}
                onChange={(event) => patch({ timezone: event.target.value })}
              >
                {Array.from(
                  new Set([
                    draft.timezone,
                    "America/Chicago",
                    "America/New_York",
                    "America/Los_Angeles",
                    "Europe/London",
                    "UTC",
                  ]),
                ).map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {t("operationsPage.routines.triggerWizard.schedule.timezoneHint")}
              </p>
            </div>
          </div>
        )}
        {schedule && draft.step === 2 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-md bg-muted/40 p-4">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{describeSchedule(draft)}</p>
                <p className="text-xs text-muted-foreground">
                  {draft.timezone}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("operationsPage.routines.triggerWizard.schedule.scheduleCreatesTask")}
            </p>
          </div>
        )}
        {draft.step === 0 && draft.kind === "webhook" && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              {t("operationsPage.routines.triggerWizard.schedule.weekdaysQuestion")}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    sender: "custom",
                    label: t("operationsPage.routines.triggerWizard.sender.custom"),
                    Icon: Globe,
                  },
                  { sender: "github", label: t("operationsPage.routines.triggerWizard.sender.github"), Icon: GitBranch },
                ] as const
              ).map(({ sender, label, Icon }) => (
                <label
                  key={sender}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border p-3 focus-within:ring-2 focus-within:ring-ring",
                    draft.sender === sender
                      ? "border-primary bg-accent/30"
                      : "border-border",
                    draft.created && "cursor-default",
                  )}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="sender"
                    checked={draft.sender === sender}
                    disabled={draft.created}
                    onChange={() => patch({ sender })}
                  />
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-sm">{label}</span>
                  {draft.sender === sender && <Check className="h-4 w-4" />}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {draft.kind === "webhook" && draft.step === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("operationsPage.routines.triggerWizard.schedule.publicHttps")}
          </p>
        )}
        {!schedule && draft.step === 1 && (
          <div className="space-y-5">
            {webhookSecret && (
              <AgentInstructions
                value={webhookAgentInstructions(
                  draft.sender,
                  routineTitle,
                  webhookUrl,
                  webhookSecret,
                  true,
                  draft.signingMode,
                )}
              />
            )}
            <CopyField
                  label={t(github ? "operationsPage.routines.triggerWizard.webhook.payloadUrl" : "operationsPage.routines.triggerWizard.webhook.url")}
              value={webhookUrl}
            />
            {!github && draft.signingMode !== "bearer" && (
              <p className="text-sm text-muted-foreground">
                {t("operationsPage.routines.triggerWizard.webhook.secretHint")}
                {draft.signingMode !== "fireflies_hmac" && <>
                  {" "}{t("operationsPage.routines.triggerWizard.webhook.customHeaderHint")}
                </>}
              </p>
            )}
            {webhookSecret ? (
              <CopyField
                label={t(github ? "operationsPage.routines.triggerWizard.webhook.secret" : draft.signingMode === "bearer" ? "operationsPage.routines.triggerWizard.webhook.authHeader" : "operationsPage.routines.triggerWizard.webhook.secretKey")}
                value={!github && draft.signingMode === "bearer" ? `Bearer ${webhookSecret}` : webhookSecret}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("operationsPage.routines.triggerWizard.webhook.keyHidden")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => void perform(() => onRotateKey?.())}
                >
                  {t("operationsPage.routines.triggerWizard.webhook.generateKey")}
                </Button>
              </div>
            )}
          </div>
        )}
        {!schedule && draft.step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1 rounded-md border border-border p-4">
              <p className="text-sm font-medium">{t("operationsPage.routines.triggerWizard.webhook.testOnly")}</p>
              <p className="text-sm text-muted-foreground">
                {t("operationsPage.routines.triggerWizard.webhook.setupTest")}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t("operationsPage.routines.triggerWizard.webhook.sendEvent", { sender: github ? t("operationsPage.routines.triggerWizard.sender.github") : t("operationsPage.routines.triggerWizard.sender.yourApp") })}
              </p>
              <p className="text-sm text-muted-foreground">
                {github
                  ? t("operationsPage.routines.triggerWizard.webhook.githubHelp")
                  : t("operationsPage.routines.triggerWizard.webhook.appHelp")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("operationsPage.routines.triggerWizard.webhook.keepOpen")}
              </p>
            </div>
            <div
              role="status"
              className="flex items-start gap-3 rounded-md bg-muted/40 p-4"
            >
              {checkResult === "received" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-(--status-task-done)" />
              ) : checkResult === "rejected" ? (
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              ) : (
                <Radio className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {checkResult === "received"
                    ? t("operationsPage.routines.triggerWizard.webhook.result.received")
                    : checkResult === "rejected"
                      ? t("operationsPage.routines.triggerWizard.webhook.result.rejected")
                      : checkResult === "no_event"
                        ? t("operationsPage.routines.triggerWizard.webhook.result.noEvent")
                        : t("operationsPage.routines.triggerWizard.webhook.result.waiting")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {checkResult === "received"
                    ? t("operationsPage.routines.triggerWizard.webhook.resultDetail.received")
                    : checkResult === "rejected"
                      ? t("operationsPage.routines.triggerWizard.webhook.resultDetail.rejected")
                      : t("operationsPage.routines.triggerWizard.webhook.resultDetail.waiting")}
                </p>
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">
                {t("operationsPage.routines.triggerWizard.webhook.troubleshoot")}
              </summary>
              <div className="space-y-3 pt-3">
                <p className="text-xs text-muted-foreground">
                  {t("operationsPage.routines.triggerWizard.webhook.troubleshootBody")}
                </p>
                <CopyField label={t("operationsPage.routines.triggerWizard.webhook.url")} value={webhookUrl} />
              </div>
            </details>
          </div>
        )}
        {!schedule && draft.step === 2 && (
          <p className="text-xs text-muted-foreground">
            {routineActive
              ? t("operationsPage.routines.triggerWizard.webhook.finishActive")
              : t("operationsPage.routines.triggerWizard.webhook.finishPaused")}
          </p>
        )}
        {schedule && draft.step === 2 && !routineActive && (
          <p className="text-sm text-muted-foreground">
            {t("operationsPage.routines.triggerWizard.schedule.paused")}
          </p>
        )}
        {saveError && (
          <p role="alert" className="text-sm text-destructive">
            {saveError}
          </p>
        )}
        <SetupWizardFooter onSaveExit={saveAndExit}>
          {draft.step > 0 && goBack}
          {draft.step === 0 ? (
            <Button disabled={draft.kind === "choose"} onClick={advance}>
              {t("operationsPage.routines.triggerWizard.buttons.continue")}
            </Button>
          ) : schedule ? (
            draft.step === 1 ? (
              <Button disabled={!draft.time} onClick={advance}>
                {t("operationsPage.routines.triggerWizard.buttons.reviewSchedule")}
              </Button>
            ) : (
              <Button onClick={() => void perform(() => onFinish(draft))}>
                {t("operationsPage.routines.triggerWizard.buttons.addSchedule")}
              </Button>
            )
          ) : draft.step === 1 ? (
            <Button onClick={advance}>{t("operationsPage.routines.triggerWizard.buttons.checkConnection")}</Button>
          ) : (
            <Button onClick={() => void perform(() => onFinish(draft))}>
              {checkResult === "received"
                ? t("operationsPage.routines.triggerWizard.buttons.finish")
                : t("operationsPage.routines.triggerWizard.buttons.finishWithoutChecking")}
            </Button>
          )}
        </SetupWizardFooter>
      </fieldset>
    </div>
  );
}
