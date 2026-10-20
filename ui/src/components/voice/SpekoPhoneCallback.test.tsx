// @vitest-environment jsdom
import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {setLocale} from "@/i18n";
import {SpekoPhoneCallbackForm} from "./SpekoPhoneCallback";

(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT: boolean}).IS_REACT_ACT_ENVIRONMENT = true;

describe("SpekoPhoneCallbackForm localization", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await setLocale("en");
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    await setLocale("en");
  });

  it("renders callback controls in Simplified Chinese", async () => {
    await setLocale("zh-CN");
    await act(async () => root.render(<SpekoPhoneCallbackForm onSave={vi.fn()} />));

    expect(container.textContent).toContain("呼叫我的电话");
    expect(container.textContent).toContain("允许此 Agent 就我的任务呼叫我");
    expect(container.textContent).toContain("保存电话设置");
    expect(container.querySelector('input[type="tel"]')?.closest("label")?.textContent).toContain("你的回拨号码");
  });
});
