// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@/i18n";
import { EmailConnectionAccess } from "./EmailConnectionAccess";

const mocks = vi.hoisted(() => ({
  listConnectionGrants: vi.fn(),
  getConnectionInstalls: vi.fn(),
  putConnectionInstalls: vi.fn(),
}));

vi.mock("@/api/tools", () => ({ toolsApi: mocks }));
vi.mock("@/components/AgentMultiSelect", () => ({ AgentMultiSelect: () => null }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("EmailConnectionAccess", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    mocks.listConnectionGrants.mockResolvedValue({
      grants: [],
      capabilities: { canConfigure: false },
      currentUserId: "user-1",
    });
    mocks.getConnectionInstalls.mockResolvedValue({ installs: [] });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes credential and agent access controls", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
      root.render(
        <QueryClientProvider client={client}>
          <EmailConnectionAccess companyId="company-1" connectionId="connection-1" agents={[]} />
        </QueryClientProvider>,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("哪些成员可以使用此凭据？");
    expect(container.textContent).toContain("访问权限已撤销");
    expect(container.textContent).toContain("哪些 Agent 可以使用此连接？");
    expect(container.textContent).toContain("仅允许我选择的 Agent");
    expect(container.textContent).toContain("任何 Agent");
  });
});
