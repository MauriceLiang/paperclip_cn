// @vitest-environment jsdom
import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {setLocale} from "@/i18n";
import {VoiceControls} from "./VoiceControls";
import {VoiceTranscript} from "./VoiceTranscript";

(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT: boolean}).IS_REACT_ACT_ENVIRONMENT = true;

describe("voice controls localization", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await setLocale("en");
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    await setLocale("en");
  });

  it("localizes call states, known errors, accessible labels, and fixed transcript notices", async () => {
    await setLocale("zh-CN");
    await act(async () => root.render(<>
      <VoiceControls
        state="cleanup_failed"
        agentName="Planner"
        error="The call could not be fully closed. Retry ending it before starting another call."
        announcement="You: We found the answer."
        onStart={() => undefined}
        onMute={() => undefined}
        onEnd={() => undefined}
        onResumeAudio={() => undefined}
      />
      <VoiceTranscript
        entries={[
          {id: "application:notice", source: "application", text: "A task update is available.", final: true},
          {id: "agent:answer", source: "agent", text: "Raw agent answer", final: true},
        ]}
        agentName="Planner"
      />
    </>));

    expect(container.querySelector('[aria-label="与 Planner 的语音对话"]')).not.toBeNull();
    expect(container.textContent).toContain("无法确认通话已结束");
    expect(container.textContent).toContain("重试结束通话");
    expect(container.textContent).toContain("无法完全结束通话。");
    expect(container.textContent).toContain("有一条任务更新。");
    expect(container.textContent).toContain("Raw agent answer");
    expect(container.querySelector(".sr-only")?.textContent).toBe("你: We found the answer.");
  });
});
