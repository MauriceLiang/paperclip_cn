import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider, Trans } from "react-i18next";
import { describe, expect, it } from "vitest";

import { i18n } from ".";

describe("translated links", () => {
  it("keeps translated link text inside its anchor", async () => {
    await i18n.changeLanguage("en");

    const markup = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <Trans
          i18nKey="toolsPage.pasteConfig.justUrl"
          components={{ lnk: <a href="/apps" /> }}
        />
      </I18nextProvider>,
    );

    expect(markup).toContain('<a href="/apps">Browse planned app connections</a>');
  });
});
