import { APP_STORE_DEFINITIONS } from "@paperclipai/shared";
import { describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import { appDisplayNameFor } from "./app-gallery-copy";

describe("app gallery translations", () => {
  it("provides localized card and setup copy for every bundled store entry", () => {
    for (const app of APP_STORE_DEFINITIONS) {
      for (const locale of ["en", "zh-CN"]) {
        expect(i18n.exists(`appGallery.${app.slug}.tagline`, { lng: locale }), `${locale}:${app.slug}:tagline`).toBe(true);
        expect(i18n.exists(`appGallery.${app.slug}.short`, { lng: locale }), `${locale}:${app.slug}:short`).toBe(true);
      }
    }
  });

  it("localizes the built-in local model service name without translating provider names", () => {
    const t = (key: string) => key === "appGallery.local.name" ? "本地模型服务" : key;

    expect(appDisplayNameFor("local", "Local endpoint", t)).toBe("本地模型服务");
    expect(appDisplayNameFor("executor", "Executor", t)).toBe("Executor");
  });
});
