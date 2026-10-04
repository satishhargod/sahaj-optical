'use client';
import Head from "next/head";
import { useEffect, useRef, useState } from 'react';
import CryptoJS from 'crypto-js';
import styles from './indexadmin.module.scss';

import Link from "next/link";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [errorPassword, setErrorPassword] = useState('');
  const [showPopup, setShowPopup] = useState(true);
  const [activeMenu, setActiveMenu] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // 🔥 mobile toggle
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputsRef = useRef([]);

  const SECRET_KEY = 'mySecretKey';
  const VALID_PASSWORD = '181719';

  useEffect(() => {
    const encryptedCode = sessionStorage.getItem('admin_code');
    if (encryptedCode) {
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedCode, SECRET_KEY);
      const decryptedCode = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (decryptedCode === VALID_PASSWORD) {
        setIsAuthenticated(true);
        setShowPopup(false);
      }
    }
    // sessionStorage.removeItem('admin_code')
  }, []);

  useEffect(() => {
    const encryptedCode = sessionStorage.getItem('admin_code');

    if (encryptedCode) {
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedCode, SECRET_KEY);
      const decryptedCode = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (decryptedCode === VALID_PASSWORD) {
        setIsAuthenticated(true);
        setShowPopup(false);
      }
    }

    // ⏱ inactivity timeout (2 minutes)
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);

      inactivityTimer = setTimeout(() => {
        sessionStorage.removeItem('admin_code');
        setIsAuthenticated(false);
        setShowPopup(true);
        console.log('Admin session expired due to inactivity');
      }, 2 * 60 * 1000); // 2 minutes
    };

    // 👂 listen to user activity
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

    events.forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    // start timer immediately
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, []);


  const handleSubmit = (otpValue) => {

    if (otpValue === VALID_PASSWORD) {
      const encryptedCode = CryptoJS.AES.encrypt(
        otpValue,
        SECRET_KEY
      ).toString();

      sessionStorage.setItem("admin_code", encryptedCode);
      setIsAuthenticated(true);
      setShowPopup(false);
    } else {
      setErrorPassword("Invalid Code!");
    }
  };

  const handleChange = (e, index) => {
    setErrorPassword("")
    const value = e.target.value.replace(/\D/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value[0];
    setOtp(newOtp);

    if (index < newOtp.length - 1) {
      inputsRef.current[index + 1].focus();
    }

    // ✅ auto submit when all filled
    if (newOtp.every(digit => digit !== "")) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);

      if (index > 0) {
        inputsRef.current[index - 1].focus();
      }
    }

    if (e.key === "Enter" && otp.every(d => d !== "")) {
      handleSubmit(otp.join(""));
    }
  };
  const handleLogout = () => {
    sessionStorage.removeItem('admin_code');
    window.location.href = '/admin'
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent automatic mini-infobar
      setDeferredPrompt(e); // Save the event for later
      setShowInstallPopup(true); // Show our custom install popup
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted install');
      } else {
        console.log('User dismissed install');
      }
      setDeferredPrompt(null);
      setShowInstallPopup(false);
    }
  };

  if (!isAuthenticated && showPopup) {
    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popupContent}>
          <h2>Enter Admin Code</h2>

          <div className={styles.otpWrapper}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className={styles.otpInput}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* <button
          className={styles.submitButton}
          onClick={() => handleSubmit(otp.join(""))}
        >
          Submit
        </button> */}
          {errorPassword && <span className={styles.error}>{errorPassword}</span>}
        </div>
      </div>
    );
  }

  return (
    <>

      {/* MOBILE HEADER */}
      {/* <div className={styles.mobileHeader}>
        <button
          className={styles.menuBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <span>Admin Panel</span>
      </div> */}

      {/* SIDEBAR */}

      <div className={styles.wrapper}>
        <div className={styles.content}>
          {/* HEADER */}
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1>Admin Dashboard</h1>
              <p>Manage your store from one place</p>
            </div>

            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* DASHBOARD CARDS */}
          <div className={styles.adminMainSec}>
            <div className={styles.adminDashboard}>
              <Link href="/admin/products" className={`${styles.adminCard} ${styles.products}`}>
                <div className={styles.icon}>📦</div>
                <h3 className={styles.title}>Products</h3>
                <p className={styles.desc}>Manage all products</p>
              </Link>

              <Link href="/admin/orders" className={`${styles.adminCard} ${styles.orders}`}>
                <div className={styles.icon}>🧾</div>
                <h3 className={styles.title}>Orders</h3>
                <p className={styles.desc}>View customer orders</p>
              </Link>

              <Link href="/admin/categories" className={`${styles.adminCard} ${styles.categories}`}>
                <div className={styles.icon}>🏷️</div>
                <h3 className={styles.title}>Categories</h3>
                <p className={styles.desc}>Manage categories</p>
              </Link>

              <Link href="/admin/brands" className={`${styles.adminCard} ${styles.brands}`}>
                <div className={styles.icon}>🕶️</div>
                <h3 className={styles.title}>Brands</h3>
                <p className={styles.desc}>Manage brands stock</p>
              </Link>

              <Link href="/admin/customers" className={`${styles.adminCard} ${styles.customers}`}>
                <div className={styles.icon}>👥</div>
                <h3 className={styles.title}>Customers</h3>
                <p className={styles.desc}>Customer details</p>
              </Link>

              {/* <Link href="/admin/reports" className={`${styles.adminCard} ${styles.reports}`}>
          <div className={styles.icon}>📊</div>
          <h3 className={styles.title}>Reports</h3>
          <p className={styles.desc}>Sales & analytics</p>
        </Link> */}

              <Link href="/admin/dataimport" className={`${styles.adminCard} ${styles.importdata}`}>
                <div className={styles.icon}>📊</div>
                <h3 className={styles.title}>Import Data</h3>
                <p className={styles.desc}>Data & analytics</p>
              </Link>
            </div>
          </div>
        </div>
      </div>


      {showInstallPopup && (
        <div className={styles.installPromptOverlay}>
          <div className={styles.installPromptBox}>
            <p>Install Admin App on your device?</p>
            <div className={styles.buttonGroup}>
              <button className={styles.cancelBtn} onClick={() => setShowInstallPopup(false)}>Cancel</button>
              <button className={styles.installBtn} onClick={handleInstallClick}>Install</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}