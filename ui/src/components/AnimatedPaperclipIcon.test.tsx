// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { setLocale } from "@/i18n";
import { PaperclipLoading } from "./AnimatedPaperclipIcon";

describe("PaperclipLoading", () => {
  afterEach(async () => {
    await setLocale("en");
  });

  it("localizes its screen-reader loading label", async () => {
    await setLocale("zh-CN");
    const markup = renderToStaticMarkup(<PaperclipLoading />);

    expect(markup).toContain(">加载中…<");
    expect(markup).not.toContain("Loading…");
  });
});
