import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@/i18n";
import { BreadcrumbProvider } from "../context/BreadcrumbContext";
import { MyIssues } from "./MyIssues";

vi.mock("../context/CompanyContext", () => ({
  useCompany: () => ({ selectedCompanyId: null }),
}));

vi.mock("../hooks/useStreamlinedUiEnabled", () => ({
  useStreamlinedUiEnabled: () => ({ enabled: false }),
}));

function renderMyIssues() {
  const queryClient = new QueryClient();
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <BreadcrumbProvider>
        <MyIssues />
      </BreadcrumbProvider>
    </QueryClientProvider>,
  );
}

describe("MyIssues localization", () => {
  it.each([
    ["en", "Select a company to view your tasks."],
    ["zh-CN", "请选择公司以查看你的任务。"],
  ])("renders the company empty state in %s", async (locale, expected) => {
    await i18n.changeLanguage(locale);

    expect(renderMyIssues()).toContain(expected);
  });
});
