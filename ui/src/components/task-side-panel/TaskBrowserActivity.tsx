import type { TaskBrowser } from "@paperclipai/shared";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";

export function TaskBrowserActivity({
  browser,
  label,
  onOpen,
}: {
  browser: TaskBrowser;
  label?: string;
  onOpen?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const displayLabel = label ?? t("chatComponents.taskBrowserActivity.browser");
  const closed = browser.status === "closed" || browser.status === "failed";
  return (
    <div className="flex flex-wrap items-center gap-2 py-1 text-sm" aria-label={t("chatComponents.taskBrowserActivity.session", { label: displayLabel })}>
      <Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span>{displayLabel}</span>
      <span className="text-muted-foreground">· {t(`chatComponents.taskBrowserActivity.status.${browser.status}`)}</span>
      {onOpen && (
        <Button variant="ghost" size="sm" onClick={() => onOpen(browser.id)}>
          {closed ? t("chatComponents.taskBrowserActivity.viewSession") : t("chatComponents.taskBrowserActivity.openBrowser")}
        </Button>
      )}
    </div>
  );
}
