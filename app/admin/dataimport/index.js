'use client';

import { useEffect, useState } from 'react';
import styles from './dataimport.module.scss';
import Link from 'next/link';

export default function DataImport() {
  const [data, setData] = useState([]);
  const [type, setType] = useState('orders'); // orders | customers
  const [loading, setLoading] = useState(false);

  /* ================= FETCH DATA ================= */

  const fetchData = async (selectedType) => {
    setLoading(true);
    try {
      const url =
        selectedType === 'orders'
          ? '/api/orders'
          : '/api/customers';

      const res = await fetch(url);
      const result = await res.json();
      setData(result?.data || []);
    } catch (err) {
      console.error('Fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(type);
  }, [type]);

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!data.length) return;

    let csvRows = [];

    if (type === 'customers') {
      const headers = ['Name', 'Mobile', 'Address', 'Created At'];
      csvRows.push(headers.join(','));

      data.forEach((c) => {
        csvRows.push(
          [
            c.name,
            c.mobile,
            c.address,
            c.createdAt,
          ].join(',')
        );
      });
    }

    if (type === 'orders') {
      const headers = [
        'Order ID',
        'Name',
        'Mobile',
        'Total',
        'Total Paid',
        'Remaining',
        'Status',
        'Created At',
      ];
      csvRows.push(headers.join(','));

      data.forEach((o) => {
        csvRows.push(
          [
            o.id,
            o.name,
            o.mobile,
            o.total,
            o.totalPaid,
            o.remaining,
            o.status,
            o.createdAt,
          ].join(',')
        );
      });
    }

    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv',
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadCSV = (jsonData, fileName = 'data.csv') => {
  if (!jsonData || !jsonData.length) return;

  // 🔹 Collect all unique keys (even nested)
  const getAllKeys = (obj, parent = '') =>
    Object.keys(obj).flatMap((key) => {
      const fullKey = parent ? `${parent}.${key}` : key;
      return typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
        ? getAllKeys(obj[key], fullKey)
        : fullKey;
    });

  const headers = Array.from(
    new Set(jsonData.flatMap((item) => getAllKeys(item)))
  );

  const csvRows = [];
  csvRows.push(headers.join(','));

  jsonData.forEach((row) => {
    const values = headers.map((header) => {
      const keys = header.split('.');
      let value = row;

      keys.forEach((k) => {
        value = value?.[k];
      });

      if (Array.isArray(value)) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }

      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }

      return `"${value ?? ''}"`;
    });

    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

  return (
    <div className={styles.container}>

      <Link href="/admin" className={`${styles.backbutton}`}><img src="../icon/back.png" /></Link>

      {/* <h2>Import CSV</h2>

      <div className={styles.actions}>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="orders">Orders</option>
          <option value="customers">Customers</option>
        </select>

        <button onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && <p>Total Records: {data.length}</p>} */}


      <div className={styles.container}>
  <h2>Export Full Data CSV</h2>

  <div className={styles.actions}>
    <select value={type} onChange={(e) => setType(e.target.value)}>
      <option value="orders">Orders</option>
      <option value="customers">Customers</option>
    </select>

    <button
      onClick={() =>
        downloadCSV(data, `${type}-full-data.csv`)
      }
    >
      Download CSV
    </button>
  </div>

  {!loading && <p>Total Records: {data.length}</p>}
</div>
    </div>
  );
}
