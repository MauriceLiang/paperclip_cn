// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { AdapterConfigFieldsProps } from "./types";
import { SchemaConfigFields, invalidateConfigSchemaCache } from "./schema-config-fields";
import { TooltipProvider } from "../components/ui/tooltip";
import { defaultCreateValues } from "../components/agent-config-defaults";
import { setLocale } from "@/i18n";

let root: Root | undefined;
afterEach(async () => { if (root) await act(async () => root?.unmount()); root = undefined; document.body.innerHTML = ""; vi.unstubAllGlobals(); await setLocale("en"); });

it("drops the old schema immediately when the adapter changes and applies new create defaults", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const firstType = "section-test-first";
  const secondType = "section-test-second";
  invalidateConfigSchemaCache(firstType);
  invalidateConfigSchemaCache(secondType);
  let resolveSecond!: (value: unknown) => void;
  const secondResponse = new Promise((resolve) => { resolveSecond = resolve; });
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [{ key: "first", label: "First setting", type: "text", default: "first-default" }] }) })
    .mockReturnValueOnce(secondResponse));
  const set = vi.fn();
  const props: AdapterConfigFieldsProps = {
    mode: "create", isCreate: true, adapterType: firstType, section: "configuration",
    values: { ...defaultCreateValues, adapterSchemaValues: {} }, set,
    config: {}, eff: (_group, _field, original) => original, mark: vi.fn(), models: [],
  };
  const view = (adapterType: string) => <TooltipProvider><SchemaConfigFields {...props} adapterType={adapterType} /></TooltipProvider>;
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(view(firstType)));
  expect(container.textContent).toContain("First setting");
  expect(set).toHaveBeenCalledWith({ adapterSchemaValues: { first: "first-default" } });
  await act(async () => root?.render(view(secondType)));
  expect(container.textContent).not.toContain("First setting");
  await act(async () => resolveSecond({ ok: true, json: async () => ({ fields: [{ key: "second", label: "Second setting", type: "text", default: "second-default" }] }) }));
  expect(container.textContent).toContain("Second setting");
  expect(set).toHaveBeenLastCalledWith({ adapterSchemaValues: { second: "second-default" } });
});


it("restores cleared defaults after switching back before the intermediate schema loads", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const firstType = "rapid-switch-first";
  const secondType = "rapid-switch-second";
  invalidateConfigSchemaCache(firstType);
  invalidateConfigSchemaCache(secondType);
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [{ key: "model", label: "Model", type: "text", default: "default-model" }] }) })
    .mockReturnValueOnce(new Promise(() => {})));
  const set = vi.fn();
  const props: AdapterConfigFieldsProps = {
    mode: "create", isCreate: true, adapterType: firstType, section: "configuration",
    values: { ...defaultCreateValues, adapterSchemaValues: { model: "chosen-model" } }, set,
    config: {}, eff: (_group, _field, original) => original, mark: vi.fn(), models: [],
  };
  const view = (adapterType: string) => <TooltipProvider><SchemaConfigFields {...props} adapterType={adapterType} /></TooltipProvider>;
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(view(firstType)));
  expect(set).toHaveBeenLastCalledWith({ adapterSchemaValues: { model: "chosen-model" } });
  props.values = { ...defaultCreateValues, adapterSchemaValues: {} };
  await act(async () => root?.render(view(secondType)));
  set.mockClear();
  await act(async () => root?.render(view(firstType)));
  expect(set).toHaveBeenCalledExactlyOnceWith({ adapterSchemaValues: { model: "default-model" } });
});

it("localizes built-in Cursor Cloud schema labels, hints, and runtime options", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  await setLocale("zh-CN");

  const adapterType = "cursor_cloud";
  invalidateConfigSchemaCache(adapterType);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      fields: [
        { key: "repoUrl", label: "Repository URL", type: "text", hint: "Git repository URL Cursor should open for this agent." },
        { key: "runtimeEnvType", label: "Cursor runtime", type: "select", default: "cloud", options: [
          { value: "cloud", label: "Cursor hosted" },
          { value: "pool", label: "Self-hosted pool" },
          { value: "machine", label: "Named machine" },
        ], hint: "Choose where Cursor should execute the remote agent." },
      ],
    }),
  }));
  const props: AdapterConfigFieldsProps = {
    mode: "edit", isCreate: false, adapterType, section: undefined,
    values: defaultCreateValues, set: vi.fn(),
    config: { repoUrl: "https://example.com/repo", runtimeEnvType: "cloud" }, eff: (_group, _field, original) => original, mark: vi.fn(), models: [],
  };
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(<TooltipProvider><SchemaConfigFields {...props} /></TooltipProvider>));

  expect(container.textContent).toContain("仓库 URL");
  expect(container.textContent).toContain("Cursor 云端托管");
  expect(container.textContent).not.toContain("Repository URL");
  expect(container.textContent).not.toContain("Cursor hosted");
});

it("localizes built-in Hermes Local schema labels while preserving provider brands", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  await setLocale("zh-CN");

  const adapterType = "hermes_local";
  invalidateConfigSchemaCache(adapterType);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      fields: [
        { key: "provider", label: "Provider", type: "select", default: "auto", options: [
          { value: "auto", label: "Auto" },
          { value: "openai-codex", label: "OpenAI Codex" },
        ], hint: "Usually auto." },
        { key: "graceSec", label: "Grace seconds", type: "number", hint: "Seconds to wait after SIGTERM before killing the Hermes process." },
      ],
    }),
  }));
  const props: AdapterConfigFieldsProps = {
    mode: "edit", isCreate: false, adapterType, section: undefined,
    values: defaultCreateValues, set: vi.fn(),
    config: { provider: "auto", graceSec: 20 }, eff: (_group, _field, original) => original, mark: vi.fn(), models: [],
  };
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(<TooltipProvider><SchemaConfigFields {...props} /></TooltipProvider>));

  expect(container.textContent).toContain("模型提供商");
  expect(container.textContent).toContain("自动");
  const providerSelect = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("自动"));
  expect(providerSelect).toBeDefined();
  await act(async () => providerSelect?.click());
  expect(document.body.textContent).toContain("OpenAI Codex");
  expect(container.textContent).toContain("终止宽限时间（秒）");
  expect(container.textContent).not.toContain("Provider");
  expect(container.textContent).not.toContain("Grace seconds");
});
