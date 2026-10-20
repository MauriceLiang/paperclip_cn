import { InlineBanner } from "@/components/InlineBanner";
import { webhookUrlWarningReason } from "@/lib/webhook-url-warning";
import { useTranslation } from "@/i18n";

const warningKeys = {
  loopback: "localhost",
  private: "private",
  tailscale: "tailscale",
  https: "https",
  invalid: "invalid",
} as const;

export function WebhookUrlWarning({ url }: { url: string }) {
  const { t } = useTranslation();
  const reason = webhookUrlWarningReason(url);
  if (!reason) return null;
  const key = warningKeys[reason];
  return <InlineBanner tone="warning" title={t(`operationsPage.routines.webhookWarnings.${key}Title`)}>
    <div className="space-y-2">
      <p>{t(`operationsPage.routines.webhookWarnings.${key}`)}</p>
      <p>{t("operationsPage.routines.webhookWarnings.continue")}</p>
      <a className="underline underline-offset-4" href="https://docs.paperclip.ing/reference/deploy/https/" target="_blank" rel="noopener noreferrer">{t("operationsPage.routines.webhookWarnings.learnHttps")}</a>
    </div>
  </InlineBanner>;
}
