import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import en from "@/i18n/locales/en.json";

function resolveEnglishCopy(key: string): string | undefined {
  let value: unknown = en;
  for (const part of key.split(".")) {
    if (!value || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : undefined;
}

function source(relativePath: string) {
  const content = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const keys = new Set<string>();
  const keyPattern = /(?:\bi18nKey\s*=\s*["']([^"']+)["']|\b(?:t|translate)\s*\(\s*["'`]([^"'`]+)["'`])/g;
  for (const match of content.matchAll(keyPattern)) {
    const key = match[1] ?? match[2];
    if (key) keys.add(key);
  }
  for (const match of content.matchAll(/["'`]([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+)["'`]/g)) {
    keys.add(match[1]);
  }
  const englishCopy = [...keys].map(resolveEnglishCopy).filter((value): value is string => Boolean(value));
  return `${content}\n${englishCopy.join("\n")}`;
}

describe("Apps agent selector contract", () => {
  it("keeps every agent chooser under /apps searchable", () => {
    const appConnect = source("./AppsConnect.tsx");
    const connectionSetupFlow = source("../../features/connections/ConnectionSetupFlow.tsx");
    const permissions = source("./app-detail/PermissionsPanel.tsx");
    const tester = source("./app-detail/ActionTestDialog.tsx");
    const profiles = source("../tools/ProfilesTab.tsx");
    const audit = source("../tools/AuditTab.tsx");

    expect(appConnect).toContain("<ConnectionSetupFlow");
    expect(connectionSetupFlow).toContain("<AgentMultiSelect");
    expect(permissions).toContain("<AgentMultiSelect");
    expect(tester).toContain('appsPage.actionTest.searchAgentsPlaceholder');
    expect(tester).toContain("Search agents…");

    expect(profiles.match(/<AgentSelect/g)).toHaveLength(2);
    expect(profiles).not.toContain("<Select value={agentId}");
    expect(profiles).not.toContain("<Select value={targetAgentId}");

    expect(audit).toContain("<AgentSelect");
    expect(audit).not.toContain("<Select value={agent}");
  });
});
