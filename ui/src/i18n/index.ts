import i18n, { type InitOptions, type TFunction, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import {
  FALLBACK_LOCALE,
  SOURCE_LOCALE,
  i18nextResources,
  supportedLocales,
  type SupportedLocale,
} from "./locales";
import {
  applyDocumentLanguage,
  isSupportedLocale,
  persistLocale,
  resolveInitialLocale,
} from "./locale-preference";

const initialLocale = resolveInitialLocale();

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: initialLocale,
  fallbackLng: FALLBACK_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

i18n.on("languageChanged", (locale) => {
  applyDocumentLanguage(locale);
});
applyDocumentLanguage(initialLocale);

export const t = ((key: string, options?: TOptions) => i18n.t(key, options)) as TFunction;

/** Switch the interface language in memory, in storage, and on <html lang>. */
export function setLocale(locale: string): Promise<void> {
  if (!isSupportedLocale(locale)) return Promise.resolve();
  persistLocale(locale);
  applyDocumentLanguage(locale);
  return i18n.changeLanguage(locale).then(() => undefined);
}

export function getLocale(): SupportedLocale {
  const current = i18n.resolvedLanguage ?? i18n.language;
  return isSupportedLocale(current) ? current : initialLocale;
}

export const useTranslation = useReactI18nextTranslation;
export {
  SOURCE_LOCALE,
  FALLBACK_LOCALE,
  supportedLocales,
  isSupportedLocale,
};
export {
  INITIAL_UI_LOCALE,
  STRICT_LOCALES,
  COMPLETE_LOCALES,
} from "./locales";
export { UI_LOCALE_OPTIONS } from "./locale-preference";
export { LOCALE_STORAGE_KEY } from "./locale-preference";
export type { SupportedLocale } from "./locales";
export { i18n };
