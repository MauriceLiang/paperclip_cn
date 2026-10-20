import { describe, expect, it } from "vitest";

import type { CompanyPortabilityManifest } from "@paperclipai/shared";
import { generateReadme } from "../services/company-export-readme.js";

const manifest = {
  agents: [{ slug: "ceo", name: "负责人", role: "ceo", reportsToSlug: null }],
  projects: [{ slug: "roadmap", name: "路线图", description: null }],
  skills: [],
  issues: [],
} as unknown as CompanyPortabilityManifest;

describe("company export README locale", () => {
  it("localizes generated headings and built-in role labels in Simplified Chinese", () => {
    const readme = generateReadme(manifest, {
      companyName: "中文组织",
      companyDescription: "组织说明保留原文",
      readmeLocale: "zh-CN",
    });

    expect(readme).toContain("## 内容概览");
    expect(readme).toContain("| 内容 | 数量 |");
    expect(readme).toContain("| 负责人 | 首席执行官（CEO） | — |");
    expect(readme).toContain("### 项目");
    expect(readme).toContain("## 开始使用");
    expect(readme).toContain("npx paperclipai company import this-github-url-or-folder");
    expect(readme).not.toContain("What's Inside");
    expect(readme).toContain("组织说明保留原文");
  });

  it("keeps the English README as the default for non-UI callers", () => {
    const readme = generateReadme(manifest, {
      companyName: "Acme",
      companyDescription: null,
    });

    expect(readme).toContain("## What's Inside");
    expect(readme).toContain("## Getting Started");
  });
});
