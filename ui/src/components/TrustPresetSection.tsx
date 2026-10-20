import { useEffect, useMemo, useState } from "react";
import type { AgentPermissions, LowTrustBoundary, TrustPreset } from "@paperclipai/shared";
import type { TFunction } from "i18next";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, CollapsibleSection } from "./agent-config-primitives";
import {
  buildPermissionsForTrustPreset,
  clearSingleLowTrustBoundaryTarget,
  getLowTrustBoundary,
  getSingleLowTrustBoundaryTarget,
  getTrustPreset,
  isCeLowTrustBoundaryEditable,
  lowTrustBoundaryHasScope,
  setSingleLowTrustBoundaryTarget,
  type LowTrustBoundaryTarget,
} from "../lib/trust-policy-ui";
import { cn } from "../lib/utils";
import { useTranslation } from "@/i18n";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

const PRESET_LABEL_KEYS: Record<TrustPreset, string> = {
  standard: "settingsComponents.trustPreset.preset.standard",
  low_trust_review: "settingsComponents.trustPreset.preset.lowTrust",
};

const PRESET_DESCRIPTION_KEYS: Record<TrustPreset, string> = {
  standard: "settingsComponents.trustPreset.preset.standardDescription",
  low_trust_review: "settingsComponents.trustPreset.preset.lowTrustDescription",
};

const COUNT_KEYS = {
  project: "settingsComponents.trustPreset.count.project",
  issue: "settingsComponents.trustPreset.count.issue",
  agent: "settingsComponents.trustPreset.count.agent",
  binding: "settingsComponents.trustPreset.count.binding",
} as const;

type CountKind = keyof typeof COUNT_KEYS;

function formatCount(value: readonly unknown[] | undefined, kind: CountKind, t: TFunction) {
  const count = value?.length ?? 0;
  if (count === 0) return "-";
  return t(COUNT_KEYS[kind], { count });
}

function boundarySummary(boundary: LowTrustBoundary | null | undefined, t: TFunction) {
  const target = getSingleLowTrustBoundaryTarget(boundary);
  if (target?.type === "project") {
    return t("settingsComponents.trustPreset.boundarySummary.project", { id: target.id.slice(0, 8) });
  }
  if (target?.type === "root_issue") {
    return t("settingsComponents.trustPreset.boundarySummary.rootIssue", { id: target.id.slice(0, 8) });
  }
  if (target?.type === "issue") {
    return t("settingsComponents.trustPreset.boundarySummary.issue", { id: target.id.slice(0, 8) });
  }
  const count = (boundary?.projectIds?.length ?? 0)
    + (boundary?.rootIssueId ? 1 : 0)
    + (boundary?.issueIds?.length ?? 0);
  if (count === 0) return t("settingsComponents.trustPreset.boundarySummary.none");
  return t("settingsComponents.trustPreset.boundarySummary.many", { count });
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 text-right", value === "-" && "text-muted-foreground")}>{value}</span>
    </div>
  );
}

export interface LowTrustBoundaryCandidate {
  id: string;
  label: string;
}

type LowTrustBoundaryTargetType = LowTrustBoundaryTarget["type"];

const BOUNDARY_TARGET_LABEL_KEYS: Record<LowTrustBoundaryTargetType, string> = {
  project: "settingsComponents.trustPreset.containment.targetType.project",
  root_issue: "settingsComponents.trustPreset.containment.targetType.rootIssue",
  issue: "settingsComponents.trustPreset.containment.targetType.issue",
};

export function TrustPresetSection({
  permissions,
  onChange,
  disabled,
  companyId,
  projectCandidates = [],
  issueCandidates = [],
  candidatesLoading,
  allowSingleIssue = true,
}: {
  permissions: Partial<AgentPermissions> | null | undefined;
  onChange: (permissions: Partial<AgentPermissions>) => void;
  disabled?: boolean;
  companyId?: string | null;
  projectCandidates?: LowTrustBoundaryCandidate[];
  issueCandidates?: LowTrustBoundaryCandidate[];
  candidatesLoading?: boolean;
  allowSingleIssue?: boolean;
}) {
  const { t } = useTranslation();
  const [policyOpen, setPolicyOpen] = useState(false);
  const preset = getTrustPreset(permissions);
  const boundary = getLowTrustBoundary(permissions);
  const boundaryTarget = getSingleLowTrustBoundaryTarget(boundary);
  const [targetType, setTargetType] = useState<LowTrustBoundaryTargetType>(boundaryTarget?.type ?? "project");
  const lowTrust = preset === "low_trust_review";
  const hasScope = lowTrustBoundaryHasScope(boundary);
  const boundaryEditable = isCeLowTrustBoundaryEditable(boundary);
  const policy = permissions?.authorizationPolicy ?? null;
  const managedPermissions = useMemo(
    () => buildPermissionsForTrustPreset(permissions, preset),
    [permissions, preset],
  );

  useEffect(() => {
    if (boundaryTarget) setTargetType(boundaryTarget.type);
  }, [boundaryTarget?.type]);

  function handlePresetChange(value: string) {
    const nextPreset: TrustPreset = value === "low_trust_review" ? "low_trust_review" : "standard";
    onChange(buildPermissionsForTrustPreset(permissions, nextPreset));
  }

  function handleBoundaryTargetChange(targetId: string) {
    if (!companyId || !targetId) return;
    onChange(setSingleLowTrustBoundaryTarget(permissions, companyId, { type: targetType, id: targetId }));
  }

  function handleClearBoundary() {
    onChange(clearSingleLowTrustBoundaryTarget(permissions));
  }

  const targetCandidates = targetType === "project" ? projectCandidates : issueCandidates;
  const boundaryValue = boundaryTarget?.type === targetType ? boundaryTarget.id : "";

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{t("settingsComponents.trustPreset.heading")}</h3>
      <div className="rounded-lg border border-border p-4 space-y-3">
        <Field label={t("settingsComponents.trustPreset.presetLabel")} hint={t("settingsComponents.trustPreset.presetHint")}>
          <select
            className={inputClass}
            value={preset}
            onChange={(event) => handlePresetChange(event.target.value)}
            disabled={disabled}
          >
            <option value="standard">{t(PRESET_LABEL_KEYS.standard)}</option>
            <option value="low_trust_review">{t(PRESET_LABEL_KEYS.low_trust_review)}</option>
          </select>
        </Field>
        <p className="text-xs text-muted-foreground">{t(PRESET_DESCRIPTION_KEYS[preset])}</p>

        {lowTrust ? (
          <div
            role={hasScope ? "status" : "alert"}
            aria-live="polite"
            className={cn(
              "rounded-md border px-3 py-2.5 text-sm flex gap-2",
              hasScope
                ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-100"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {hasScope ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-medium">
                  {hasScope
                    ? t("settingsComponents.trustPreset.containment.activeTitle")
                    : t("settingsComponents.trustPreset.containment.missingTitle")}
                </p>
                <p className="mt-1 text-xs leading-5">
                  {hasScope
                    ? t("settingsComponents.trustPreset.containment.activeBody")
                    : t("settingsComponents.trustPreset.containment.missingBody")}
                </p>
              </div>
              {boundaryEditable ? (
                <div className="rounded-md border border-border/70 bg-background/70 p-3 text-foreground space-y-3">
                  <div className="grid gap-3 sm:grid-cols-(--gtc-12)">
                    <Field label={t("settingsComponents.trustPreset.containment.boundaryType")}>
                      <select
                        className={inputClass}
                        value={targetType}
                        onChange={(event) => setTargetType(event.target.value as LowTrustBoundaryTargetType)}
                        disabled={disabled}
                      >
                        <option value="project">{t(BOUNDARY_TARGET_LABEL_KEYS.project)}</option>
                        <option value="root_issue">{t(BOUNDARY_TARGET_LABEL_KEYS.root_issue)}</option>
                        {allowSingleIssue && <option value="issue">{t(BOUNDARY_TARGET_LABEL_KEYS.issue)}</option>}
                      </select>
                    </Field>
                    <Field label={t(BOUNDARY_TARGET_LABEL_KEYS[targetType])}>
                      <select
                        className={inputClass}
                        value={boundaryValue}
                        onChange={(event) => handleBoundaryTargetChange(event.target.value)}
                        disabled={disabled || !companyId || candidatesLoading || targetCandidates.length === 0}
                      >
                        <option value="">
                          {candidatesLoading
                            ? t("common.loading")
                            : targetCandidates.length === 0
                              ? t(targetType === "project"
                                ? "settingsComponents.trustPreset.containment.noProjects"
                                : "settingsComponents.trustPreset.containment.noIssues")
                              : t("settingsComponents.trustPreset.containment.selectBoundary")}
                        </option>
                        {targetCandidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {t("settingsComponents.trustPreset.containment.saveNote")}
                    </p>
                    {boundaryTarget ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={handleClearBoundary}
                        disabled={disabled}
                      >
                        {t("settingsComponents.trustPreset.containment.clearBoundary")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-border/70 bg-background/70 p-3 text-foreground">
                  <p className="text-sm font-medium">{t("settingsComponents.trustPreset.containment.managedTitle")}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("settingsComponents.trustPreset.containment.managedBody", {
                      summary: boundarySummary(boundary, t),
                    })}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("settingsComponents.trustPreset.containment.wantMore")}{" "}
                <a
                  className="underline underline-offset-2 hover:text-foreground"
                  href="https://paperclip.ing/ee"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("settingsComponents.trustPreset.containment.getEe")}
                </a>
              </p>
              <CollapsibleSection
                title={t("settingsComponents.trustPreset.viewPolicy")}
                open={policyOpen}
                onToggle={() => setPolicyOpen((open) => !open)}
              >
                <div className="divide-y divide-border/60 text-foreground">
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.preset")} value={t("settingsComponents.trustPreset.policy.presetValue")} />
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.rawOutput")} value={t("settingsComponents.trustPreset.policy.rawOutputValue")} />
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.projects")} value={formatCount(boundary?.projectIds, "project", t)} />
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.rootIssue")} value={boundary?.rootIssueId ? boundary.rootIssueId.slice(0, 8) : "-"} />
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.explicitIssues")} value={formatCount(boundary?.issueIds, "issue", t)} />
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.allowedAgents")} value={formatCount(boundary?.allowedAgentIds, "agent", t)} />
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.allowedTools")} value={boundary?.allowedToolClasses?.join(" · ") || "-"} />
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.allowedSecrets")} value={formatCount(boundary?.allowedSecretBindingIds, "binding", t)} />
                  <PolicyRow label={t("settingsComponents.trustPreset.policy.promotionTarget")} value={boundary?.outputPromotionTarget?.issueId?.slice(0, 8) ?? "-"} />
                  <PolicyRow
                    label={t("settingsComponents.trustPreset.policy.eeFields")}
                    value={Object.keys(policy ?? {}).some((key) => !["trustPreset", "reviewPreset", "trustBoundary"].includes(key))
                      ? t("settingsComponents.trustPreset.policy.eeFieldsPreserved")
                      : "-"}
                  />
                </div>
              </CollapsibleSection>
            </div>
          </div>
        ) : null}

        {managedPermissions.authorizationPolicy?.reviewPreset ? null : (
          <p className="text-xs text-muted-foreground">
            {t("settingsComponents.trustPreset.advancedEditable")}
          </p>
        )}
      </div>
    </div>
  );
}
