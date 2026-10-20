// @vitest-environment jsdom
import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import type {Agent} from "@paperclipai/shared";
import {TooltipProvider} from "@/components/ui/tooltip";
import {setLocale} from "@/i18n";
import {PrimaryAgentIndicator, PrimaryAgentPresentationProvider, SetPrimaryAgentButton, type PrimaryAgentPresentation} from "./PrimaryAgentPresentation";

(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT: boolean}).IS_REACT_ACT_ENVIRONMENT = true;

describe("PrimaryAgentPresentation localization", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await setLocale("en");
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    await setLocale("en");
  });

  it("shows translated primary-agent names and controls", async () => {
    await setLocale("zh-CN");
    const agent = {id: "agent-1", companyId: "company-1", name: "Planner", status: "active"} as unknown as Agent;
    const selectable: PrimaryAgentPresentation = {
      companyId: "company-1",
      primaryAgentId: null,
      primaryAgent: null,
      onChange: () => undefined,
    };
    const selected: PrimaryAgentPresentation = {
      ...selectable,
      primaryAgentId: agent.id,
    };

    await act(async () => root.render(<TooltipProvider>
      <PrimaryAgentPresentationProvider value={selectable}>
        <SetPrimaryAgentButton agent={agent} />
      </PrimaryAgentPresentationProvider>
      <PrimaryAgentPresentationProvider value={selected}>
        <PrimaryAgentIndicator agentId={agent.id} companyId={agent.companyId} />
      </PrimaryAgentPresentationProvider>
    </TooltipProvider>));

    expect(container.textContent).toContain("设为我的主要 Agent");
    expect(container.querySelector('[aria-label="我的主要 Agent"]')).not.toBeNull();
  });
});
