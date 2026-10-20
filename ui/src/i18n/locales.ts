import type { Resource } from "i18next";

import en from "./locales/en.json";
import { assertValidLocaleMessages, type LocaleValidationMode } from "./locale-validation";

/** The locale every translation key is authored in. */
export const SOURCE_LOCALE = "en" as const;

/** Locale used when the active language is missing a key. */
export const FALLBACK_LOCALE = "en" as const;

/** Initial interface language for this Simplified Chinese fork. */
export const INITIAL_UI_LOCALE = "zh-CN" as const;

/**
 * Locales that must contain every source key. All other registered locales are
 * validated in partial mode: they may miss keys (English fallback applies), but
 * any translation they do provide is still checked for placeholder and safety
 * parity.
 */
export const STRICT_LOCALES = [SOURCE_LOCALE, INITIAL_UI_LOCALE] as const;

/** Locales advertised in the language picker because they are fully covered. */
export const COMPLETE_LOCALES = STRICT_LOCALES;

/** @deprecated Use SOURCE_LOCALE. Kept for callers that still need a fallback. */
export const DEFAULT_LOCALE = SOURCE_LOCALE;

const localeModules = import.meta.glob("./locales/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export const localeMessages = Object.fromEntries(
  Object.entries(localeModules).map(([path, messages]) => {
    const locale = path.match(/\/([A-Za-z0-9_-]+)\.json$/)?.[1];
    if (!locale) {
      throw new Error(`Invalid locale file path: ${path}`);
    }
    return [locale, messages];
  }),
);

if (!(SOURCE_LOCALE in localeMessages)) {
  throw new Error(`Missing source locale messages for ${SOURCE_LOCALE}`);
}

for (const [locale, messages] of Object.entries(localeMessages)) {
  const mode: LocaleValidationMode = (STRICT_LOCALES as readonly string[]).includes(locale)
    ? "strict"
    : "partial";
  try {
    assertValidLocaleMessages(messages, en, { mode });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${locale} locale messages: ${message}`);
  }
}

export const supportedLocales = Object.keys(localeMessages);

export const i18nextResources: Resource = Object.fromEntries(
  Object.entries(localeMessages).map(([locale, messages]) => [locale, { translation: messages }]),
) as Resource;

export type SupportedLocale = string;
