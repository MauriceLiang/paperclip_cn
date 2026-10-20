import { Button } from "@/components/ui/button";
import { InlineBanner } from "@/components/InlineBanner";
import { ConnectionChoiceList } from "../ConnectionChoiceList";
import { useTranslation } from "@/i18n";

/** Shared presentation for account reuse, including the requested external app. */
export function RemoteMcpAccountChoice({
  providerName,
  upstreamServiceName,
  connections,
  pendingId,
  error,
  onSelect,
  onCancel,
  onConnectNew,
}: {
  providerName: string;
  upstreamServiceName?: string;
  connections: { id: string; name: string }[];
  pendingId?: string | null;
  error?: string | null;
  onSelect: (id: string) => void;
  onCancel?: () => void;
  onConnectNew: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">
          {upstreamServiceName
            ? t("toolsPage.connectFlow.remoteMcp.connectUpstreamTitle", { upstream: upstreamServiceName, provider: providerName })
            : t("toolsPage.connectFlow.remoteMcp.connect", { provider: providerName })}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("toolsPage.connectFlow.remoteMcp.accountChoice.description")}
        </p>
      </div>
      {upstreamServiceName && (
        <InlineBanner compact>
          {t("toolsPage.connectFlow.remoteMcp.accountChoice.externalProvider", { provider: providerName, upstream: upstreamServiceName })}
        </InlineBanner>
      )}
      <ConnectionChoiceList
        choices={connections.map((connection) => ({
          ...connection,
          description: t("toolsPage.connectFlow.remoteMcp.accountChoice.providerAccountAvailable"),
        }))}
        pendingId={pendingId}
        onSelect={onSelect}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          disabled={Boolean(pendingId)}
          onClick={onCancel}
        >
          {t("toolsPage.connectFlow.remoteMcp.accountChoice.cancel")}
        </Button>
        <Button disabled={Boolean(pendingId)} onClick={onConnectNew}>
          {t("toolsPage.connectFlow.remoteMcp.accountChoice.connectNew")}
        </Button>
      </div>
    </div>
  );
}
