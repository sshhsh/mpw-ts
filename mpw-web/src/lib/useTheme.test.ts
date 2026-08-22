import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_STORAGE_KEY, useTheme } from './useTheme';

function createMediaQueryList(matches: boolean) {
  let listener: ((event: MediaQueryListEvent) => void) | undefined;
  return {
    matches,
    addEventListener: vi.fn((_event: string, callback: typeof listener) => {
      listener = callback;
    }),
    removeEventListener: vi.fn(),
    change(nextMatches: boolean) {
      matches = nextMatches;
      listener?.({ matches: nextMatches } as MediaQueryListEvent);
    },
  };
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('follows the system theme by default', () => {
    const mediaQuery = createMediaQueryList(true);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery));

    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('system');
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('persists an explicit preference and ignores system changes', () => {
    const mediaQuery = createMediaQueryList(false);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery));
    const { result } = renderHook(() => useTheme());

    act(() => result.current.changePreference('dark'));
    act(() => mediaQuery.change(true));

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(result.current.theme).toBe('dark');
  });

  it('updates when following the system theme', () => {
    const mediaQuery = createMediaQueryList(false);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery));
    const { result } = renderHook(() => useTheme());

    act(() => mediaQuery.change(true));

    expect(result.current.preference).toBe('system');
    expect(result.current.theme).toBe('dark');
  });
});