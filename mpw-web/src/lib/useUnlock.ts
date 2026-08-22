import { useState, type SubmitEvent } from "react";

import { useMpwSession } from "./useMpwSession";
import { useLanguage } from "./useLanguage";

export function useUnlock() {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showMaster, setShowMaster] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const { mpw, unlock: unlockMpw, lock: lockMpw } = useMpwSession();

  async function unlock(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const name = fullName.trim();
    if (!name || !masterPassword) {
      setUnlockError(t("unlock.required"));
      return;
    }
    setIsUnlocking(true);
    setUnlockError("");
    try {
      await unlockMpw(name, masterPassword);
      setFullName(name);
      setMasterPassword("");
      setShowMaster(false);
    } catch (cause) {
      setUnlockError(
        cause instanceof Error
          ? t("unlock.failedWithReason", { reason: cause.message })
          : t("unlock.failed"),
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  function reset(): void {
    lockMpw();
    setFullName("");
    setMasterPassword("");
    setShowMaster(false);
    setUnlockError("");
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
