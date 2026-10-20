import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { nextCronFires, parseCronExpression } from "../lib/cron-fires";
import { t as translate, useTranslation } from "@/i18n";

export type SchedulePreset = "every_minute" | "every_hour" | "every_day" | "weekdays" | "weekly" | "monthly" | "custom";

const PRESETS: { value: SchedulePreset; labelKey: string }[] = [
  { value: "every_minute", labelKey: "settingsComponents.scheduleEditor.presets.everyMinute" },
  { value: "every_hour", labelKey: "settingsComponents.scheduleEditor.presets.everyHour" },
  { value: "every_day", labelKey: "settingsComponents.scheduleEditor.presets.everyDay" },
  { value: "weekdays", labelKey: "settingsComponents.scheduleEditor.presets.weekdays" },
  { value: "weekly", labelKey: "settingsComponents.scheduleEditor.presets.weekly" },
  { value: "monthly", labelKey: "settingsComponents.scheduleEditor.presets.monthly" },
  { value: "custom", labelKey: "settingsComponents.scheduleEditor.presets.custom" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  hour12: i === 0 ? "12" : i < 12 ? String(i) : i === 12 ? "12" : String(i - 12),
  period: i < 12 ? "am" : "pm",
}));

const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  value: String(i * 5),
  label: String(i * 5).padStart(2, "0"),
}));

const DAYS_OF_WEEK: { value: string; labelKey: string }[] = [
  { value: "1", labelKey: "settingsComponents.scheduleEditor.day.mon" },
  { value: "2", labelKey: "settingsComponents.scheduleEditor.day.tue" },
  { value: "3", labelKey: "settingsComponents.scheduleEditor.day.wed" },
  { value: "4", labelKey: "settingsComponents.scheduleEditor.day.thu" },
  { value: "5", labelKey: "settingsComponents.scheduleEditor.day.fri" },
  { value: "6", labelKey: "settingsComponents.scheduleEditor.day.sat" },
  { value: "0", labelKey: "settingsComponents.scheduleEditor.day.sun" },
];

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

function hasOption(options: Array<{ value: string }>, value: string): boolean {
  return options.some((option) => option.value === value);
}

export function parseCronToPreset(cron: string): {
  preset: SchedulePreset;
  hour: string;
  minute: string;
  dayOfWeek: string;
  dayOfMonth: string;
} {
  const defaults = { hour: "10", minute: "0", dayOfWeek: "1", dayOfMonth: "1" };

  if (!cron || !cron.trim()) {
    return { preset: "every_day", ...defaults };
  }

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { preset: "custom", ...defaults };
  }

  const [min, hr, dom, month, dow] = parts;
  const selectableMinute = hasOption(MINUTES, min);
  const selectableHour = hasOption(HOURS, hr);

  // Every minute: "* * * * *"
  if (min === "*" && hr === "*" && dom === "*" && month === "*" && dow === "*") {
    return { preset: "every_minute", ...defaults };
  }

  // Every hour: "0 * * * *"
  if (hr === "*" && dom === "*" && month === "*" && dow === "*" && selectableMinute) {
    return { preset: "every_hour", ...defaults, minute: min };
  }

  // Every day: "M H * * *"
  if (dom === "*" && month === "*" && dow === "*" && selectableHour && selectableMinute) {
    return { preset: "every_day", ...defaults, hour: hr, minute: min };
  }

  // Weekdays: "M H * * 1-5"
  if (dom === "*" && month === "*" && dow === "1-5" && selectableHour && selectableMinute) {
    return { preset: "weekdays", ...defaults, hour: hr, minute: min };
  }

  // Weekly: "M H * * D" (single day)
  if (dom === "*" && month === "*" && hasOption(DAYS_OF_WEEK, dow) && selectableHour && selectableMinute) {
    return { preset: "weekly", ...defaults, hour: hr, minute: min, dayOfWeek: dow };
  }

  // Monthly: "M H D * *"
  if (month === "*" && hasOption(DAYS_OF_MONTH, dom) && dow === "*" && selectableHour && selectableMinute) {
    return { preset: "monthly", ...defaults, hour: hr, minute: min, dayOfMonth: dom };
  }

  return { preset: "custom", ...defaults };
}

export function buildCron(preset: SchedulePreset, hour: string, minute: string, dayOfWeek: string, dayOfMonth: string): string {
  switch (preset) {
    case "every_minute":
      return "* * * * *";
    case "every_hour":
      return `${minute} * * * *`;
    case "every_day":
      return `${minute} ${hour} * * *`;
    case "weekdays":
      return `${minute} ${hour} * * 1-5`;
    case "weekly":
      return `${minute} ${hour} * * ${dayOfWeek}`;
    case "monthly":
      return `${minute} ${hour} ${dayOfMonth} * *`;
    case "custom":
      return "";
  }
}

function hourLabel(hour: (typeof HOURS)[number]): string {
  return translate("settingsComponents.scheduleEditor.hourOption", {
    hour: hour.hour12,
    period: translate(hour.period === "am"
      ? "settingsComponents.scheduleEditor.period.am"
      : "settingsComponents.scheduleEditor.period.pm"),
  });
}

function describeSchedule(cron: string): string {
  const { preset, hour, minute, dayOfWeek, dayOfMonth } = parseCronToPreset(cron);
  const hourEntry = HOURS.find((h) => h.value === hour);
  const hourText = hourEntry?.hour12 ?? `${hour}`;
  const periodText = hourEntry
    ? translate(hourEntry.period === "am"
      ? "settingsComponents.scheduleEditor.period.am"
      : "settingsComponents.scheduleEditor.period.pm")
    : "";
  const timeStr = translate("settingsComponents.scheduleEditor.describe.time", {
    hour: hourText,
    minute: minute.padStart(2, "0"),
    period: periodText,
  });

  switch (preset) {
    case "every_minute":
      return translate("settingsComponents.scheduleEditor.describe.everyMinute");
    case "every_hour":
      return translate("settingsComponents.scheduleEditor.describe.everyHour", { minute: minute.padStart(2, "0") });
    case "every_day":
      return translate("settingsComponents.scheduleEditor.describe.everyDay", { time: timeStr });
    case "weekdays":
      return translate("settingsComponents.scheduleEditor.describe.weekdays", { time: timeStr });
    case "weekly": {
      const dayEntry = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek);
      const day = dayEntry ? translate(dayEntry.labelKey) : dayOfWeek;
      return translate("settingsComponents.scheduleEditor.describe.weekly", { day, time: timeStr });
    }
    case "monthly": {
      const day = translate("settingsComponents.scheduleEditor.describe.monthlyDay", {
        count: Number(dayOfMonth),
        ordinal: true,
      });
      return translate("settingsComponents.scheduleEditor.describe.monthly", { day, time: timeStr });
    }
    case "custom":
      return cron || translate("settingsComponents.scheduleEditor.describe.noSchedule");
  }
}

export { describeSchedule };

export function getScheduleCronValidation(cron: string): {
  valid: boolean;
  message: string;
  nextFires: Date[];
} {
  const trimmed = cron.trim();
  if (!trimmed) {
    return {
      valid: false,
      message: translate("settingsComponents.scheduleEditor.validation.required"),
      nextFires: [],
    };
  }

  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    return {
      valid: false,
      message: translate("settingsComponents.scheduleEditor.validation.fields", { count: fields.length }),
      nextFires: [],
    };
  }

  if (!parseCronExpression(trimmed)) {
    return {
      valid: false,
      message: translate("settingsComponents.scheduleEditor.validation.invalidFields"),
      nextFires: [],
    };
  }

  const nextFires = nextCronFires(trimmed, 3, { timeZone: "UTC" });
  return {
    valid: true,
    message: nextFires.length > 0
      ? translate("settingsComponents.scheduleEditor.validation.valid")
      : translate("settingsComponents.scheduleEditor.validation.validNoFires"),
    nextFires,
  };
}

export function ScheduleEditor({
  value,
  onChange,
  onValidityChange,
}: {
  value: string;
  onChange: (cron: string) => void;
  onValidityChange?: (valid: boolean) => void;
}) {
  const { t } = useTranslation();
  const parsed = useMemo(() => parseCronToPreset(value), [value]);
  const [preset, setPreset] = useState<SchedulePreset>(parsed.preset);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [dayOfWeek, setDayOfWeek] = useState(parsed.dayOfWeek);
  const [dayOfMonth, setDayOfMonth] = useState(parsed.dayOfMonth);
  const [customCron, setCustomCron] = useState(preset === "custom" ? value : "");
  const customValidation = useMemo(() => getScheduleCronValidation(customCron), [customCron]);

  useEffect(() => {
    onValidityChange?.(preset !== "custom" || customValidation.valid);
  }, [customValidation.valid, onValidityChange, preset]);

  // Sync from external value changes
  useEffect(() => {
    const p = parseCronToPreset(value);
    setPreset(p.preset);
    setHour(p.hour);
    setMinute(p.minute);
    setDayOfWeek(p.dayOfWeek);
    setDayOfMonth(p.dayOfMonth);
    if (p.preset === "custom") setCustomCron(value);
  }, [value]);

  const emitChange = useCallback(
    (p: SchedulePreset, h: string, m: string, dow: string, dom: string, custom: string) => {
      if (p === "custom") {
        onChange(custom);
      } else {
        onChange(buildCron(p, h, m, dow, dom));
      }
    },
    [onChange],
  );

  const handlePresetChange = (newPreset: SchedulePreset) => {
    setPreset(newPreset);
    if (newPreset === "custom") {
      setCustomCron(value);
    } else {
      emitChange(newPreset, hour, minute, dayOfWeek, dayOfMonth, customCron);
    }
  };

  return (
    <div className="space-y-3">
      <Select value={preset} onValueChange={(v) => handlePresetChange(v as SchedulePreset)}>
        <SelectTrigger className="w-full" aria-label={t("settingsComponents.scheduleEditor.aria.frequency")}>
          <SelectValue placeholder={t("settingsComponents.scheduleEditor.placeholder.frequency")} />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {t(p.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" ? (
        <div className="space-y-1.5">
          <Input
            value={customCron}
            onChange={(e) => {
              const nextCron = e.target.value;
              setCustomCron(nextCron);
              // Report validity synchronously with the keystroke so consumers can gate
              // their submit affordance in the same render. Relying solely on the
              // effect below leaves a one-tick window where an invalid draft still
              // reads as valid to the parent.
              const nextValidation = getScheduleCronValidation(nextCron);
              onValidityChange?.(nextValidation.valid);
              if (nextValidation.valid) {
                emitChange("custom", hour, minute, dayOfWeek, dayOfMonth, nextCron);
              }
            }}
            placeholder="0 10 * * *"
            aria-label={t("settingsComponents.scheduleEditor.aria.cron")}
            aria-invalid={!customValidation.valid}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {t("settingsComponents.scheduleEditor.fieldsHint")}
          </p>
          <p
            className={customValidation.valid ? "text-xs text-muted-foreground" : "text-xs text-destructive"}
            aria-live="polite"
          >
            {customValidation.message}
            {customValidation.valid && customValidation.nextFires.length > 0
              ? ` ${t("settingsComponents.scheduleEditor.validation.next", {
                fires: customValidation.nextFires.map((fire) => fire.toLocaleString()).join(", "),
              })}`
              : null}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {preset !== "every_minute" && preset !== "every_hour" && (
            <>
              <span className="text-sm text-muted-foreground">{t("settingsComponents.scheduleEditor.controls.at")}</span>
              <Select
                value={hour}
                onValueChange={(h) => {
                  setHour(h);
                  emitChange(preset, h, minute, dayOfWeek, dayOfMonth, customCron);
                }}
              >
                <SelectTrigger className="w-(--sz-120px)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {hourLabel(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">:</span>
              <Select
                value={minute}
                onValueChange={(m) => {
                  setMinute(m);
                  emitChange(preset, hour, m, dayOfWeek, dayOfMonth, customCron);
                }}
              >
                <SelectTrigger className="w-(--sz-80px)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {preset === "every_hour" && (
            <>
              <span className="text-sm text-muted-foreground">{t("settingsComponents.scheduleEditor.controls.atMinute")}</span>
              <Select
                value={minute}
                onValueChange={(m) => {
                  setMinute(m);
                  emitChange(preset, hour, m, dayOfWeek, dayOfMonth, customCron);
                }}
              >
                <SelectTrigger className="w-(--sz-80px)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      :{m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {preset === "weekly" && (
            <>
              <span className="text-sm text-muted-foreground">{t("settingsComponents.scheduleEditor.controls.on")}</span>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((d) => (
                  <Button
                    key={d.value}
                    type="button"
                    variant={dayOfWeek === d.value ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    aria-pressed={dayOfWeek === d.value}
                    onClick={() => {
                      setDayOfWeek(d.value);
                      emitChange(preset, hour, minute, d.value, dayOfMonth, customCron);
                    }}
                  >
                    {t(d.labelKey)}
                  </Button>
                ))}
              </div>
            </>
          )}

          {preset === "monthly" && (
            <>
              <span className="text-sm text-muted-foreground">{t("settingsComponents.scheduleEditor.controls.onDay")}</span>
              <Select
                value={dayOfMonth}
                onValueChange={(dom) => {
                  setDayOfMonth(dom);
                  emitChange(preset, hour, minute, dayOfWeek, dom, customCron);
                }}
              >
                <SelectTrigger className="w-(--sz-80px)">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_MONTH.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}
    </div>
  );
}
