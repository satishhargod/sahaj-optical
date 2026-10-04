'use client';

import { useState, useEffect } from 'react';
import styles from './InstallApp.module.scss';
import { FaDownload, FaTimes, FaShareAlt } from 'react-icons/fa';

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS device (iPhone / iPad / iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIosDevice && isSafari && !isStandalone) {
      setIsIOS(true);
      setIsInstallable(true);
    }

    // 3. Listen for the `beforeinstallprompt` event (Android, Chrome, Edge, PC)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Register Service Worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration note:', err?.message));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // If already installed or not on client, don't show
  if (isInstalled || !isInstallable) return null;

  // If user closed banner, show a discreet floating install button
  if (dismissed) {
    return (
      <button
        className={styles.floatingInstallBtn}
        onClick={() => setDismissed(false)}
        title="Install Sahaj Optical App"
      >
        <FaDownload size={13} />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <div className={styles.installContainer}>
      <div className={styles.banner}>
        <div className={styles.appInfo}>
          <img
            src="/favicon/android-chrome-192x192.png"
            alt="Sahaj Optical"
            className={styles.appIcon}
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
          <div className={styles.textWrap}>
            <h4>Sahaj Optical Admin</h4>
            <p>{isIOS ? 'Tap Share ⎋ → Add to Home Screen' : 'Install for fast 1-click access'}</p>
          </div>
        </div>

        <div className={styles.actions}>
          {isIOS ? (
            <div className={styles.iosGuide}>
              <FaShareAlt size={12} />
              <span>Share ➔ Add to Home</span>
            </div>
          ) : (
            <button className={styles.installBtn} onClick={handleInstallClick}>
              <FaDownload size={12} />
              <span>Install</span>
            </button>
          )}

          <button
            className={styles.closeBtn}
            onClick={() => setDismissed(true)}
            aria-label="Close"
            title="Dismiss"
          >
            <FaTimes size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
