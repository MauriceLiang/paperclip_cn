import type { ProviderTraceMetadata } from "@paperclipai/shared";
import { Bug, CircleOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export function runRequestedProviderTrace(
  contextSnapshot: Record<string, unknown> | null | undefined,
) {
  if (!contextSnapshot) return false;
  const debug = contextSnapshot.debug;
  return (
    typeof debug === "object" &&
    debug !== null &&
    !Array.isArray(debug) &&
    (debug as Record<string, unknown>).providerTrace === "raw"
  );
}

export function ProviderTraceStatusBadge({
  trace,
  requested = false,
  showOff = false,
  className,
}: {
  trace?: ProviderTraceMetadata | null;
  requested?: boolean;
  showOff?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const status = trace?.status;
  const expired = trace
    ? new Date(trace.expiresAt).getTime() <= Date.now()
    : false;
  const labelKey = expired
    ? "traceStatus.expired"
    : status === "capturing"
      ? "traceStatus.capturing"
      : status === "complete"
        ? "traceStatus.captured"
        : status === "incomplete"
          ? "traceStatus.incomplete"
          : status === "truncated"
            ? "traceStatus.truncated"
            : status === "expired"
              ? "traceStatus.expired"
              : status === "deleted"
                ? "traceStatus.deleted"
                : requested
                  ? "traceStatus.requested"
                  : showOff
                    ? "traceStatus.off"
                    : null;
  if (!labelKey) return null;
  const warning =
    status === "incomplete" ||
    status === "truncated" ||
    status === "expired" ||
    status === "deleted" ||
    expired;
  const Icon = labelKey === "traceStatus.off" ? CircleOff : Bug;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-(length:--text-micro) font-medium",
        labelKey === "traceStatus.off" || labelKey === "traceStatus.deleted" || labelKey === "traceStatus.expired"
          ? "border-border bg-background text-muted-foreground"
          : warning
            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        className,
      )}
      title={
        trace
          ? t("traceStatus.titleFrames", { frames: trace.frameCount, bytes: trace.byteCount, date: new Date(trace.expiresAt).toLocaleString() })
          : requested
            ? t("traceStatus.requestedTitle")
            : t("traceStatus.disabledTitle")
      }
    >
      <Icon className="h-3 w-3" />
      {t(labelKey)}
    </span>
  );
}
