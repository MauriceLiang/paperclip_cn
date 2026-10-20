#!/usr/bin/env node
/**
 * Paperclip CN i18n audit.
 *
 * Produces review artifacts under artifacts/i18n/ (generated, not committed):
 *   - route-inventory.json
 *   - component-inventory.json
 *   - locale-key-parity.json
 *   - hardcoded-string-report.json
 *   - coverage-summary.md
 *
 * The hardcoded-string scan is a heuristic source scan (JSX text, common UI
 * attributes, UI config object properties, and sentence-like string literals).
 * Findings are candidates for human review, not an automatic gate.
 *
 * Usage:
 *   node scripts/i18n-audit.mjs           # write reports + print summary
 *   node scripts/i18n-audit.mjs --check   # fail on locale parity, placeholders, or missing source references
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UI_SRC = path.join(ROOT, "ui", "src");
const LOCALES_DIR = path.join(UI_SRC, "i18n", "locales");
const OUT_DIR = path.join(ROOT, "artifacts", "i18n");
const CHECK_ONLY = process.argv.includes("--check");

/**
 * Internal-only surfaces: design showcases, UX labs, performance harnesses, and
 * test fixtures. They are documented as out of release-translation scope.
 */
const INTERNAL_ONLY_PATTERNS = [
  /\/pages\/DesignGuide\.tsx$/,
  /\/pages\/(BootstrapSetupUxLab|CrossIssueCollaborationUxLab|InviteUxLab|IssueChatLongThreadPerf|IssueChatUxLab|ResponsibleUserDenialUxLab|RunTranscriptUxLab|SystemNoticeUxLab|TaskChatLab)\.tsx$/,
  /\/fixtures\//,
];

const SOURCE_LOCALE = "en";
const TARGET_LOCALE = "zh-CN";

const UI_ATTRIBUTES = [
  "placeholder",
  "title",
  "alt",
  "aria-label",
  "aria-description",
  "aria-valuetext",
  "label",
].join("|");

const UI_OBJECT_PROPS = [
  "label",
  "title",
  "description",
  "placeholder",
  "message",
  "emptyTitle",
  "emptyDescription",
  "tooltip",
  "subtitle",
  "confirmLabel",
  "cancelLabel",
  "submitLabel",
  "helperText",
  "errorMessage",
].join("|");

const NON_TRANSLATABLE_TERMS = new Set([
  "Paperclip",
  "GitHub",
  "GitLab",
  "MCP",
  "API",
  "HTTP",
  "HTTPS",
  "JSON",
  "SSE",
  "URL",
  "URI",
  "CLI",
  "SDK",
  "SSO",
  "SAML",
  "RBAC",
  "OAuth",
  "Agent",
  "Codex",
  "Claude",
  "Cursor",
  "Gemini",
  "Grok",
  "Kimi",
  "OpenCode",
  "Pi",
  "Hermes",
  "OpenClaw",
  "Slack",
  "Discord",
  "Telegram",
  "Teams",
  "Notion",
  "Linear",
  "Stripe",
  "Google",
  "Microsoft",
  "OpenAI",
  "Anthropic",
  "AWS",
  "S3",
  "GCP",
  "Vercel",
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function flatten(value, prefix = "", out = {}) {
  for (const [key, child] of Object.entries(value)) {
    const flatKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, flatKey, out);
    } else {
      out[flatKey] = child;
    }
  }
  return out;
}

function placeholders(value) {
  if (typeof value !== "string") return [];
  return [...value.matchAll(/{{\s*([A-Za-z0-9_.-]+)\s*}}/g)].map((match) => match[1]).sort();
}

function listSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["__snapshots__", "node_modules", "storybook"].includes(entry.name)) continue;
      listSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      if (/\.(test|stories|spec)\.(ts|tsx)$/.test(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function looksTranslatable(text) {
  const value = text.replace(/\s+/g, " ").trim();
  if (!value) return false;
  if (value.length < 2) return false;
  if (/[㐀-鿿]/.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (/^(https?:|mailto:|tel:|\/|\.{1,2}\/)/i.test(value)) return false;
  if (/^[#&*+\-–—.,:;!?/\\|()[\]{}<>_=~`'"]+$/.test(value)) return false;
  if (/^[A-Z0-9_./:-]+$/.test(value)) return false;
  if (/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/.test(value)) return false;
  if (/^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(value)) return false;
  if (/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/.test(value)) return false;
  if (value.split(" ").length === 1 && NON_TRANSLATABLE_TERMS.has(value)) return false;
  return true;
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function extractFromSource(file) {
  const source = fs.readFileSync(file, "utf8");
  const findings = [];
  const seen = new Set();

  const add = (index, kindName, text, extra = {}) => {
    const value = normalizeText(text);
    if (!value || !looksTranslatable(value)) return;
    const line = lineAt(source, index);
    const id = `${line}\u0000${kindName}\u0000${value}`;
    if (seen.has(id)) return;
    seen.add(id);
    findings.push({
      file: path.relative(ROOT, file),
      line,
      kind: kindName,
      text: value,
      translatable: true,
      ...extra,
    });
  };

  for (const match of source.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) {
    add(match.index, "jsx-text", match[1]);
  }

  const attributePattern = new RegExp(
    `\\b(${UI_ATTRIBUTES})\\s*=\\s*(?:"([^"]*[A-Za-z][^"]*)"|\\{\\s*"([^"]*[A-Za-z][^"]*)"\\s*\\})`,
    "g",
  );
  for (const match of source.matchAll(attributePattern)) {
    add(match.index, "jsx-attribute", match[2] ?? match[3] ?? "", { attribute: match[1] });
  }

  const propertyPattern = new RegExp(
    `\\b(${UI_OBJECT_PROPS})\\s*:\\s*(?:"([^"]*[A-Za-z][^"]*)"|'([^']*[A-Za-z][^']*)')`,
    "g",
  );
  for (const match of source.matchAll(propertyPattern)) {
    add(match.index, "object-property", match[2] ?? match[3] ?? "", { property: match[1] });
  }

  for (const match of source.matchAll(/(["'])([A-Z][^"'\n]{2,})\1/g)) {
    const start = match.index ?? 0;
    const prefix = source.slice(Math.max(0, start - 24), start);
    if (/(from|import|require|className|href|to|id|key|type|role|variant|size|data-|aria-|queryKey|url|path)\s*=\s*$/.test(prefix)) {
      continue;
    }
    if (/\bt\(\s*$/.test(prefix) || /\bt\(\s*"[^"]*$/.test(prefix)) continue;
    add(start, "string-literal", match[2]);
  }

  return findings;
}

function extractRoutes() {
  const appFile = path.join(UI_SRC, "App.tsx");
  const source = fs.readFileSync(appFile, "utf8");
  const routes = [];
  for (const match of source.matchAll(/<Route\b[\s\S]*?\bpath="([^"]*)"/g)) {
    routes.push({
      path: match[1],
      line: lineAt(source, match.index ?? 0),
      source: path.relative(ROOT, appFile),
    });
  }
  return routes;
}

const TRANSLATION_SUFFIXES = [
  "_zero", "_one", "_two", "_few", "_many", "_other",
  "_ordinal_one", "_ordinal_two", "_ordinal_few", "_ordinal_many", "_ordinal_other",
];

function translationKeyExists(locale, key) {
  return Object.hasOwn(locale, key)
    || TRANSLATION_SUFFIXES.some((suffix) => Object.hasOwn(locale, `${key}${suffix}`));
}

function extractTranslationReferences(files, en, zh) {
  const references = new Map();
  const keys = new Set();
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/\b(?:t|translate)\s*\(\s*(["'])([^"'\n]+)\1/g)) {
      const key = match[2];
      keys.add(key);
      if (translationKeyExists(en, key) && translationKeyExists(zh, key)) continue;
      const reference = {
        file: path.relative(ROOT, file),
        line: lineAt(source, match.index ?? 0),
        key,
        missingInSource: !translationKeyExists(en, key),
        missingInTarget: !translationKeyExists(zh, key),
      };
      references.set(`${reference.file}:${reference.line}:${key}`, reference);
    }
  }
  return {
    keyCount: keys.size,
    missing: [...references.values()].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.key.localeCompare(b.key)),
  };
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const en = flatten(readJson(path.join(LOCALES_DIR, `${SOURCE_LOCALE}.json`)));
  const zh = flatten(readJson(path.join(LOCALES_DIR, `${TARGET_LOCALE}.json`)));
  const sourceFiles = listSourceFiles(UI_SRC).filter(
    (file) => !file.includes(`${path.sep}i18n${path.sep}`),
  );
  const translationReferences = extractTranslationReferences(sourceFiles, en, zh);
  const missingTranslationReferences = translationReferences.missing;

  const missingInTarget = Object.keys(en).filter((key) => !(key in zh));
  const extraInTarget = Object.keys(zh).filter((key) => !(key in en));
  const emptyInTarget = Object.entries(zh)
    .filter(([, value]) => typeof value !== "string" || value.trim() === "")
    .map(([key]) => key);
  const placeholderMismatches = Object.keys(en)
    .filter((key) => key in zh)
    .filter((key) => placeholders(en[key]).join("\u0000") !== placeholders(zh[key]).join("\u0000"))
    .map((key) => ({
      key,
      source: placeholders(en[key]),
      target: placeholders(zh[key]),
    }));
  const identicalToEnglish = Object.keys(en)
    .filter((key) => key in zh && en[key] === zh[key])
    .filter((key) => !NON_TRANSLATABLE_TERMS.has(en[key]))
    .filter((key) => looksTranslatable(en[key]));

  const parity = {
    sourceLocale: SOURCE_LOCALE,
    targetLocale: TARGET_LOCALE,
    sourceKeys: Object.keys(en).length,
    targetKeys: Object.keys(zh).length,
    missingInTarget,
    extraInTarget,
    emptyInTarget,
    placeholderMismatches,
    identicalToEnglish,
    ok:
      missingInTarget.length === 0
      && extraInTarget.length === 0
      && emptyInTarget.length === 0
      && placeholderMismatches.length === 0,
  };

  const problems = [];
  if (!parity.ok) {
    if (missingInTarget.length) problems.push(`${missingInTarget.length} missing zh-CN keys`);
    if (extraInTarget.length) problems.push(`${extraInTarget.length} extra zh-CN keys`);
    if (emptyInTarget.length) problems.push(`${emptyInTarget.length} empty zh-CN values`);
    if (placeholderMismatches.length) problems.push(`${placeholderMismatches.length} placeholder mismatches`);
  }
  if (missingTranslationReferences.length) {
    problems.push(`${missingTranslationReferences.length} source translation references missing locale keys`);
  }
  const ok = parity.ok && missingTranslationReferences.length === 0;

  if (CHECK_ONLY) {
    console.log(JSON.stringify({
      ok,
      problems,
      sourceKeys: parity.sourceKeys,
      targetKeys: parity.targetKeys,
      literalTranslationKeys: translationReferences.keyCount,
      missingTranslationReferences,
    }, null, 2));
    process.exit(ok ? 0 : 1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeJson("locale-key-parity.json", parity);
  writeJson("translation-reference-report.json", {
    sourceFiles: sourceFiles.length,
    literalTranslationKeys: translationReferences.keyCount,
    missingTranslationReferences,
    ok: missingTranslationReferences.length === 0,
  });

  const isInternalOnly = (file) => INTERNAL_ONLY_PATTERNS.some((pattern) => pattern.test(file));
  const internalOnlyFiles = sourceFiles.filter(isInternalOnly);
  const productFiles = sourceFiles.filter((file) => !isInternalOnly(file));
  const findings = productFiles.flatMap(extractFromSource);
  writeJson("hardcoded-string-report.json", findings);

  const routes = extractRoutes();
  writeJson("route-inventory.json", routes);

  const componentInventory = productFiles.map((file) => ({
    file: path.relative(ROOT, file),
    lines: fs.readFileSync(file, "utf8").split("\n").length,
    findings: findings.filter((finding) => finding.file === path.relative(ROOT, file)).length,
    translatable: findings.filter(
      (finding) => finding.file === path.relative(ROOT, file) && finding.translatable,
    ).length,
  }));
  componentInventory.sort((a, b) => b.translatable - a.translatable || a.file.localeCompare(b.file));
  writeJson("component-inventory.json", componentInventory);

  const byArea = {};
  for (const finding of findings) {
    const area = finding.file.startsWith("ui/src/pages/") ? "pages"
      : finding.file.startsWith("ui/src/components/") ? "components"
      : finding.file.startsWith("ui/src/features/") ? "features"
      : finding.file.startsWith("ui/src/context/") ? "context"
      : finding.file.startsWith("ui/src/lib/") ? "lib"
      : finding.file.startsWith("ui/src/hooks/") ? "hooks"
      : finding.file.startsWith("ui/src/api/") ? "api"
      : "other";
    byArea[area] = (byArea[area] ?? 0) + 1;
  }

  const topFiles = componentInventory.filter((item) => item.translatable > 0).slice(0, 30);
  const summary = [
    "# Paperclip CN i18n audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Locale parity",
    "",
    `- Source keys: ${parity.sourceKeys}`,
    `- Target keys: ${parity.targetKeys}`,
    `- Missing in ${TARGET_LOCALE}: ${missingInTarget.length}`,
    `- Extra in ${TARGET_LOCALE}: ${extraInTarget.length}`,
    `- Empty in ${TARGET_LOCALE}: ${emptyInTarget.length}`,
    `- Placeholder mismatches: ${placeholderMismatches.length}`,
    `- Identical to English (review): ${identicalToEnglish.length}`,
    `- Literal source translation keys: ${translationReferences.keyCount}`,
    `- Missing source translation references: ${missingTranslationReferences.length}`,
    "",
    "## Hardcoded string candidates",
    "",
    `- Source files scanned: ${sourceFiles.length}`,
    `- Internal/dev-only files excluded: ${internalOnlyFiles.length}`,
    `- Total findings: ${findings.length}`,
    "",
    ...Object.entries(byArea)
      .sort((a, b) => b[1] - a[1])
      .map(([area, count]) => `- ${area}: ${count}`),
    "",
    "## Top files by translatable candidates",
    "",
    "| File | Lines | Translatable candidates |",
    "| --- | ---: | ---: |",
    ...topFiles.map((item) => `| ${item.file} | ${item.lines} | ${item.translatable} |`),
    "",
    "## Routes",
    "",
    `- Routes found in App.tsx: ${routes.length}`,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(OUT_DIR, "coverage-summary.md"), summary);

  console.log(summary);
  console.log(`Artifacts written to ${path.relative(ROOT, OUT_DIR)}/`);
  if (!ok) {
    console.error(`i18n check failed: ${problems.join(", ")}`);
    process.exit(1);
  }
}

main();
