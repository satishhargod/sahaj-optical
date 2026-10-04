'use client';

import Link from 'next/link';
import styles from './report.module.scss';
import { useState, useEffect } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';

export default function Reports() {

  /* ================= FETCH PRODUCTS ================= */

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setProducts(data?.data?.reverse() || []);
      setApiLoading(false)
    } catch (err) {
      console.error('Fetch failed', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setProducts(data?.data?.reverse() || []);
      setApiLoading(false)
    } catch (err) {
      console.error('Fetch failed', err);
    }
  };



  return (
    <div className={styles.container}>
        Reports page
    </div>
  );
}
