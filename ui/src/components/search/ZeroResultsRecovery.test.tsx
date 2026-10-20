// @vitest-environment node

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { setLocale } from "@/i18n";
import { ZeroResultsRecovery } from "./ZeroResultsRecovery";

describe("ZeroResultsRecovery", () => {
  it("renders the search recovery guidance in Simplified Chinese", async () => {
    await setLocale("zh-CN");
    try {
      const html = renderToStaticMarkup(
        <ZeroResultsRecovery
          query="演示任务"
          filters={{ status: ["todo"] }}
          zeroResults={{
            unfilteredTotal: 2,
            loosenSuggestions: [
              { filter: "status", values: ["todo"], resultCount: 2, additionalCount: 2 },
            ],
          }}
          lookups={{
            agentName: () => undefined,
            userName: () => undefined,
            projectName: () => undefined,
            labelName: () => undefined,
            currentUserId: null,
          }}
          onChange={() => undefined}
          onClearAll={() => undefined}
        />,
      );

      expect(html).toContain("没有符合这些筛选条件的结果");
      expect(html).toContain("搜索“演示任务”可找到 2 条结果");
      expect(html).toContain("当前 1 个筛选条件已将这些结果全部隐藏");
      expect(html).toContain("移除");
      expect(html).toContain("清除所有筛选条件");
    } finally {
      await setLocale("en");
    }
  });
});
