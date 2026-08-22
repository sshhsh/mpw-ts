import { useState, type SubmitEvent } from 'react';

import { useMpwSession } from './useMpwSession';

export function useUnlock() {
  const [fullName, setFullName] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showMaster, setShowMaster] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const { mpw, unlock: unlockMpw, lock: lockMpw } = useMpwSession();

  async function unlock(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const name = fullName.trim();
    if (!name || !masterPassword) {
      setUnlockError('请输入完整姓名和主密码。');
      return;
    }
    setIsUnlocking(true);
    setUnlockError('');
    try {
      await unlockMpw(name, masterPassword);
      setFullName(name);
      setMasterPassword('');
      setShowMaster(false);
    } catch (cause) {
      setUnlockError(
        cause instanceof Error ? `解锁失败：${cause.message}` : '解锁失败。',
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  function reset(): void {
    lockMpw();
    setFullName('');
    setMasterPassword('');
    setShowMaster(false);
    setUnlockError('');
  }

  return {
    mpw,
    fullName,
    masterPassword,
    showMaster,
    isUnlocking,
    unlockError,
    setFullName,
    setMasterPassword,
    toggleShowMaster: () => setShowMaster((value) => !value),
    unlock,
    reset,
  };
}