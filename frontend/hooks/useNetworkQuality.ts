'use client';

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  saveData: boolean;
  isSlowConnection: boolean;
}

export function useNetworkQuality(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    effectiveType: 'unknown',
    saveData: false,
    isSlowConnection: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const updateStatus = () => {
      if (!conn) return;

      const effectiveType = conn.effectiveType || 'unknown';
      const saveData = Boolean(conn.saveData);
      const isSlow = saveData || ['slow-2g', '2g', '3g'].includes(effectiveType);

      setNetworkStatus({
        effectiveType,
        saveData,
        isSlowConnection: isSlow,
      });
    };

    updateStatus();

    if (conn && conn.addEventListener) {
      conn.addEventListener('change', updateStatus);
      return () => conn.removeEventListener('change', updateStatus);
    }
  }, []);

  return networkStatus;
}
