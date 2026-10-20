// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { CompanySearchResult } from "@paperclipai/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@/i18n";
import { SearchResultRow } from "./SearchResultRow";

vi.mock("@/lib/router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe("SearchResultRow localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("localizes the artifact source label and relative timestamp", async () => {
    await i18n.changeLanguage("zh-CN");
    const result: CompanySearchResult = {
      id: "artifact-1",
      type: "artifact",
      score: 1,
      title: "Build output",
      href: "/artifacts/artifact-1",
      matchedFields: ["artifact"],
      sourceLabel: "Artifact",
      snippet: "Build completed",
      snippets: [{ field: "artifact", label: "Artifact", text: "Build completed", highlights: [] }],
      artifact: {
        id: "artifact-1",
        source: "attachment",
        mediaKind: "text",
        issueId: "issue-1",
        issueIdentifier: "PAP-1",
        issueTitle: "Build the app",
        projectId: null,
        projectName: null,
        updatedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
      },
      updatedAt: null,
      previewImageUrl: null,
    };

    const markup = renderToStaticMarkup(<SearchResultRow result={result} />);
    expect(markup).toContain("交付成果");
    expect(markup).toContain("10分钟前");
    expect(markup).not.toContain(">Artifact<");
  });
});
