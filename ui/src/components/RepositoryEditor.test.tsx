// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setLocale } from "@/i18n";
import { RepositoryEditor } from "./RepositoryEditor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("RepositoryEditor localization", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await setLocale("zh-CN");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    await setLocale("en");
  });

  it("renders Chinese repository labels and accessible actions", async () => {
    await act(async () => {
      root.render(
        <RepositoryEditor
          selected={[{
            id: "repo-1",
            fullName: "paperclipai/paperclip",
            url: "https://github.com/paperclipai/paperclip",
            private: true,
            connections: ["Paperclip GitHub"],
          }]}
          onChange={() => {}}
          state="disconnected"
          onConnect={() => {}}
          onRetry={() => {}}
        />,
      );
    });

    expect(container.textContent).toContain("源代码仓库");
    expect(container.querySelector('[aria-label="私有仓库"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="移除 paperclipai/paperclip"]')).not.toBeNull();

    const addAnother = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("再添加一个仓库"));
    expect(addAnother).toBeDefined();
    await act(async () => {
      addAnother?.click();
      await Promise.resolve();
    });
    expect(document.body.textContent).toContain("连接 GitHub 以选择仓库");
  });
});
