import type { AgentRunner, AgentRunnerChoice } from "@paperclipai/shared";
import { Field } from "./agent-config-primitives";
import { SelectPopover } from "./ui/select";
import { Button } from "./ui/button";
import { useTranslation } from "@/i18n";

export function CodexRunnerSelect({
  value,
  onChange,
  defaultRunner,
  supportedRunners = ["legacy"],
  disabled,
  pending,
  error,
  onRetry,
}: {
  value: AgentRunnerChoice;
  onChange: (value: AgentRunnerChoice) => void;
  defaultRunner?: AgentRunner;
  supportedRunners?: readonly AgentRunner[];
  disabled?: boolean;
  pending?: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const runnerNames = {
    paperclip: t("agentSetupPage.runnerSelect.paperclipRunner"),
    legacy: t("agentSetupPage.runnerSelect.legacy"),
  };
  const runnerLabel = (runner: AgentRunner) => defaultRunner === runner
    ? t("agentSetupPage.runnerSelect.runnerWithDefault", {
      runner: runnerNames[runner],
      default: t("agentSetupPage.runnerSelect.default"),
    })
    : runnerNames[runner];
  return (
    <Field label={t("agentSetupPage.runnerSelect.label")}>
      <SelectPopover
        aria-label={t("agentSetupPage.runnerSelect.label")}
        disabled={disabled}
        value={value}
        displayValue={value === "auto" ? (defaultRunner ? runnerLabel(defaultRunner) : pending ? t("agentSetupPage.runnerSelect.checking") : t("agentSetupPage.runnerSelect.unavailable")) : undefined}
        onValueChange={next => onChange(next as AgentRunnerChoice)}
        options={[
          { value: "paperclip", label: runnerLabel("paperclip"), disabled: !supportedRunners.includes("paperclip") && value !== "paperclip" },
          { value: "legacy", label: runnerLabel("legacy"), disabled: !supportedRunners.includes("legacy") && value !== "legacy" },
        ]}
      />
      {error && <div className="mt-2 space-y-2">
        <p role="alert" className="text-sm text-destructive">{error}</p>
        {onRetry && <Button type="button" variant="outline" size="sm" disabled={pending || disabled} onClick={onRetry}>{t("agentSetupPage.runnerSelect.retry")}</Button>}
      </div>}
    </Field>
  );
}
