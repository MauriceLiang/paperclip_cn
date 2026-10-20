import { Activity, LayoutGrid, KeyRound, Wrench, Boxes } from "lucide-react";
import { t as translate } from "@/i18n";

/**
 * Gateway detail tabs (PAP-11200). Terminology is locked by the approved
 * PAP-11178 design of record: Overview · Apps & tools · Tokens · Activity ·
 * Advanced. Raw protocol / JSON / transport details live under Advanced.
 */
export const GATEWAY_TABS = [
  { key: "overview", labelKey: "appsPage.gateways.tabs.overview", icon: LayoutGrid },
  { key: "apps", labelKey: "appsPage.gateways.tabs.apps", icon: Boxes },
  { key: "tokens", labelKey: "appsPage.gateways.tabs.tokens", icon: KeyRound },
  { key: "activity", labelKey: "appsPage.gateways.tabs.activity", icon: Activity },
  { key: "advanced", labelKey: "appsPage.gateways.tabs.advanced", icon: Wrench },
] as const;

export type GatewayTabKey = (typeof GATEWAY_TABS)[number]["key"];

export function gatewayTabHref(gatewayId: string, tab: GatewayTabKey): string {
  return `/apps/gateways/${gatewayId}/${tab}`;
}

export function isGatewayTabKey(value: string | undefined): value is GatewayTabKey {
  return GATEWAY_TABS.some((tab) => tab.key === value);
}

export function gatewayTabLabel(tabKey: GatewayTabKey): string {
  const tab = GATEWAY_TABS.find((candidate) => candidate.key === tabKey);
  return translate(tab?.labelKey ?? "appsPage.gateways.tabs.overview");
}
