import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import { GATEWAY_TABS, gatewayTabLabel } from "./gateway-tabs";

describe("gateway tabs localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("localizes all gateway tab labels", async () => {
    await i18n.changeLanguage("zh-CN");
    expect(GATEWAY_TABS.map((tab) => gatewayTabLabel(tab.key))).toEqual([
      "概览",
      "应用和工具",
      "Token",
      "活动",
      "高级",
    ]);
  });
});
