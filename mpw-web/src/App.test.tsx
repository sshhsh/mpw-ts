import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, deriveHistoryTransferKey, generateAuthentication, invalidate } =
  vi.hoisted(() => ({
    create: vi.fn(),
    deriveHistoryTransferKey: vi.fn(),
    generateAuthentication: vi.fn(),
    invalidate: vi.fn(),
  }));

vi.mock('@mpw/core/worker', () => ({ MPW: { create } }));

import App from './App';
import { STORAGE_KEY } from './lib/history';

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
    expect(screen.getByText('使用摄像头扫描')).toBeInTheDocument();
    expect(screen.getByText('选择二维码图片')).toBeInTheDocument();
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
