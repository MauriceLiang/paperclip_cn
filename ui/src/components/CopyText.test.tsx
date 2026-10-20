// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { i18n } from "@/i18n";
import { CopyText } from "./CopyText";

const copyTextToClipboard = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/clipboard", () => ({ copyTextToClipboard }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("CopyText", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    copyTextToClipboard.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    copyTextToClipboard.mockReset();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("shows localized default copy feedback", async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
    await act(async () => {
      root.render(<CopyText text="branch-name" />);
    });

    const button = container.querySelector("button");
    await act(async () => button?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(container.querySelector('[role="status"]')?.textContent).toBe("已复制！");
  });

  it("shows localized failure feedback", async () => {
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
    copyTextToClipboard.mockRejectedValue(new Error("clipboard unavailable"));
    await act(async () => {
      root.render(<CopyText text="branch-name" />);
    });

    const button = container.querySelector("button");
    await act(async () => button?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(container.querySelector('[role="status"]')?.textContent).toBe("复制失败");
  });
});
