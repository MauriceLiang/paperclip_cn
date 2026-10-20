import type { TFunction } from "i18next";

/**
 * Tiny best-effort cron → plain-English helper for the routine Triggers section.
 * Not a full cron parser: it covers the common shapes Paperclip schedule triggers
 * produce (every N minutes/hours, daily at HH:MM, weekday/weekend, day-of-week).
 * Falls back to the raw expression when it can't confidently describe it.
 */

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function describeTime(minute: string, hour: string): string | null {
  const m = Number(minute);
  const h = Number(hour);
  if (!Number.isInteger(m) || !Number.isInteger(h)) return null;
  if (m < 0 || m > 59 || h < 0 || h > 23) return null;
  return `${pad2(h)}:${pad2(m)}`;
}

function describeDayOfWeek(
  dow: string,
  time: string,
  t?: TFunction,
  locale = "en",
): string | null {
  if (dow === "*" || dow === "?") return "every day";
  if (dow === "1-5") {
    return t
      ? t("operationsPage.routines.triggerWizard.schedule.summaryWeekdays", { time })
      : `Every weekday at ${time}`;
  }
  if (dow === "0,6" || dow === "6,0" || dow === "0,7") {
    return t
      ? t("operationsPage.routines.cron.everyWeekendAt", { time })
      : `Every weekend at ${time}`;
  }
  const parts = dow.split(",").map((part) => part.trim());
  const names = parts.map((part) => {
    const n = Number(part);
    if (!Number.isInteger(n)) return null;
    return DOW_NAMES[n % 7];
  });
  if (names.some((name) => name === null)) return null;
  if (t) {
    const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const translatedNames = parts.map((part) => {
      const day = Number(part) % 7;
      return t(`operationsPage.routines.triggerWizard.schedule.days.${dayKeys[day]}`);
    });
    const days = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(translatedNames);
    return t("operationsPage.routines.cron.specificDaysAt", { days, time });
  }
  if (names.length === 1) return `every ${names[0]}`;
  return `every ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function describeCron(
  expression: string | null | undefined,
  t?: TFunction,
  locale = "en",
): string | null {
  if (!expression) return null;
  const trimmed = expression.trim();
  const fields = trimmed.split(/\s+/);
  // Standard 5-field cron: minute hour day-of-month month day-of-week
  if (fields.length !== 5) return null;
  const [minute, hour, dom, month, dow] = fields;

  // Every N minutes
  const everyMinutes = minute.match(/^\*\/(\d+)$/);
  if (everyMinutes && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return t
      ? t("operationsPage.routines.cron.everyMinutes", { count: everyMinutes[1] })
      : `Every ${everyMinutes[1]} minutes`;
  }

  // Every N hours, on the minute
  const everyHours = hour.match(/^\*\/(\d+)$/);
  if (everyHours && /^\d+$/.test(minute) && dom === "*" && month === "*" && dow === "*") {
    const minuteValue = pad2(Number(minute));
    return t
      ? t("operationsPage.routines.cron.everyHours", { count: everyHours[1], minute: minuteValue })
      : `Every ${everyHours[1]} hours at :${minuteValue}`;
  }

  // Hourly
  if (/^\d+$/.test(minute) && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    const minuteValue = pad2(Number(minute));
    return t
      ? t("operationsPage.routines.cron.hourly", { minute: minuteValue })
      : `Every hour at :${minuteValue}`;
  }

  // Daily / weekly at a fixed time
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && month === "*") {
    const time = describeTime(minute, hour);
    if (!time) return null;
    if (dom === "*" && (dow === "*" || dow === "?")) {
      return t
        ? t("operationsPage.routines.triggerWizard.schedule.summaryDaily", { time })
        : `Every day at ${time}`;
    }
    if (dom === "*") {
      const dowText = describeDayOfWeek(dow, time, t, locale);
      if (dowText) return t || dow === "1-5" || ["0,6", "6,0", "0,7"].includes(dow)
        ? dowText
        : `${dowText[0].toUpperCase()}${dowText.slice(1)} at ${time}`;
    }
    if (/^\d+$/.test(dom) && (dow === "*" || dow === "?")) {
      return t
        ? t("operationsPage.routines.cron.dayOfMonthAt", { day: dom, time })
        : `Day ${dom} of every month at ${time}`;
    }
  }

  return null;
}
