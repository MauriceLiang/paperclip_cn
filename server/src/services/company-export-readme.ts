/**
 * Generates README.md with Mermaid org chart for company exports.
 */
import type { CompanyPortabilityManifest } from "@paperclipai/shared";

const ROLE_LABELS: Record<string, string> = {
  ceo: "CEO",
  cto: "CTO",
  cmo: "CMO",
  cfo: "CFO",
  coo: "COO",
  vp: "VP",
  manager: "Manager",
  engineer: "Engineer",
  agent: "Agent",
};

const ZH_CN_ROLE_LABELS: Record<string, string> = {
  ceo: "首席执行官（CEO）",
  cto: "首席技术官（CTO）",
  cmo: "首席营销官（CMO）",
  cfo: "首席财务官（CFO）",
  coo: "首席运营官（COO）",
  vp: "副总裁",
  manager: "经理",
  engineer: "工程师",
  agent: "智能体",
};

/**
 * Generate a Mermaid flowchart (TD = top-down) representing the org chart.
 * Returns null if there are no agents.
 */
export function generateOrgChartMermaid(agents: CompanyPortabilityManifest["agents"]): string | null {
  if (agents.length === 0) return null;

  const lines: string[] = [];
  lines.push("```mermaid");
  lines.push("graph TD");

  // Node definitions with role labels
  for (const agent of agents) {
    const roleLabel = ROLE_LABELS[agent.role] ?? agent.role;
    const id = mermaidId(agent.slug);
    lines.push(`    ${id}["${mermaidEscape(agent.name)}<br/><small>${mermaidEscape(roleLabel)}</small>"]`);
  }

  // Edges from parent to child
  const slugSet = new Set(agents.map((a) => a.slug));
  for (const agent of agents) {
    if (agent.reportsToSlug && slugSet.has(agent.reportsToSlug)) {
      lines.push(`    ${mermaidId(agent.reportsToSlug)} --> ${mermaidId(agent.slug)}`);
    }
  }

  lines.push("```");
  return lines.join("\n");
}

/** Sanitize slug for use as a Mermaid node ID (alphanumeric + underscore). */
function mermaidId(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_]/g, "_");
}

/** Escape text for Mermaid node labels. */
function mermaidEscape(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build a display label for a skill's source, linking to GitHub when available. */
function skillSourceLabel(skill: CompanyPortabilityManifest["skills"][number]): string {
  if (skill.sourceLocator) {
    // For GitHub or URL sources, render as a markdown link
    if (skill.sourceType === "github" || skill.sourceType === "skills_sh" || skill.sourceType === "url") {
      return `[${skill.sourceType}](${skill.sourceLocator})`;
    }
    return skill.sourceLocator;
  }
  if (skill.sourceType === "local") return "local";
  return skill.sourceType ?? "\u2014";
}

/**
 * Generate the README.md content for a company export.
 */
export function generateReadme(
  manifest: CompanyPortabilityManifest,
  options: {
    companyName: string;
    companyDescription: string | null;
    readmeLocale?: "en" | "zh-CN";
  },
): string {
  const isChinese = options.readmeLocale === "zh-CN";
  const roleLabels = isChinese ? ZH_CN_ROLE_LABELS : ROLE_LABELS;
  const lines: string[] = [];

  lines.push(`# ${options.companyName}`);
  lines.push("");
  if (options.companyDescription) {
    lines.push(`> ${options.companyDescription}`);
    lines.push("");
  }

  // Org chart image (generated during export as images/org-chart.png)
  if (manifest.agents.length > 0) {
    lines.push(`![${isChinese ? "组织架构图" : "Org Chart"}](images/org-chart.png)`);
    lines.push("");
  }

  // What's Inside table
  lines.push(`## ${isChinese ? "内容概览" : "What's Inside"}`);
  lines.push("");
  lines.push(isChinese
    ? "> 这是一个来自 [Paperclip](https://paperclip.ing) 的智能体公司（[Agent Company](https://agentcompanies.io)）包。"
    : "> This is an [Agent Company](https://agentcompanies.io) package from [Paperclip](https://paperclip.ing)");
  lines.push("");

  const counts: Array<[string, number]> = [];
  if (manifest.agents.length > 0) counts.push([isChinese ? "智能体" : "Agents", manifest.agents.length]);
  if (manifest.projects.length > 0) counts.push([isChinese ? "项目" : "Projects", manifest.projects.length]);
  if (manifest.skills.length > 0) counts.push([isChinese ? "技能" : "Skills", manifest.skills.length]);
  if (manifest.issues.length > 0) counts.push([isChinese ? "任务" : "Tasks", manifest.issues.length]);

  if (counts.length > 0) {
    lines.push(isChinese ? "| 内容 | 数量 |" : "| Content | Count |");
    lines.push(isChinese ? "|------|------|" : "|---------|-------|");
    for (const [label, count] of counts) {
      lines.push(`| ${label} | ${count} |`);
    }
    lines.push("");
  }

  // Agents table
  if (manifest.agents.length > 0) {
    lines.push(`### ${isChinese ? "智能体" : "Agents"}`);
    lines.push("");
    lines.push(isChinese ? "| 智能体 | 职责 | 汇报对象 |" : "| Agent | Role | Reports To |");
    lines.push(isChinese ? "|--------|------|----------|" : "|-------|------|------------|");
    for (const agent of manifest.agents) {
      const roleLabel = roleLabels[agent.role] ?? agent.role;
      const reportsTo = agent.reportsToSlug ?? "\u2014";
      lines.push(`| ${agent.name} | ${roleLabel} | ${reportsTo} |`);
    }
    lines.push("");
  }

  // Projects list
  if (manifest.projects.length > 0) {
    lines.push(`### ${isChinese ? "项目" : "Projects"}`);
    lines.push("");
    for (const project of manifest.projects) {
      const desc = project.description ? ` \u2014 ${project.description}` : "";
      lines.push(`- **${project.name}**${desc}`);
    }
    lines.push("");
  }

  // Skills list
  if (manifest.skills.length > 0) {
    lines.push(`### ${isChinese ? "技能" : "Skills"}`);
    lines.push("");
    lines.push(isChinese ? "| 技能 | 说明 | 来源 |" : "| Skill | Description | Source |");
    lines.push(isChinese ? "|------|------|------|" : "|-------|-------------|--------|");
    for (const skill of manifest.skills) {
      const desc = skill.description ?? "\u2014";
      const source = skillSourceLabel(skill);
      lines.push(`| ${skill.name} | ${desc} | ${source} |`);
    }
    lines.push("");
  }

  // Getting Started
  lines.push(`## ${isChinese ? "开始使用" : "Getting Started"}`);
  lines.push("");
  lines.push("```bash");
  lines.push("npx paperclipai company import this-github-url-or-folder");
  lines.push("```");
  lines.push("");
  lines.push(isChinese
    ? "更多信息请访问 [Paperclip](https://paperclip.ing)。"
    : "See [Paperclip](https://paperclip.ing) for more information.");
  lines.push("");

  // Footer
  lines.push("---");
  lines.push(isChinese
    ? `由 [Paperclip](https://paperclip.ing) 导出，日期：${new Date().toISOString().split("T")[0]}`
    : `Exported from [Paperclip](https://paperclip.ing) on ${new Date().toISOString().split("T")[0]}`);
  lines.push("");

  return lines.join("\n");
}
