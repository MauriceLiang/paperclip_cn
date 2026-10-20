import { useState } from "react";
import { Apple, Monitor, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

type Platform = "mac" | "windows" | "linux";

const platforms: { id: Platform; icon: typeof Apple }[] = [
  { id: "mac", icon: Apple },
  { id: "windows", icon: Monitor },
  { id: "linux", icon: Terminal },
];

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  return "linux";
}

interface PathInstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PathInstructionsModal({
  open,
  onOpenChange,
}: PathInstructionsModalProps) {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const platformLabels: Record<Platform, string> = {
    mac: t("agentSetupPage.pathInstructions.platforms.mac"),
    windows: t("agentSetupPage.pathInstructions.platforms.windows"),
    linux: t("agentSetupPage.pathInstructions.platforms.linux"),
  };
  const instructions: Record<Platform, { steps: string[]; tip: string }> = {
    mac: {
      steps: [
        t("agentSetupPage.pathInstructions.mac.steps.step1"),
        t("agentSetupPage.pathInstructions.mac.steps.step2"),
        t("agentSetupPage.pathInstructions.mac.steps.step3"),
        t("agentSetupPage.pathInstructions.mac.steps.step4"),
      ],
      tip: t("agentSetupPage.pathInstructions.mac.tip"),
    },
    windows: {
      steps: [
        t("agentSetupPage.pathInstructions.windows.steps.step1"),
        t("agentSetupPage.pathInstructions.windows.steps.step2"),
        t("agentSetupPage.pathInstructions.windows.steps.step3"),
      ],
      tip: t("agentSetupPage.pathInstructions.windows.tip"),
    },
    linux: {
      steps: [
        t("agentSetupPage.pathInstructions.linux.steps.step1"),
        t("agentSetupPage.pathInstructions.linux.steps.step2"),
        t("agentSetupPage.pathInstructions.linux.steps.step3"),
      ],
      tip: t("agentSetupPage.pathInstructions.linux.tip"),
    },
  };
  const current = instructions[platform];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{t("agentSetupPage.pathInstructions.title")}</DialogTitle>
          <DialogDescription>
            {t("agentSetupPage.pathInstructions.descriptionBefore")}{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/Users/you/project</code>
            {t("agentSetupPage.pathInstructions.descriptionAfter")}
          </DialogDescription>
        </DialogHeader>

        {/* Platform tabs */}
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
                platform === p.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
              onClick={() => setPlatform(p.id)}
            >
              <p.icon className="h-3.5 w-3.5" />
              {platformLabels[p.id]}
            </button>
          ))}
        </div>

        {/* Steps */}
        <ol className="space-y-2 text-sm">
          {current.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {current.tip && (
          <p className="text-xs text-muted-foreground border-l-2 border-border pl-3">
            {current.tip}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Small "Choose" button that opens the PathInstructionsModal.
 * Drop-in replacement for the old showDirectoryPicker buttons.
 */
export function ChoosePathButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors shrink-0",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        {t("agentSetupPage.pathInstructions.choose")}
      </button>
      <PathInstructionsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
