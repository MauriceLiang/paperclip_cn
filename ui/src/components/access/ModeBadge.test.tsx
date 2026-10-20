import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { i18n } from "@/i18n";
import { ModeBadge } from "./ModeBadge";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("ModeBadge", () => {
  it.each([
    ["local_trusted", undefined, "本地可信"],
    ["authenticated", "public", "已认证 · 公开部署"],
    ["authenticated", "private", "已认证 · 私有部署"],
  ] as const)("localizes %s deployment mode", async (deploymentMode, deploymentExposure, expected) => {
    await i18n.changeLanguage("zh-CN");

    const markup = renderToStaticMarkup(
      <ModeBadge deploymentMode={deploymentMode} deploymentExposure={deploymentExposure} />,
    );

    expect(markup).toContain(expected);
  });
});
