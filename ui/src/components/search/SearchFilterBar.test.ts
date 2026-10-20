import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import { buildSearchFilterOptions } from "./SearchFilterBar";

describe("SearchFilterBar options localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("localizes status, priority, and assignee options", async () => {
    await i18n.changeLanguage("zh-CN");
    const options = buildSearchFilterOptions({
      agents: [],
      projects: [],
      labels: [],
      currentUserId: "user-1",
    });

    expect(options.status.find((option) => option.value === "in_progress")?.label).toBe("进行中");
    expect(options.priority.find((option) => option.value === "high")?.label).toBe("高");
    expect(options.assignee.map((option) => option.label)).toEqual(["我", "未分配"]);
  });
});
