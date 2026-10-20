import { beforeEach } from "vitest";

const storageEntries = new Map<string, string>();

function installStorageMock(target: Record<string, unknown>) {
  Object.defineProperty(target, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return storageEntries.size;
      },
      key: (index: number) => Array.from(storageEntries.keys())[index] ?? null,
      getItem: (key: string) => storageEntries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storageEntries.set(key, String(value));
      },
      removeItem: (key: string) => {
        storageEntries.delete(key);
      },
      clear: () => {
        storageEntries.clear();
      },
    },
  });
}

// Node 26 exposes an experimental localStorage that throws unless
// --localstorage-file is provided. Always install the deterministic mock so
// component tests and i18n initialization do not depend on the host runtime.
installStorageMock(globalThis as unknown as Record<string, unknown>);
if (typeof window !== "undefined") {
  installStorageMock(window as unknown as Record<string, unknown>);
}

// Initialize i18n after installing the storage mock, then keep the test UI in
// English without writing the locale preference into the shared storage mock.
const { i18n } = await import("./src/i18n");
beforeEach(async () => {
  storageEntries.clear();
  await i18n.changeLanguage("en");
});

// jsdom does not implement Element.prototype.scrollIntoView. Several surfaces
// (e.g. IssueChatThread's auto-scroll-to-latest) call it during normal render,
// so provide a no-op default. Tests that assert on scroll behaviour override
// this on the prototype themselves and restore it afterwards.
if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
