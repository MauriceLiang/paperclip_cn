// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguagePreferenceControl } from "./LanguagePreferenceControl";
import { LOCALE_STORAGE_KEY, i18n, setLocale } from "@/i18n";

vi.mock("@/components/ui/select", () => ({
  SelectPopover: ({
    value,
    onValueChange,
    options,
    "aria-label": ariaLabel,
  }: {
    value: string;
    onValueChange?: (value: string) => void;
    options: readonly { value: string; label: string }[];
    "aria-label": string;
  }) => (
    <div aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-value={option.value}
          aria-pressed={option.value === value}
          onClick={() => onValueChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

describe("LanguagePreferenceControl", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(async () => {
    await setLocale("en");
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    container.remove();
    root = null;
    await setLocale("en");
  });

  it("switches the interface language, persists it, and updates <html lang>", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<LanguagePreferenceControl />);
    });
    await flushReact();

    const english = container.querySelector<HTMLButtonElement>('button[data-value="en"]');
    const chinese = container.querySelector<HTMLButtonElement>('button[data-value="zh-CN"]');
    expect(english?.getAttribute("aria-pressed")).toBe("true");
    expect(chinese?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => chinese?.click());
    await flushReact();

    expect(i18n.resolvedLanguage).toBe("zh-CN");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(container.querySelector('button[data-value="zh-CN"]')?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => container.querySelector<HTMLButtonElement>('button[data-value="en"]')?.click());
    await flushReact();

    expect(i18n.resolvedLanguage).toBe("en");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});
