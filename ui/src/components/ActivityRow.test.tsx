import type { ActivityEvent } from "@paperclipai/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import type { CompanyUserProfile } from "@/lib/company-members";
import { ActivityRow } from "./ActivityRow";

describe("ActivityRow localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("localizes a cached local-board profile in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const event: ActivityEvent = {
      id: "event-1",
      companyId: "company-1",
      actorType: "user",
      actorId: "local-board",
      action: "company.created",
      entityType: "company",
      entityId: "company-1",
      agentId: null,
      runId: null,
      details: null,
      createdAt: new Date(),
    };
    const userProfileMap = new Map<string, CompanyUserProfile>([
      ["local-board", { label: "Board", image: null }],
    ]);

    const html = renderToStaticMarkup(
      <ActivityRow
        event={event}
        agentMap={new Map()}
        userProfileMap={userProfileMap}
        entityNameMap={new Map()}
      />,
    );

    expect(html).toContain("看板");
    expect(html).toContain("创建了组织");
    expect(html).not.toContain("Board");
  });
});
