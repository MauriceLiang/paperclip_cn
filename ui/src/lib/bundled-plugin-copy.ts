/** Localized labels for the plugin packages shipped by Paperclip. */
const BUNDLED_PLUGIN_COPY_KEYS: Record<string, string> = {
  "@paperclipai/plugin-cloudflare-sandbox": "cloudflareSandbox",
  "@paperclipai/plugin-createos": "createos",
  "@paperclipai/plugin-daytona": "daytona",
  "@paperclipai/plugin-e2b": "e2b",
  "@paperclipai/plugin-exe-dev": "exeDev",
  "@paperclipai/plugin-fake-sandbox": "fakeSandbox",
  "@paperclipai/plugin-kubernetes": "kubernetes",
  "@paperclipai/plugin-llm-wiki": "llmWiki",
  "@paperclipai/plugin-modal": "modal",
  "@paperclipai/plugin-novita-sandbox": "novitaSandbox",
  "@paperclipai/plugin-workspace-diff": "workspaceChanges",
  "@paperclipai/plugin-file-browser-example": "fileBrowserExample",
  "@paperclipai/plugin-hello-world-example": "helloWorldExample",
  "@paperclipai/plugin-kitchen-sink-example": "kitchenSinkExample",
  "@paperclipai/plugin-authoring-smoke-example": "pluginAuthoringSmokeExample",
  "@paperclipai/plugin-orchestration-smoke-example": "pluginOrchestrationSmokeExample",
};

export interface BundledPluginCopy {
  displayName: string;
  description: string;
}

/** Returns curated UI copy only for plugins shipped with Paperclip. */
export function bundledPluginCopyFor(
  packageName: string,
  translate: (key: string) => string,
): BundledPluginCopy | null {
  const key = BUNDLED_PLUGIN_COPY_KEYS[packageName];
  if (!key) return null;

  const baseKey = `skillsPage.pluginManager.catalog.${key}`;
  return {
    displayName: translate(`${baseKey}.name`),
    description: translate(`${baseKey}.description`),
  };
}

export const BUNDLED_PLUGIN_PACKAGE_NAMES = Object.keys(BUNDLED_PLUGIN_COPY_KEYS);
