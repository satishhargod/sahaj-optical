"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { FaPlus, FaSearch } from "react-icons/fa";

import styles from "./brands.module.scss";
import { toast } from "react-toastify";

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    name: "",
    logo: "",
    is_active: 1,
  });

  async function fetchBrands() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/brands?search=${search}`
      );

      const data = await res.json();

      setBrands(data.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBrands();
  }, [search]);

  function resetForm() {
    setForm({
      id: null,
      name: "",
      logo: "",
      is_active: 1,
    });
  }

  function editItem(item) {
    setForm(item);
    setShowModal(true);
  }

  async function saveBrand() {
    try {
      const method = form.id ? "PUT" : "POST";

      const url = form.id
        ? `/api/brands/${form.id}`
        : `/api/brands`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      toast.success(data.message)
    //   alert(data.message);

      if (data.success) {
        setShowModal(false);

        resetForm();

        fetchBrands();
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function deleteItem(id) {
    if (!confirm("Delete brand?")) return;

    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
        toast.success(data.message)
    //   alert(data.message);

      if (data.success) {
        fetchBrands();
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin" className={styles.back}>
            ←
          </Link>

          <div>
            <h1 className={styles.title}>Brands</h1>

            <p className={styles.subtitle}>
              {brands.length} total records
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />

            <input
              placeholder="Search brands..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <button
            className={styles.newBtn}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <FaPlus />
            Add Brand
          </button>
        </div>
      </header>

      {loading ? (
        <div className={styles.empty}>
          Loading...
        </div>
      ) : brands.length === 0 ? (
        <div className={styles.empty}>
          No brands found
        </div>
      ) : (
        <div className={styles.list}>
          {brands.map((item) => (
            <div
              key={item.id}
              className={styles.card}
            >
              <div className={styles.cardTop}>
                <span>#{item.id}</span>

                <div className={styles.cardActions}>
                  <button
                    onClick={() =>
                      editItem(item)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className={styles.deleteBtn}
                    onClick={() =>
                      deleteItem(item.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.logoWrap}>
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={item.name}
                    />
                  ) : (
                    <div className={styles.noLogo}>
                      No Logo
                    </div>
                  )}
                </div>

                <div className={styles.content}>
                  <h3>{item.name}</h3>

                  <span
                    className={
                      item.is_active
                        ? styles.active
                        : styles.inactive
                    }
                  >
                    {item.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>
                {form.id
                  ? "Edit Brand"
                  : "Add Brand"}
              </h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Brand Name</label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Logo URL</label>

                <input
                  value={form.logo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      logo: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label>Status</label>

                <select
                  value={form.is_active}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_active: Number(
                        e.target.value
                      ),
                    })
                  }
                >
                  <option value={1}>
                    Active
                  </option>

                  <option value={0}>
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() =>
                  setShowModal(false)
                }
              >
                Cancel
              </button>

              <button
                className={styles.saveBtn}
                onClick={saveBrand}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}