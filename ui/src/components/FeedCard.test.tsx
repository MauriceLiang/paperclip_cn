import type { ActivityEvent } from "@paperclipai/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import { FeedCard } from "./FeedCard";

describe("FeedCard localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the board actor, activity verb, and review action in Simplified Chinese", async () => {
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

    const html = renderToStaticMarkup(
      <FeedCard
        event={event}
        agentMap={new Map()}
        entityNameMap={new Map()}
        isPinned
      />,
    );

    expect(html).toContain("看板");
    expect(html).toContain("创建了组织");
    expect(html).toContain("审核 →");
    expect(html).not.toContain("Board");
    expect(html).not.toContain("Review →");
  });
});
