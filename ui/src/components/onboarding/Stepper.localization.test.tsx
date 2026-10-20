import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import { ONBOARDING_STEP_LABELS, Stepper } from "./Stepper";
import { FooterNav } from "./FooterNav";
import { CredentialModeLink } from "./CredentialModeLink";
import { CredentialTag } from "./ModelSourceTiles";

describe("Stepper localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("localizes step names and the announced count in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    const markup = renderToStaticMarkup(
      <Stepper step={1} total={ONBOARDING_STEP_LABELS.length} labels={ONBOARDING_STEP_LABELS} />,
    );

    expect(markup).toContain('aria-label="为组织命名"');
    expect(markup).toContain("第 1 步，共 4 步");
    expect(markup).not.toContain("Step 1 of 4");
  });

  it("localizes the onboarding back action", async () => {
    await i18n.changeLanguage("zh-CN");

    const markup = renderToStaticMarkup(
      <FooterNav onBack={() => undefined} primaryLabel="继续" onPrimary={() => undefined} />,
    );

    expect(markup).toContain("返回");
    expect(markup).not.toContain(">Back<");
  });

  it("localizes credential tags and the mode-switch action", async () => {
    await i18n.changeLanguage("zh-CN");

    const markup = renderToStaticMarkup(
      <div>
        <CredentialTag mode="subscription" />
        <CredentialTag mode="api" />
        <CredentialTag mode="advanced" />
        <CredentialModeLink mode="subscription" onChange={() => undefined} />
      </div>,
    );

    expect(markup).toContain("订阅");
    expect(markup).toContain("API 密钥");
    expect(markup).toContain("自定义网关");
    expect(markup).toContain("改用 API 密钥");
    expect(markup).not.toContain("Subscription");
    expect(markup).not.toContain("Use API key instead");
  });
});
