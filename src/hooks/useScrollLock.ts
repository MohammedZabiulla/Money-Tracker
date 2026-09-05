import { useEffect } from 'react';

// Maintains a global count of active locks
let lockCount = 0;

export function useScrollLock(lock: boolean = true) {
  useEffect(() => {
    if (!lock) return;

    lockCount++;
    if (lockCount === 1) {
      document.body.classList.add('overflow-hidden');
    }

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.classList.remove('overflow-hidden');
      }
    };
  }, [lock]);
}
