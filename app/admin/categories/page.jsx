"use client";

import { useEffect, useState } from "react";
import styles from "./categories.module.scss";
import Link from "next/link";
import { FaPlus, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        id: null,
        name: "",
        image: "",
        is_active: 1,
    });

    async function fetchCategories() {
        try {
            setLoading(true);

            const res = await fetch(
                `/api/categories?search=${search}`
            );

            const data = await res.json();

            setCategories(data.data || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCategories();
    }, [search]);

    function resetForm() {
        setForm({
            id: null,
            name: "",
            image: "",
            is_active: 1,
        });
    }

    async function saveCategory() {
        try {
            const method = form.id ? "PUT" : "POST";

            const url = form.id
                ? `/api/categories/${form.id}`
                : `/api/categories`;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            toast.success(data.message)

            // alert(data.message);

            if (data.success) {
                setShowModal(false);
                resetForm();
                fetchCategories();
            }
        } catch (error) {
            console.log(error);
        }
    }

    function editItem(item) {
        setForm(item);
        setShowModal(true);
    }

    async function deleteItem(id) {
        if (!confirm("Delete category?")) return;

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: "DELETE",
            });

            const data = await res.json();
            toast.success(data.message)
            // alert(data.message);

            if (data.success) {
                fetchCategories();
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
      <h1 className={styles.title}>Categories</h1>
      <p className={styles.subtitle}>
        {categories.length} total records
      </p>
    </div>
  </div>

  <div className={styles.headerRight}>
    <div className={styles.searchBox}>
      <FaSearch className={styles.searchIcon} />

      <input
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
      Add Category
    </button>
  </div>
</header>

            {loading ? (
                <div className={styles.empty}>Loading...</div>
            ) : categories.length === 0 ? (
                <div className={styles.empty}>
                    No categories found
                </div>
            ) : (
                <div className={styles.list}>
                    {categories.map((item) => (
                        <div key={item.id} className={styles.card}>
                            <div className={styles.cardTop}>
                                <span>#{item.id}</span>

                                <div className={styles.topActions}>
                                    <button
                                        onClick={() => editItem(item)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => deleteItem(item.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.imageWrap}>
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                        />
                                    ) : (
                                        <div className={styles.noImage}>
                                            No Image
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
                                    ? "Edit Category"
                                    : "Add Category"}
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
                                <label>Name</label>

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
                                <label>Image URL</label>

                                <input
                                    value={form.image}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            image: e.target.value,
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
                                onClick={saveCategory}
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