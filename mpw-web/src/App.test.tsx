import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, deriveHistoryTransferKey, generateAuthentication, invalidate } =
  vi.hoisted(() => ({
    create: vi.fn(),
    deriveHistoryTransferKey: vi.fn(),
    generateAuthentication: vi.fn(),
    invalidate: vi.fn(),
  }));
const { updateServiceWorker, setNeedRefresh } = vi.hoisted(() => ({
  updateServiceWorker: vi.fn(),
  setNeedRefresh: vi.fn(),
}));

vi.mock('@mpw/core/worker', () => ({ MPW: { create } }));
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [true, setNeedRefresh],
    updateServiceWorker,
  }),
}));

import App from './App';
import { STORAGE_KEY } from './lib/history';
import { encryptHistory } from './lib/historyTransfer';
import { THEME_STORAGE_KEY } from './lib/useTheme';

describe('App session workflow', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    render(<App />);
    create.mockReset().mockResolvedValue({
      deriveHistoryTransferKey,
      generateAuthentication,
      invalidate,
    });
    deriveHistoryTransferKey.mockReset().mockResolvedValue(new Uint8Array(32));
    generateAuthentication.mockReset().mockResolvedValue('ZedaFaxcZaso9*');
    invalidate.mockReset();
  });

  it('switches theme mode before and after unlocking', async () => {
    let themeButton = screen.getByRole('button', {
      name: '当前为跟随系统，切换为浅色模式',
    });
    fireEvent.click(themeButton);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    themeButton = screen.getByRole('button', {
      name: '当前为浅色模式，切换为深色模式',
    });
    fireEvent.click(themeButton);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    themeButton = screen.getByRole('button', {
      name: '当前为深色模式，切换为跟随系统',
    });
    fireEvent.click(themeButton);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');

    fireEvent.click(
      screen.getByRole('button', {
        name: '当前为跟随系统，切换为浅色模式',
      }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: '当前为浅色模式，切换为深色模式',
      }),
    );
    await unlock();
    expect(
      screen.getByRole('button', {
        name: '当前为深色模式，切换为跟随系统',
      }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  async function unlock() {
    fireEvent.change(screen.getByRole('textbox', { name: '完整姓名' }), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByPlaceholderText('不会被保存'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: '解锁' }));
    await screen.findByRole('textbox', { name: '网站或服务' });
  }

  it('shows build and source information before unlocking', () => {
    expect(
      screen.getByText(/Commit (?:[0-9a-f]{7}|unknown)/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '在 GitHub 查看源代码' }),
    ).toHaveAttribute('href', 'https://github.com/sshhsh/mpw-ts');
  });

  it('shows a prompt for available PWA updates', () => {
    expect(screen.getByRole('status')).toHaveTextContent('发现新版本');

    fireEvent.click(screen.getByRole('button', { name: '稍后' }));
    expect(setNeedRefresh).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole('button', { name: '立即更新' }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('unlocks locally and generates authentication passwords', async () => {
    await unlock();
    expect(create).toHaveBeenCalledWith('user', 'password');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(
      screen.getByText(/Commit (?:[0-9a-f]{7}|unknown)/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '在 GitHub 查看源代码' }),
    ).toHaveAttribute('href', 'https://github.com/sshhsh/mpw-ts');
    expect(
      screen.getByRole('button', { name: '迁移网站历史' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: '网站或服务' }), {
      target: { value: 'example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成密码' }));

    expect(await screen.findByText('ZedaFaxcZaso9*')).toBeInTheDocument();
    expect(generateAuthentication).toHaveBeenCalledWith('example.com', {
      counter: 1,
      template: 'long',
    });
    expect(screen.getByText(/长密码 · 计数器 1 · 刚刚/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '显示或隐藏结果' }));
    expect(screen.getByText('ZedaFaxcZaso9*')).not.toHaveClass('masked');
    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEY)).toContain('example.com'),
    );
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('user');
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('password');
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('ZedaFaxcZaso9*');
  });

  it('opens the encrypted QR history migration dialog', async () => {
    await unlock();
    fireEvent.click(screen.getByRole('button', { name: '迁移网站历史' }));

    expect(
      screen.getByRole('dialog', { name: '迁移网站历史' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/只能由相同姓名和主密码/)).toBeInTheDocument();
    expect(screen.getByText('导出迁移文本')).toBeInTheDocument();
    expect(screen.getByText('导入迁移文本')).toBeInTheDocument();
    expect(screen.getByText('使用摄像头扫描')).toBeInTheDocument();
    expect(screen.getByText('选择二维码图片')).toBeInTheDocument();
  });

  it('imports encrypted history from text', async () => {
    await unlock();
    const key = new Uint8Array(32);
    const transferText = await encryptHistory(
      [
        {
          id: 'imported',
          site: 'imported.example',
          counter: 2,
          template: 'long',
          lastUsedAt: Date.now(),
        },
      ],
      key,
    );
    deriveHistoryTransferKey.mockResolvedValue(key);

    fireEvent.click(screen.getByRole('button', { name: '迁移网站历史' }));
    fireEvent.click(screen.getByRole('button', { name: /导入迁移文本/ }));
    fireEvent.change(screen.getByRole('textbox', { name: '要导入的迁移文本' }), {
      target: { value: transferText },
    });
    fireEvent.click(screen.getByRole('button', { name: '导入并合并' }));

    expect(await screen.findByText('已合并 1 条历史')).toBeInTheDocument();
    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEY)).toContain('imported.example'),
    );
  });

  it('invalidates the key and returns to unlock when locked', async () => {
    await unlock();
    fireEvent.click(screen.getByRole('button', { name: '锁定会话' }));
    expect(invalidate).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('heading', { name: '解锁离线密钥' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '完整姓名' })).toHaveValue('');
  });

  it('does not focus the site input after unlocking or loading history on touch devices', async () => {
    await unlock();
    const siteInput = screen.getByRole('textbox', { name: '网站或服务' });
    expect(siteInput).not.toHaveFocus();

    fireEvent.change(siteInput, { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '生成密码' }));
    await screen.findByText('ZedaFaxcZaso9*');
    siteInput.blur();

    fireEvent.click(
      screen.getAllByRole('button', { name: /载入 example\.com/ })[0],
    );
    expect(siteInput).not.toHaveFocus();
  });

  it('keeps and displays multiple configurations for the same site', async () => {
    await unlock();
    const siteInput = screen.getByRole('textbox', { name: '网站或服务' });
    fireEvent.change(siteInput, { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '生成密码' }));
    await screen.findByText('ZedaFaxcZaso9*');

    fireEvent.click(screen.getByText(/高级选项/));
    fireEvent.click(screen.getByRole('button', { name: '增加计数器' }));
    fireEvent.click(screen.getByRole('button', { name: '生成密码' }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toHaveLength(2);
    });
    expect(
      screen.getAllByRole('button', {
        name: /载入 example\.com，长密码，计数器 1/,
      }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', {
        name: /载入 example\.com，长密码，计数器 2/,
      }),
    ).toHaveLength(2);

    fireEvent.click(
      screen.getAllByRole('button', {
        name: /载入 example\.com，长密码，计数器 1/,
      })[0],
    );
    expect(screen.getByRole('spinbutton', { name: '计数器' })).toHaveValue(1);
  });

  it('filters website history from the mobile search box', async () => {
    await unlock();
    const siteInput = screen.getByRole('textbox', { name: '网站或服务' });

    for (const site of ['alpha.example', 'beta.example']) {
      fireEvent.change(siteInput, { target: { value: site } });
      fireEvent.click(screen.getByRole('button', { name: '生成密码' }));
      await waitFor(() =>
        expect(localStorage.getItem(STORAGE_KEY)).toContain(site),
      );
    }

    const mobileSearch = screen.getByRole('textbox', {
      name: '搜索移动端网站历史',
    });
    const mobileHistory = mobileSearch.closest('section');
    expect(mobileHistory).not.toBeNull();

    fireEvent.change(mobileSearch, { target: { value: 'alpha' } });
    expect(
      within(mobileHistory!).getByRole('button', { name: /载入 alpha\.example/ }),
    ).toBeInTheDocument();
    expect(
      within(mobileHistory!).queryByRole('button', { name: /载入 beta\.example/ }),
    ).not.toBeInTheDocument();

    fireEvent.change(mobileSearch, { target: { value: 'missing' } });
    expect(within(mobileHistory!).getByText('没有匹配的网站')).toBeInTheDocument();
  });

  it('clears the site and resets all generation options together', async () => {
    await unlock();
    const siteInput = screen.getByRole('textbox', { name: '网站或服务' });
    fireEvent.change(siteInput, { target: { value: 'example.com' } });
    fireEvent.click(screen.getByText(/高级选项/));
    fireEvent.click(screen.getByRole('button', { name: '增加计数器' }));

    fireEvent.click(screen.getByRole('button', { name: '清空生成参数' }));
    expect(siteInput).toHaveValue('');
    expect(screen.getByRole('spinbutton', { name: '计数器' })).toHaveValue(1);
    expect(screen.getByRole('combobox', { name: '密码模板' })).toHaveValue(
      'long',
    );
  });
});
