import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "@/i18n";
import { itemHasChangedNotice } from "./pipeline-item-detail";

afterEach(async () => {
  await setLocale("en");
});

describe("pipeline item changed notice localization", () => {
  it("uses the current locale for the upstream-change notice", async () => {
    await setLocale("zh-CN");

    expect(itemHasChangedNotice({ fields: { upstreamChanged: true } })).toEqual({
      title: "此项已变更",
      body: "此条目创建后上游工作发生了变更。继续前请查看最新详情。",
    });
  });
});
