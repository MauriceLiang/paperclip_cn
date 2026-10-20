# Paperclip CN 简体中文本地化实施记录

Date: 2026-10-19
Status: foundation (L0–L1) complete; module translation (L2–L5) partial; L6 partial; final acceptance (L7) pending. See `2026-10-19-zh-cn-localization-handoff.md` for the current file-level status and known blockers.
Branch: `feat/zh-cn-i18n-foundation` (local fork only)

## 1. Goal

Provide a persistent, switchable Simplified Chinese UI for the Paperclip CN fork
while keeping English as the complete source and fallback language. This is an
incremental localization change; it does not alter business behavior, data
storage values, protocols, or the visual design system.

## 2. Locale architecture

The existing `i18next` + `react-i18next` integration is reused.

| Concept | Value | Meaning |
| --- | --- | --- |
| `SOURCE_LOCALE` | `en` | The locale every key is authored in. |
| `FALLBACK_LOCALE` | `en` | Missing translations fall back to English. |
| `INITIAL_UI_LOCALE` | `zh-CN` | First-visit language for this fork. |
| strict locales | `en`, `zh-CN` | Must contain every source key. |
| other locales | partial | May miss keys; provided values are still safety-checked. |

Key files:

- `ui/src/i18n/index.ts` — i18next init, `setLocale`, `<html lang>` updates.
- `ui/src/i18n/locales.ts` — source/fallback/initial locales, strict/partial
  registration, complete-language list.
- `ui/src/i18n/locale-validation.ts` — strict and partial validation modes.
- `ui/src/i18n/locale-preference.ts` — `localStorage` key
  `paperclip.ui.locale`, safe reads/writes, document language.
- `ui/src/i18n/status.ts` — explicit machine-value → translation-key maps for
  status and priority labels.
- `ui/src/i18n/formatters.ts` — `Intl` date/number/currency helpers.
- `ui/src/i18n/terminology.md` — the term glossary.

Language selection priority: saved browser preference, then `zh-CN` for this
fork, then English. Switching updates i18next in place (no page reload) and
persists the choice per browser. The selector lives in Profile settings and is
implemented by `LanguagePreferenceControl`.

## 3. Validation policy

`validateLocaleMessages(candidate, reference, { mode })` supports:

- `strict` (default): exact key parity, placeholder parity, safety checks.
- `partial`: missing keys allowed (English fallback), unknown keys rejected, and
  every provided value still checked for placeholder parity, raw HTML, event
  handlers, `javascript:`/`data:` payloads, unexpected URLs, and length.

`en` and `zh-CN` are strict. All other registered locales are partial, so the
existing ~38 locale files keep loading after English keys are added. They are
not advertised as complete languages in the picker.

## 4. Translation keys and fragments

Keys are domain-scoped (`nav.*`, `common.*`, `status.*`, `agentsPage.*`,
`issuesPage.*`, `settingsPage.*`, `appsPage.*`, etc.). Machine values are never
translated or written back to the database; explicit allowlist maps pick a
display key.

Large modules were translated in parallel using per-module fragments under
`ui/src/i18n/locales/fragments/`. A fragment is one namespace in two files and
is merged with:

```sh
node scripts/i18n-merge-fragments.mjs
node scripts/i18n-merge-fragments.mjs --force   # overwrite an updated fragment value
node scripts/i18n-merge-fragments.mjs --clean   # remove merged fragments
```

Fragments are working files, not release artifacts.

## 5. Audit tooling

`scripts/i18n-audit.mjs` writes review artifacts to `artifacts/i18n/`
(git-ignored):

- `route-inventory.json` — routes parsed from `ui/src/App.tsx`.
- `component-inventory.json` — source files and candidate counts.
- `locale-key-parity.json` — missing/extra/empty keys and placeholder issues.
- `hardcoded-string-report.json` — heuristic candidates for human review.
- `coverage-summary.md` — the summary below.

Commands:

```sh
pnpm i18n:audit     # write reports + summary
pnpm i18n:check     # fail on key parity or placeholder errors
```

Internal-only surfaces (design guide, UX labs, performance harnesses, fixtures)
are excluded from the translatable denominator and must remain explicitly
listed in the coverage report.

## 6. Module coverage (current)

Translated: shell/navigation/account menus, auth, CLI auth, board claim,
invitation landing, onboarding, common dialogs, command palette, status/priority
badges, filters, search, inbox/timeline/dashboard, projects/goals/workspaces,
agents/org/config, issue lists (filters/status), routines/approvals/costs/
artifacts/audit, skills/plugins, settings/access/secrets, apps/connections/
tools, pipelines/cases, status cards/team catalog, and shared libraries
(attention, blocked inbox, search filters, issue chat messages, run retry,
transcript presentation, external objects, skill denial, interactions).

Still not wired to `t()` (translation keys exist for the first three):
`IssueDetail`/`IssueProperties`/`IssueChatThread`/interaction cards,
all of `components/task-chat`, `components/new-agent`, `ui/src/adapters`,
routine section/trigger editors, AI connections, access invites, skills import
dialog, transcript view, and the remaining parts of `IssuesList`/
`LegacyIssuesList`/`LegacyInbox`. See the handoff document for the hotspot
table and known test failures.

## 7. Verification

Required before claiming completion:

```sh
node scripts/i18n-audit.mjs --check
pnpm --filter @paperclipai/ui typecheck
pnpm test:run
pnpm build
pnpm check:token-gates
```

Targeted checks used during implementation:

```sh
pnpm --filter @paperclipai/ui exec vitest run src/i18n
pnpm --filter @paperclipai/ui exec vitest run src/components/LanguagePreferenceControl.test.tsx
```

The Vitest setup pins the test locale to English so existing English assertions
remain meaningful; locale-preference tests inject their own storage and verify
default `zh-CN`, persistence, corrupt-storage tolerance, `<html lang>`, and
in-place switching.

## 8. Explicit boundaries

Not translated by design:

- user data: company/agent/project/task/skill names, comments, messages,
  prompts, file contents, paths, artifact content;
- agent/model output, command stdout/stderr, third-party response bodies,
  server-returned raw error messages;
- API field names, stored enum values, IDs, URL paths, CLI commands, MCP tool
  names, model IDs, environment variable names, Git refs/hashes;
- brand names (Paperclip, GitHub, Codex, Claude, Cursor, Gemini, OpenClaw, MCP,
  etc.) and programming language names.

External dynamic plugin UI is an extension boundary: repository-maintained
plugin surfaces are translated, third-party plugin content is not guaranteed.

## 9. Known follow-ups

- Read `2026-10-19-zh-cn-localization-handoff.md` first. It records the
  current 52 failing UI tests and five root causes, including the global
  `<link>` void-element bug in `html-parse-stringify`, the status-label casing
  semantics, and test-locale storage pollution.
- Finish the remaining modules listed in section 6, reusing the already-merged
  `issuesPage`, `taskChatPage`, and `agentSetupPage` namespaces.
- Complete browser-level acceptance for Chinese/English switching, persistence,
  narrow layouts, dark/light themes, and all feature-gated routes.
- Re-run the audit after every upstream sync; new keys must land in both `en`
  and `zh-CN`.
- Keep the key-parity check in CI once the remaining modules are merged.
