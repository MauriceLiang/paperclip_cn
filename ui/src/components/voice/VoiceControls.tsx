import { Mic, MicOff, Phone, PhoneOff, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export const VOICE_CONTROL_STATES = ["idle", "connecting", "listening", "speaking", "working", "interrupted", "reconnecting", "ending", "ended", "failed", "cleanup_failed"] as const;
export type VoiceControlState = typeof VOICE_CONTROL_STATES[number];
const stateLabelKeys: Record<VoiceControlState, string> = {
  idle: "readyToTalk", connecting: "connecting", listening: "listening", speaking: "speaking",
  working: "working", interrupted: "listeningToFollowUp", reconnecting: "reconnecting",
  ending: "ending", ended: "ended", failed: "unavailable", cleanup_failed: "closureUnconfirmed",
};
const errorKeys: Record<string, string> = {
  "The call could not be fully closed. Retry ending it before starting another call.": "callClosureFailed",
  "Speko needs credits before starting a call. Add credits in Speko, then try again.": "creditsRequired",
  "The previous call was closed. Start voice again to reconnect; your task is preserved.": "callRecovered",
  "Voice could not connect. Check microphone permissions and your connection, then try again.": "connectionFailed",
  "Microphone state could not be changed. Try again or end the call.": "microphoneStateFailed",
  "A task update could not be delivered to voice. Open the task to read it.": "taskUpdateDeliveryFailed",
  "The answer could not be repeated. Open the task to read it.": "answerRepeatFailed",
  "Audio playback is blocked. Check this browser’s sound settings.": "audioPlaybackBlocked",
};
export interface VoiceControlsProps {
  state: VoiceControlState;
  agentName: string;
  muted?: boolean;
  busy?: boolean;
  playbackBlocked?: boolean;
  canRepeat?: boolean;
  onRepeat?: () => void;
  error?: string;
  announcement?: string;
  onStart: () => void;
  onMute: () => void;
  onEnd: () => void;
  onResumeAudio: () => void;
  className?: string;
}
export function VoiceControls({ state, agentName, muted = false, busy = false, playbackBlocked = false, canRepeat = false, onRepeat, error, announcement, onStart, onMute, onEnd, onResumeAudio, className }: VoiceControlsProps) {
  const { t } = useTranslation();
  const inactive = state === "idle" || state === "ended" || state === "failed";
  const connecting = state === "connecting" || state === "reconnecting";
  const startButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const visibleError = error ? errorKeys[error] ? t(`taskChatPage.voice.errors.${errorKeys[error]}`) : error : undefined;
  const localizedAnnouncement = announcement?.replace(/^(You|Agent): /, (_, speaker: string) => `${t(speaker === "You" ? "taskChatPage.voice.you" : "taskChatPage.voice.agentSpeaker")}: `);
  useEffect(() => {
    if (!inactive || !restoreFocus.current) return;
    restoreFocus.current = false;
    if (document.activeElement === document.body) startButton.current?.focus();
  }, [inactive]);
  return (
    <section aria-label={t("taskChatPage.voice.ariaLabel", { name: agentName })} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="break-words text-sm font-medium">{t("taskChatPage.voice.talkToAgent", { name: agentName })}</h3>
        <p role="status" className="text-sm text-muted-foreground">{t(`taskChatPage.voice.states.${stateLabelKeys[state]}`)}{muted && !inactive ? ` · ${t("taskChatPage.voice.microphoneMuted")}` : ""}</p>
      </div>
      {visibleError && <p role="alert" className="text-sm text-destructive">{visibleError}</p>}
      <div className="flex flex-wrap gap-2">
        {inactive ? (
          <Button ref={startButton} size="sm" disabled={busy} onClick={onStart}><Phone aria-hidden="true" />{state === "failed" ? t("taskChatPage.voice.tryAgain") : t("taskChatPage.voice.startVoice")}</Button>
        ) : (
          <>
            <Button size="sm" variant="outline" aria-pressed={muted} disabled={busy || connecting || state === "ending" || state === "cleanup_failed"} onClick={onMute}>
              {muted ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}{muted ? t("taskChatPage.voice.unmute") : t("taskChatPage.voice.mute")}
            </Button>
            <Button size="sm" variant="outline" disabled={state === "ending"} onClick={() => { restoreFocus.current = true; onEnd(); }}><PhoneOff aria-hidden="true" />{state === "cleanup_failed" ? t("taskChatPage.voice.retryEndingCall") : t("taskChatPage.voice.endCall")}</Button>
          </>
        )}
        {canRepeat && onRepeat && !inactive && <Button size="sm" variant="outline" disabled={busy || connecting || state === "ending" || state === "cleanup_failed"} onClick={onRepeat}><RotateCcw aria-hidden="true" />{t("taskChatPage.voice.repeatAnswer")}</Button>}
        {playbackBlocked && !inactive && <Button size="sm" variant="outline" onClick={onResumeAudio}><Volume2 aria-hidden="true" />{t("taskChatPage.voice.enableAudio")}</Button>}
      </div>
      {!inactive && <p className="text-xs text-muted-foreground">{t("taskChatPage.voice.endingKeepsTaskRunning")}</p>}
      <span className="sr-only" aria-live="polite" aria-atomic="true">{localizedAnnouncement}</span>
    </section>
  );
}
