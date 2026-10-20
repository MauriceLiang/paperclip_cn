import { afterEach, describe, expect, it, vi } from "vitest";

import { FALLBACK_LOCALE, INITIAL_UI_LOCALE } from "./locales";
import {
  LOCALE_STORAGE_KEY,
  applyDocumentLanguage,
  isSupportedLocale,
  persistLocale,
  readStoredLocale,
  resolveInitialLocale,
  type LocaleStorage,
} from "./locale-preference";

function memoryStorage(initial: Record<string, string> = {}): LocaleStorage {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("locale preference", () => {
  it("defaults this fork to Simplified Chinese", () => {
    expect(INITIAL_UI_LOCALE).toBe("zh-CN");
    expect(FALLBACK_LOCALE).toBe("en");
    expect(resolveInitialLocale(memoryStorage())).toBe("zh-CN");
  });

  it("prefers an explicitly stored supported locale", () => {
    expect(readStoredLocale(memoryStorage({ [LOCALE_STORAGE_KEY]: "en" }))).toBe("en");
    expect(resolveInitialLocale(memoryStorage({ [LOCALE_STORAGE_KEY]: "en" }))).toBe("en");
  });

  it("ignores unsupported and corrupt storage values", () => {
    expect(readStoredLocale(memoryStorage({ [LOCALE_STORAGE_KEY]: "xx-YY" }))).toBeNull();
    expect(resolveInitialLocale(memoryStorage({ [LOCALE_STORAGE_KEY]: "xx-YY" }))).toBe("zh-CN");

    const throwing: LocaleStorage = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => undefined,
    };
    expect(readStoredLocale(throwing)).toBeNull();
    expect(resolveInitialLocale(throwing)).toBe("zh-CN");
  });

  it("persists the chosen locale and tolerates write failures", () => {
    const storage = memoryStorage();
    persistLocale("en", storage);
    expect(storage.getItem(LOCALE_STORAGE_KEY)).toBe("en");

    const throwing: LocaleStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };
    expect(() => persistLocale("zh-CN", throwing)).not.toThrow();
  });

  it("validates supported locales", () => {
    expect(isSupportedLocale("zh-CN")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("xx-YY")).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
  });

  it("updates the document language when a document exists", () => {
    const documentElement = { lang: "" };
    vi.stubGlobal("document", { documentElement });

    applyDocumentLanguage("zh-CN");
    expect(documentElement.lang).toBe("zh-CN");
    applyDocumentLanguage("en");
    expect(documentElement.lang).toBe("en");
  });

  it("does not throw when no document exists", () => {
    vi.stubGlobal("document", undefined);
    expect(() => applyDocumentLanguage("zh-CN")).not.toThrow();
  });
});
