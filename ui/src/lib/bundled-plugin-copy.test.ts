import { describe, expect, it } from "vitest";

import { i18n } from "@/i18n";
import {
  BUNDLED_PLUGIN_PACKAGE_NAMES,
  bundledPluginCopyFor,
} from "./bundled-plugin-copy";

describe("bundled plugin translations", () => {
  it("provides names and descriptions in both required locales for each shipped package", () => {
    for (const packageName of BUNDLED_PLUGIN_PACKAGE_NAMES) {
      const copy = bundledPluginCopyFor(packageName, (translationKey) => translationKey);
      expect(copy, packageName).not.toBeNull();
      if (!copy) continue;
      for (const locale of ["en", "zh-CN"]) {
        expect(i18n.exists(copy.displayName, { lng: locale }), `${locale}:${packageName}:name`).toBe(true);
        expect(i18n.exists(copy.description, { lng: locale }), `${locale}:${packageName}:description`).toBe(true);
      }
      expect(i18n.t(copy.description, { lng: "zh-CN" }), packageName).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it("leaves third-party plugin copy untouched", () => {
    expect(bundledPluginCopyFor("@example/plugin-custom", (key) => key)).toBeNull();
  });
});
