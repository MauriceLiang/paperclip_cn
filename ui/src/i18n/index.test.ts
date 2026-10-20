import { beforeEach, describe, expect, it } from "vitest";

import { getLocale, i18n, setLocale } from ".";
import en from "./locales/en.json";
import zhCn from "./locales/zh-CN.json";

beforeEach(async () => {
  await setLocale("en");
});

describe("i18n locale switching", () => {
  it("switches to Simplified Chinese immediately", async () => {
    await setLocale("zh-CN");
    expect(getLocale()).toBe("zh-CN");
    expect(i18n.t("settings.language.title")).toBe(zhCn.settings.language.title);
    expect(i18n.t("common.actions.save")).toBe(zhCn.common.actions.save);
  });

  it("falls back to English for partial locales without a translation", async () => {
    await setLocale("de");
    expect(getLocale()).toBe("de");
    expect(i18n.t("settings.language.title")).toBe(en.settings.language.title);
  });

  it("ignores unsupported locales", async () => {
    await setLocale("en");
    await setLocale("xx-YY");
    expect(getLocale()).toBe("en");
  });
});
