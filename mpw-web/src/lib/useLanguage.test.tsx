import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  useLanguage,
} from "./useLanguage";

function wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe("useLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("navigator", {
      language: "zh-CN",
      languages: ["zh-CN"],
    });
  });

  it("detects English from the browser and falls back to Chinese", () => {
    vi.stubGlobal("navigator", {
      language: "en-US",
      languages: ["en-US"],
    });
    const english = renderHook(() => useLanguage(), { wrapper });
    expect(english.result.current.language).toBe("en");
    expect(english.result.current.t("unlock.title")).toBe("Unlock offline key");

    english.unmount();
    vi.stubGlobal("navigator", {
      language: "fr-FR",
      languages: ["fr-FR"],
    });
    const fallback = renderHook(() => useLanguage(), { wrapper });
    expect(fallback.result.current.language).toBe("zh-CN");
  });

  it("persists language changes and interpolates values", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => result.current.toggleLanguage());

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(result.current.t("transfer.merged", { count: 3 })).toBe(
      "Merged 3 history entries",
    );
  });
});
