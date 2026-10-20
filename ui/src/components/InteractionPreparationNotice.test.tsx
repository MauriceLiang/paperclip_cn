// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { i18n } from "@/i18n";
import { InteractionPreparationNotice } from "./InteractionPreparationNotice";

describe("InteractionPreparationNotice", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("uses the selected locale", async () => {
    await i18n.changeLanguage("zh-CN");

    const html = renderToStaticMarkup(<InteractionPreparationNotice />);

    expect(html).toContain("正在准备审批…");
    expect(html).not.toContain("Preparing approval");
  });
});
