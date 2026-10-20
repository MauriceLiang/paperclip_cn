import type { ReactNode } from "react";
import type {
  ToolRiskLevel,
  ToolConnectionHealthStatus,
  ToolPolicyDecision,
} from "@paperclipai/shared";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ApiError } from "@/api/client";
import { useTranslation } from "@/i18n";

const RISK_LABEL_KEYS: Record<string, string> = {
  read: "toolsPage.shared.badges.risk.read",
  write: "toolsPage.shared.badges.risk.write",
  destructive: "toolsPage.shared.badges.risk.destructive",
  low: "toolsPage.shared.badges.risk.low",
  medium: "toolsPage.shared.badges.risk.medium",
  high: "toolsPage.shared.badges.risk.high",
  critical: "toolsPage.shared.badges.risk.critical",
};

/** Risk classification badge for a catalog tool. */
export function RiskBadge({ risk }: { risk: ToolRiskLevel | null | undefined }) {
  const { t } = useTranslation();
  if (!risk) return <Badge variant="outline">{t("toolsPage.shared.badges.risk.unknown")}</Badge>;
  const variant =
    risk === "high" || risk === "critical"
      ? "destructive"
      : risk === "medium"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{RISK_LABEL_KEYS[risk] ? t(RISK_LABEL_KEYS[risk]) : risk}</Badge>;
}

/** Read/Write/Destructive capability chips. */
export function CapabilityBadges({
  isReadOnly,
  isWrite,
  isDestructive,
}: {
  isReadOnly?: boolean;
  isWrite?: boolean;
  isDestructive?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex flex-wrap gap-1">
      {isReadOnly ? <Badge variant="outline">{t("toolsPage.shared.badges.capability.readOnly")}</Badge> : null}
      {isWrite ? <Badge variant="secondary">{t("toolsPage.shared.badges.capability.write")}</Badge> : null}
      {isDestructive ? <Badge variant="destructive">{t("toolsPage.shared.badges.capability.destructive")}</Badge> : null}
    </span>
  );
}

/** Catalog quarantine marker — canonical status key. */
export function QuarantineBadge() {
  return <StatusBadge status="quarantined" />;
}

function healthToStatusKey(status: string): string {
  switch (status) {
    case "healthy":
    case "ok":
    case "":
      return "healthy";
    case "degraded":
    case "warning":
      return "degraded";
    case "error":
    case "unhealthy":
    case "critical":
      return "runtime-error";
    case "unchecked":
    case "unknown":
      return "unchecked";
    default:
      return status;
  }
}

const HEALTH_LABEL_KEYS: Record<string, string> = {
  healthy: "toolsPage.shared.badges.health.healthy",
  degraded: "toolsPage.shared.badges.health.degraded",
  "runtime-error": "toolsPage.shared.badges.health.runtimeError",
  unchecked: "toolsPage.shared.badges.health.unchecked",
};

/** Connection / runtime health badge, mapped onto canonical status colors. */
export function HealthBadge({
  status,
  label,
}: {
  status: ToolConnectionHealthStatus | string | null | undefined;
  label?: string;
}) {
  const { t } = useTranslation();
  const raw = (status ?? "unknown").toString();
  const statusKey = healthToStatusKey(raw);
  const labelKey = HEALTH_LABEL_KEYS[statusKey];
  return <StatusBadge status={statusKey} label={label ?? (labelKey ? t(labelKey) : raw)} />;
}

function decisionToStatusKey(decision: string): { key: string; labelKey: string | null } {
  switch (decision) {
    case "allow":
    case "allowed":
      return { key: "allowed", labelKey: "toolsPage.shared.badges.decision.allowed" };
    case "deny":
    case "denied":
      return { key: "denied", labelKey: "toolsPage.shared.badges.decision.denied" };
    case "block":
      return { key: "block", labelKey: "toolsPage.shared.badges.decision.block" };
    case "require_approval":
    case "requires_approval":
      return { key: "require-approval", labelKey: "toolsPage.shared.badges.decision.requireApproval" };
    case "redact":
    case "redacted":
      return { key: "redacted", labelKey: "toolsPage.shared.badges.decision.redacted" };
    case "rate_limited":
      return { key: "rate-limit", labelKey: "toolsPage.shared.badges.decision.rateLimited" };
    case "defer":
    case "deferred":
      return { key: "deferred", labelKey: "toolsPage.shared.badges.decision.deferred" };
    case "hidden":
      return { key: "hidden", labelKey: "toolsPage.shared.badges.decision.hidden" };
    default:
      return { key: decision, labelKey: null };
  }
}

/** Policy/gateway decision badge — canonical status colors. */
export function DecisionBadge({ decision }: { decision: ToolPolicyDecision | string | null | undefined }) {
  const { t } = useTranslation();
  if (!decision) return <Badge variant="outline">—</Badge>;
  const raw = decision.toString();
  const { key, labelKey } = decisionToStatusKey(raw);
  return <StatusBadge status={key} label={labelKey ? t(labelKey) : raw} />;
}

/** Compact relative time, falling back to absolute. */
export function RelativeTime({ value }: { value: Date | string | null | undefined }) {
  const { t } = useTranslation();
  if (!value) return <span className="text-muted-foreground">{t("toolsPage.shared.relative.never")}</span>;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return <span className="text-muted-foreground">—</span>;
  const diffMs = Date.now() - date.getTime();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const isFuture = diffMs < 0;
  let text: string;
  if (mins < 1) text = t("toolsPage.shared.relative.justNow");
  else {
    const value =
      mins < 60
        ? t("toolsPage.shared.relative.minutes", { value: mins })
        : mins < 1440
          ? t("toolsPage.shared.relative.hours", { value: Math.round(mins / 60) })
          : t("toolsPage.shared.relative.days", { value: Math.round(mins / 1440) });
    text = isFuture
      ? t("toolsPage.shared.relative.in", { value })
      : t("toolsPage.shared.relative.ago", { value });
  }
  return (
    <span title={date.toLocaleString()} className="text-muted-foreground">
      {text}
    </span>
  );
}

export function ToolsPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      {label ?? t("common.loading")}
    </div>
  );
}

/** Actionable error surface — surfaces the server message and HTTP status. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  let message: string;
  if (error instanceof ApiError) {
    if (error.status === 403) {
      message = t("toolsPage.shared.errorState.forbidden");
    } else if (error.status === 404 || /route not found/i.test(error.message)) {
      // Snapshot-skew window: the route exists in this build but not on the live server snapshot yet.
      message = t("toolsPage.shared.errorState.unavailable");
    } else {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = t("toolsPage.shared.errorState.generic");
  }
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex flex-col gap-3 py-6">
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{t("toolsPage.shared.errorState.title")}</p>
            <p className="text-destructive/80">{message}</p>
          </div>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="self-start rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {t("common.actions.retry")}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Honest notice for surfaces whose backend contract has not shipped yet.
 * This must NOT pretend to enforce anything client-side — it links the
 * follow-up issue that owns the missing contract.
 */
export function PendingBackendNotice({
  title,
  body,
  issue,
}: {
  title: string;
  body: ReactNode;
  issue?: { identifier: string; href: string };
}) {
  const { t } = useTranslation();
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-2 py-8">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {title}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">{body}</p>
        {issue ? (
          <a href={issue.href} className="text-sm font-medium text-primary hover:underline">
            {t("toolsPage.shared.pendingBackend.trackedIn", { identifier: issue.identifier })}
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
