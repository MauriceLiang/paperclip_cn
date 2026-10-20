import { useId, useState } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trans } from "react-i18next";
import { useTranslation } from "@/i18n";

export interface SlackAvatarProps {
  agentName: string;
  appName: string;
  avatarUrl: string;
}

/** Manual fallback shared by Slack onboarding and its Settings page. */
export function SlackAvatarContent({
  agentName,
  appName,
  avatarUrl,
  compact = false,
}: SlackAvatarProps & { compact?: boolean }) {
  const { t } = useTranslation();
  const id = useId();
  const filename = `${appName.replace(/[^a-zA-Z0-9_-]+/g, "-") || "agent"}-avatar.png`;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      const response = await fetch(avatarUrl);
      if (
        !response.ok ||
        !response.headers.get("content-type")?.startsWith("image/png")
      )
        throw new Error("Avatar unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="space-y-8">
      <section
        aria-labelledby={`${id}-download`}
        className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"
      >
        <img
          src={avatarUrl}
          width={512}
          height={512}
          alt={t("appsPage.slackAvatar.avatarAlt", { agent: agentName })}
          className="size-40 shrink-0 rounded-lg bg-muted object-contain"
        />
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 id={`${id}-download`} className="text-sm font-semibold">
              {compact
                ? t("appsPage.slackAvatar.downloadTitle")
                : t("appsPage.slackAvatar.downloadTitleNumbered")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("appsPage.slackAvatar.downloadMeta")}
            </p>
          </div>
          <Button variant="outline" asChild>
            <a
              href={avatarUrl}
              download={filename}
              aria-disabled={downloading}
              onClick={(event) => {
                event.preventDefault();
                void download();
              }}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {t("appsPage.slackAvatar.download")}
            </a>
          </Button>
          {downloadError && (
            <p role="alert" className="text-sm text-destructive">
              {t("appsPage.slackAvatar.downloadFailed")}
            </p>
          )}
        </div>
      </section>

      <details open={compact ? undefined : true} className="space-y-4">
        <summary
          className={
            compact
              ? "cursor-pointer text-sm underline underline-offset-4"
              : "hidden"
          }
        >
          {t("appsPage.slackAvatar.howToUpload")}
        </summary>
        <section aria-labelledby={`${id}-upload`} className="space-y-4">
          <div className="space-y-1">
            <h2 id={`${id}-upload`} className="text-sm font-semibold">
              {compact ? t("appsPage.slackAvatar.uploadTitle") : t("appsPage.slackAvatar.uploadTitleNumbered")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("appsPage.slackAvatar.uploadDescription")}
            </p>
          </div>
          <ol className="list-decimal space-y-3 pl-5 text-sm">
            <li>
              <Trans i18nKey="appsPage.slackAvatar.step1" values={{ appName }} components={{ lnk: <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" />, icon: <ExternalLink className="inline size-3" />, app: <strong /> }} />
            </li>
            <li>
              <Trans i18nKey="appsPage.slackAvatar.step2" components={{ strong: <strong /> }} />
            </li>
            <li>
              <Trans i18nKey="appsPage.slackAvatar.step3" values={{ filename }} components={{ strong: <strong />, file: <span className="break-all font-mono text-xs" /> }} />
            </li>
            <li>
              <Trans i18nKey="appsPage.slackAvatar.step4" components={{ strong: <strong /> }} />
            </li>
          </ol>
        </section>
      </details>
    </div>
  );
}


export function SlackAvatarSettings(props: SlackAvatarProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-4" aria-label={t("appsPage.slackAvatar.settingsAria")}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("appsPage.slackAvatar.settingsTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("appsPage.slackAvatar.settingsDescription", { agent: props.agentName })}
        </p>
      </div>
      <SlackAvatarContent {...props} compact />
    </section>
  );
}
