import { AlertTriangle } from "lucide-react";
import type { ToolProfileWithDetails } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n";

export type ProfileActionDialogKind = "archive" | "delete" | "restore";

export function ProfileActionDialog({
  kind,
  profile,
  pending,
  onClose,
  onArchive,
  onRestore,
  onDelete,
}: {
  kind: ProfileActionDialogKind | null;
  profile: ToolProfileWithDetails | null;
  pending: boolean;
  onClose: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  if (!kind || !profile) return null;

  const defaultDeleteBlocked = kind === "delete" && profile.summary.isCompanyDefault;
  const copy = {
    archive: {
      title: t("toolsPage.profiles.actionDialog.archiveTitle"),
      body: t("toolsPage.profiles.actionDialog.archiveBody", {
        count: profile.summary.appliesToAgentCount,
      }),
      confirm: t("toolsPage.profiles.actionDialog.archiveConfirm"),
      action: onArchive,
    },
    restore: {
      title: t("toolsPage.profiles.actionDialog.restoreTitle"),
      body: t("toolsPage.profiles.actionDialog.restoreBody"),
      confirm: t("toolsPage.profiles.actionDialog.restoreConfirm"),
      action: onRestore,
    },
    delete: {
      title: t("toolsPage.profiles.actionDialog.deleteTitle"),
      body: defaultDeleteBlocked
        ? t("toolsPage.profiles.actionDialog.deleteBlockedBody")
        : t("toolsPage.profiles.actionDialog.deleteBody", {
            count: profile.summary.assignmentCount,
          }),
      confirm: t("toolsPage.profiles.actionDialog.deleteConfirm"),
      action: onDelete,
    },
  }[kind];

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        {defaultDeleteBlocked ? (
          <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("toolsPage.profiles.actionDialog.deleteBlockedHint")}</span>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button
            variant={kind === "delete" ? "destructive" : "default"}
            disabled={pending || defaultDeleteBlocked}
            onClick={copy.action}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
