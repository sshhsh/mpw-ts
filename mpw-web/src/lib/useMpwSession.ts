import { useEffect, useRef, useState } from 'react';

import { MPW } from '@mpw/core/worker';

import type { MpwInstance } from './mpwTypes';

export function useMpwSession() {
  const [mpw, setMpw] = useState<MpwInstance | null>(null);
  const mpwRef = useRef<MpwInstance | null>(null);
  const unlockAttemptRef = useRef(0);

  function invalidateSession(): void {
    mpwRef.current?.invalidate();
    mpwRef.current = null;
    setMpw(null);
  }

  useEffect(() => {
    const invalidate = () => {
      invalidateSession();
    };
    const handlePageHide = (event: PageTransitionEvent) => {
      if (!event.persisted) invalidate();
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      invalidate();
    };
  }, []);

  async function unlock(name: string, password: string): Promise<void> {
    const attempt = ++unlockAttemptRef.current;
    invalidateSession();
    const instance = await MPW.create(name, password);
    if (attempt !== unlockAttemptRef.current) {
      instance.invalidate();
      return;
    }
    mpwRef.current = instance;
    setMpw(instance);
  }

  function lock(): void {
    unlockAttemptRef.current += 1;
    invalidateSession();
  }

  return { mpw, unlock, lock };
}