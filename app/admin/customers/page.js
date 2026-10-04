'use client';

import Link from 'next/link';
import styles from './customers.module.scss';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaEdit, FaPlus, FaTrash, FaSearch, FaAngleDoubleLeft, FaAngleDoubleRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    mobile: '',
    address: '',
  });

  const searchTimer = useRef(null);

  /* ================= FETCH ================= */
  const fetchCustomers = useCallback(
    async (pg = 1, currentLimit = limit, currentSearch = search) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: pg.toString(),
          limit: currentLimit.toString(),
          ...(currentSearch ? { search: currentSearch.trim() } : {}),
        });

        const res = await fetch(`/api/customers?${queryParams.toString()}`);
        const data = await res.json();

        if (data.success) {
          setCustomers(data.data || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || Math.ceil((data.total || 0) / currentLimit) || 1);
        }
      } catch (err) {
        console.error('Fetch failed', err);
      } finally {
        setLoading(false);
      }
    },
    [limit, search]
  );

  // Fetch when page or limit changes
  useEffect(() => {
    fetchCustomers(page, limit, search);
  }, [page, limit]);

  // Search with debounce
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchCustomers(1, limit, val);
    }, 350);
  };

  // Limit change
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Safe page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || loading) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ================= MODAL ================= */
  const openAddModal = () => {
    setForm({ id: '', name: '', mobile: '', address: '' });
    setEditCustomer(null);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setForm(customer);
    setEditCustomer(customer);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SAVE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = Boolean(editCustomer);
      const payload = {
        ...form,
        updatedAt: new Date().toISOString(),
        createdAt: isEdit ? form.createdAt : new Date().toISOString(),
      };

      const url = isEdit ? `/api/customers/${form.id}` : '/api/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      setShowModal(false);
      fetchCustomers(page, limit, search);
    } catch {
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error();
      fetchCustomers(page, limit, search);
    } catch {
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin" className={styles.backbutton}>
            ←
          </Link>
          <div>
            <h1>Customers</h1>
            <p className={styles.subtitle}>{total} total records</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by name, mobile, address..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <select
            className={styles.pageSizeSelect}
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            title="Records per page"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={30}>30 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <button className={styles.addBtn} onClick={openAddModal}>
            <FaPlus /> Add Customer
          </button>
        </div>
      </div>

      {/* ===== CUSTOMER CARDS GRID ===== */}
      <div className={styles.cardGrid}>
        {loading && customers.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.spinner} style={{ margin: '0 auto 12px' }} />
            <p>Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className={styles.empty}>
            <span>👥</span>
            <p>No customers found</p>
          </div>
        ) : (
          customers.map((c, i) => (
            <div key={c.id || i} className={styles.custCard}>
              <span className={styles.serial}>#{c.id}</span>
              <div className={styles.avatar}>
                {(c.name || 'C')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <p className={styles.custName}>{c.name || 'Unnamed'}</p>
              <p className={styles.custMobile}>{c.mobile || '--'}</p>
              <p className={styles.custAddress}>{c.address || 'No address provided'}</p>
              <div className={styles.custMeta}>
                {c.createdAt && (
                  <span className={styles.badge}>
                    Added: {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
              <div className={styles.actionBtns}>
                <button onClick={() => openEditModal(c)} className={styles.editBtn}>
                  <FaEdit /> Edit
                </button>
                <button onClick={() => handleDelete(c.id)} className={styles.deleteBtn}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== PAGINATION CONTROLS ===== */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={page === 1 || loading}
            onClick={() => handlePageChange(1)}
            title="First Page"
          >
            « First
          </button>

          <button
            disabled={page === 1 || loading}
            onClick={() => handlePageChange(page - 1)}
            title="Previous Page"
          >
            ‹ Prev
          </button>

          <div className={styles.pages}>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p =
                totalPages <= 7
                  ? i + 1
                  : page <= 4
                  ? i + 1
                  : page >= totalPages - 3
                  ? totalPages - 6 + i
                  : page - 3 + i;
              return (
                <button
                  key={p}
                  className={page === p ? styles.activePage : ''}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            disabled={page === totalPages || loading}
            onClick={() => handlePageChange(page + 1)}
            title="Next Page"
          >
            Next ›
          </button>

          <button
            disabled={page === totalPages || loading}
            onClick={() => handlePageChange(totalPages)}
            title="Last Page"
          >
            Last »
          </button>

          <span className={styles.pageInfo}>
            Showing {startRecord}–{endRecord} of {total} records (Page {page} of {totalPages})
          </span>
        </div>
      )}

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editCustomer ? 'Edit Customer' : 'Add Customer'}</h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Full name" />
              </div>

              <div className={styles.field}>
                <label>Mobile Number</label>
                <input name="mobile" value={form.mobile} onChange={handleChange} required placeholder="10-digit mobile" />
              </div>

              <div className={styles.field}>
                <label>Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} placeholder="Full address" />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={loading}>
                  {loading ? 'Saving...' : editCustomer ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
