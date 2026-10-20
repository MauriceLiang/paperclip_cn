import {
  FALLBACK_LOCALE,
  INITIAL_UI_LOCALE,
  supportedLocales,
  type SupportedLocale,
} from "./locales";

export const LOCALE_STORAGE_KEY = "paperclip.ui.locale";

export interface LocaleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LocaleOption {
  value: SupportedLocale;
  /** The language's own name, never translated. */
  label: string;
}

/** Languages advertised as complete. Other registered locales still load. */
export const UI_LOCALE_OPTIONS: readonly LocaleOption[] = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en", label: "English" },
];

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return typeof value === "string" && (supportedLocales as string[]).includes(value);
}

function defaultStorage(): LocaleStorage | null {
  try {
    return typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;
  } catch {
    // Accessing localStorage can throw in privacy-restricted browsers.
    return null;
  }
}

export function readStoredLocale(storage: LocaleStorage | null = defaultStorage()): SupportedLocale | null {
  try {
    const value = storage?.getItem(LOCALE_STORAGE_KEY) ?? null;
    return isSupportedLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function persistLocale(locale: SupportedLocale, storage: LocaleStorage | null = defaultStorage()) {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // A failed write must not prevent the in-memory language switch.
  }
}

export function resolveInitialLocale(storage: LocaleStorage | null = defaultStorage()): SupportedLocale {
  const stored = readStoredLocale(storage);
  if (stored) return stored;
  if (isSupportedLocale(INITIAL_UI_LOCALE)) return INITIAL_UI_LOCALE;
  return FALLBACK_LOCALE;
}

export function applyDocumentLanguage(locale: string) {
  try {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = locale;
    }
  } catch {
    // Non-browser rendering environments have no document to update.
  }
}
