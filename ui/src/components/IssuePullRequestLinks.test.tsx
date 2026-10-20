// @vitest-environment node

import { renderToStaticMarkup } from "react-dom/server";
import type { IssueWorkProduct } from "@paperclipai/shared";
import { describe, expect, it } from "vitest";
import { setLocale } from "@/i18n";
import { IssuePullRequestLinks } from "./IssuePullRequestLinks";

const pullRequest = {
  id: "pr-1",
  companyId: "company-1",
  projectId: null,
  issueId: "issue-1",
  executionWorkspaceId: null,
  runtimeServiceId: null,
  type: "pull_request",
  provider: "github",
  externalId: "1",
  title: "Localization change",
  url: "https://github.com/acme/app/pull/1",
  status: "merged",
  reviewState: "needs_board_review",
  isPrimary: false,
  healthStatus: "unknown",
  summary: null,
  metadata: null,
  createdByRunId: null,
  createdAt: new Date("2026-10-20T00:00:00.000Z"),
  updatedAt: new Date("2026-10-20T00:00:00.000Z"),
} satisfies IssueWorkProduct;

describe("IssuePullRequestLinks", () => {
  it("keeps merged-provider detection independent of localized status text", async () => {
    await setLocale("zh-CN");
    try {
      const html = renderToStaticMarkup(
        <IssuePullRequestLinks
          products={[pullRequest]}
          externalObjects={[
            {
              providerKey: "github",
              objectType: "pull_request",
              statusCategory: "closed",
              liveness: "fresh",
              statusLabel: "已关闭",
              statusIconKey: null,
              url: pullRequest.url,
            },
          ]}
        />,
      );

      expect(html).toContain("已保存: 已合并");
      expect(html).not.toContain("已请求审查");
    } finally {
      await setLocale("en");
    }
  });
});
