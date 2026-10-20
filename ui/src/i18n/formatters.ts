import { getLocale } from "./index";

/** Locale used by Intl formatters for the current interface language. */
export function getIntlLocale(): string {
  const locale = getLocale();
  // Keep the app's existing English formatting behavior ("en-US") while
  // mapping the compact source locale to a concrete Intl locale.
  return locale === "en" ? "en-US" : locale;
}

export function formatDate(
  value: Date | number | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(getIntlLocale(), options).format(new Date(value));
}

export function formatDateTime(
  value: Date | number | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  return new Intl.DateTimeFormat(getIntlLocale(), options).format(new Date(value));
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getIntlLocale(), options).format(value);
}

export function formatCurrency(
  value: number,
  currency: string,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: "currency",
    currency,
    ...options,
  }).format(value);
}

export function formatPercent(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getIntlLocale(), { style: "percent", ...options }).format(value);
}

export function formatRelativeTime(
  value: Date | number | string,
  unit: Intl.RelativeTimeFormatUnit,
  options: Intl.RelativeTimeFormatOptions = { numeric: "auto" },
): string {
  const target = new Date(value).getTime();
  const delta = target - Date.now();
  const divisor =
    unit === "second" ? 1_000
    : unit === "minute" ? 60_000
    : unit === "hour" ? 3_600_000
    : unit === "day" ? 86_400_000
    : unit === "week" ? 604_800_000
    : unit === "month" ? 2_592_000_000
    : unit === "year" ? 31_536_000_000
    : 1;
  return new Intl.RelativeTimeFormat(getIntlLocale(), options).format(
    Math.round(delta / divisor),
    unit,
  );
}
