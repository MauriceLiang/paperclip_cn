import { useTranslation } from "@/i18n";
import {
  INITIAL_UI_LOCALE,
  UI_LOCALE_OPTIONS,
  isSupportedLocale,
  setLocale,
} from "@/i18n";
import { SelectPopover } from "@/components/ui/select";

export function LanguagePreferenceControl({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current = isSupportedLocale(i18n.resolvedLanguage) ? i18n.resolvedLanguage : INITIAL_UI_LOCALE;

  return (
    <div className={className}>
      <SelectPopover
        aria-label={t("settings.language.label")}
        value={current}
        options={UI_LOCALE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        onValueChange={(value) => {
          if (isSupportedLocale(value)) void setLocale(value);
        }}
      />
    </div>
  );
}
