/** Redacted presentation contracts shared with the production API. */
import type { AiProvider, AiAuthMethod, AiManagedConnectionSummary, AiConnectionBinding } from "@paperclipai/shared";
import type { TFunction } from "i18next";
export type { AiProvider, AiAuthMethod, AiConnectionBinding } from "@paperclipai/shared";
export type AiConnectionStatus = AiManagedConnectionSummary["status"];

export const AI_PROVIDERS: Record<
  AiProvider,
  { name: string; subscriptionName?: string; logo?: string }
> = {
  google: { name: "Google", logo: "/brands/apps/google.svg" },
  anthropic: {
    name: "Claude",
    subscriptionName: "Claude subscription",
    logo: "/brands/claude-color.svg",
  },
  openai: {
    name: "OpenAI",
    subscriptionName: "ChatGPT subscription",
    logo: "/brands/codex-color.svg",
  },
  openrouter: { name: "OpenRouter", logo: "/brands/apps/openrouter.svg" },
  xai: {
    name: "Grok",
    subscriptionName: "Grok subscription",
    logo: "/brands/adapters/grok.svg",
  },
};

export type AiConnectionSummary = Omit<AiManagedConnectionSummary, "isDefault"> & { isDefault?: boolean };

export interface AiConnectionRequirement {
  companyId: string;
  provider: AiProvider;
  method?: AiAuthMethod;
}

export const AI_CONNECTION_STATUS: Record<AiConnectionStatus, string> = {
  connected: "Connected",
  needs_attention: "Needs attention",
  expired: "Expired",
  revoked: "Revoked",
};

export function defaultAiConnectionName(ownerName: string | undefined, provider: AiProvider, method: AiAuthMethod, t?: TFunction) {
  const owner = ownerName?.trim();
  if (t) {
    const providerNameKey: Record<AiProvider, string> = {
      anthropic: "agentSetupPage.aiConnections.connectionField.providerDisplayNames.anthropic",
      openai: "agentSetupPage.aiConnections.connectionField.providerDisplayNames.openai",
      google: "agentSetupPage.aiConnections.connectionField.providerDisplayNames.google",
      xai: "agentSetupPage.aiConnections.connectionField.providerDisplayNames.xai",
      openrouter: "agentSetupPage.aiConnections.connectionField.providerDisplayNames.openrouter",
    };
    const ownerPrefix = owner && owner !== "You"
      ? t("agentSetupPage.aiConnections.model.defaultOwnerNamed", { owner })
      : t("agentSetupPage.aiConnections.model.defaultOwnerPersonal");
    const providerLabel = method === "subscription"
      ? aiMethodLabel(provider, method, t)
      : t("agentSetupPage.aiConnections.model.apiProviderName", { provider: t(providerNameKey[provider]) });
    return t("agentSetupPage.aiConnections.model.accountName", { owner: ownerPrefix, provider: providerLabel });
  }
  const prefix = owner && owner !== "You" ? `${owner}'s` : "My";
  const providerName = AI_PROVIDERS[provider].name;
  const legacyProviderName = method === "subscription"
    ? AI_PROVIDERS[provider].subscriptionName ?? providerName
    : `${providerName} API`;
  return `${prefix} ${legacyProviderName} account`;
}

export function aiMethodLabel(provider: AiProvider, method: AiAuthMethod, t?: TFunction) {
  if (method !== "subscription") return t ? t("agentSetupPage.aiConnections.model.apiKey") : "API key";
  const subscriptionLabels: Partial<Record<AiProvider, string>> = {
    anthropic: "agentSetupPage.aiConnections.model.subscriptionClaude",
    openai: "agentSetupPage.aiConnections.model.subscriptionChatgpt",
    xai: "agentSetupPage.aiConnections.model.subscriptionGrok",
  };
  const labelKey = subscriptionLabels[provider];
  return t
    ? labelKey ? t(labelKey) : t("agentSetupPage.aiConnections.model.subscriptionUnavailable")
    : AI_PROVIDERS[provider].subscriptionName ?? "Subscription unavailable";
}

export function matchesAiRequirement(
  connection: AiConnectionSummary,
  requirement: AiConnectionRequirement,
) {
  return (
    connection.companyId === requirement.companyId &&
    connection.provider === requirement.provider &&
    (requirement.method === undefined || connection.method === requirement.method)
  );
}

export function personalAiDefault(
  connections: AiConnectionSummary[],
  requirement: AiConnectionRequirement,
  userId: string,
) {
  // Never choose another account because the declared default is unhealthy.
  return connections.find(
    (connection) =>
      matchesAiRequirement(connection, { ...requirement, method: undefined }) &&
      connection.ownership === "personal" &&
      connection.ownerUserId === userId &&
      connection.isDefault,
  );
}

export function aiConnectionProblem(connection?: AiConnectionSummary, t?: TFunction) {
  if (!connection)
    return t
      ? t("agentSetupPage.aiConnections.model.noConnection")
      : "No connection selected. Connect an account to continue.";
  return (
    connection.unavailableReason ??
    (connection.status === "connected"
      ? null
      : t
        ? t("agentSetupPage.aiConnections.model.statusReconnect", {
            status: t(`agentSetupPage.aiConnections.model.status.${connection.status}`),
          })
        : `${AI_CONNECTION_STATUS[connection.status]}. Reconnect this account to continue.`)
  );
}

export function bindingProblem(
  binding: AiConnectionBinding,
  requirement: AiConnectionRequirement,
  connections: AiConnectionSummary[],
  userId: string,
  _agentId: string,
  t?: TFunction,
) {
  if (
    binding.provider !== requirement.provider ||
    (binding.mode !== "responsible_user" && requirement.method !== undefined && binding.method !== requirement.method)
  )
    return t
      ? t("agentSetupPage.aiConnections.model.notCompatible")
      : "Choose a connection compatible with this provider and sign-in method.";
  if (binding.mode === "responsible_user")
    return aiConnectionProblem(
      personalAiDefault(connections, requirement, userId),
      t,
    );
  const connection = connections.find(
    (item) =>
      item.id === binding.connectionId &&
      item.grantId === binding.grantId &&
      item.method === binding.method &&
      matchesAiRequirement(item, requirement),
  );
  if (!connection)
    return t
      ? t("agentSetupPage.aiConnections.model.noLongerAvailable")
      : "This connection is no longer available for this agent. Choose another connection.";
  if (binding.mode === "shared" && connection.ownership !== "shared")
    return t
      ? t("agentSetupPage.aiConnections.model.chooseCompanyShared")
      : "Choose a company-shared connection.";
  if (
    binding.mode === "delegated" &&
    (connection.ownership !== "personal" ||
      connection.ownerUserId !== userId)
  )
    return t
      ? t("agentSetupPage.aiConnections.model.notShared")
      : "This credential is not shared with you. Choose a connection you can use.";
  return aiConnectionProblem(connection, t);
}
