// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setLocale } from "@/i18n";
import { OutputFeedbackButtons } from "./OutputFeedbackButtons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("OutputFeedbackButtons localization", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(async () => {
    await setLocale("zh-CN");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    await setLocale("en");
  });

  it("localizes vote and data-sharing controls", async () => {
    await act(async () => {
      root.render(<OutputFeedbackButtons onVote={vi.fn().mockResolvedValue(undefined)} />);
    });

    expect(container.textContent).toContain("有帮助");
    expect(container.textContent).toContain("需要改进");
    const helpful = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("有帮助"));
    expect(helpful).toBeTruthy();
    await act(async () => helpful?.click());

    expect(document.body.textContent).toContain("保存你的反馈共享偏好");
    expect(document.body.textContent).toContain("此投票始终保存在本地。");
    expect(document.body.textContent).toContain("始终允许");
    expect(document.body.textContent).toContain("不允许");
  });
});
