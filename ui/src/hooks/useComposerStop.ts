import { useRef, useState } from "react";
import { t as translate } from "@/i18n";

/** Keeps stop requests independent of draft submission and prevents double clicks. */
export function useComposerStop(onStop?: () => Promise<void>, pending = false) {
  const inFlight = useRef(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function stop() {
    if (!onStop || inFlight.current || pending) return;
    inFlight.current = true;
    setStopping(true);
    setError(null);
    try {
      await onStop();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : translate("taskChatPage.composer.stopFailed"),
      );
    } finally {
      inFlight.current = false;
      setStopping(false);
    }
  }

  return { stop, stopping: stopping || pending, error };
}
