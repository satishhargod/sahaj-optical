"use client";

import { useEffect, useState } from "react";
import styles from "./products.module.scss";
import Image from "next/image";
import ProductForm from "./ProductForm";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
   const [openForm, setOpenForm] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  // ======================================================
  // FETCH PRODUCTS
  // ======================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        limit,
        search,
        category_id: categoryId,
        brand_id: brandId,
      });

      const res = await fetch(`/api/products?${params}`);

      const data = await res.json();

      if (data.success) {
        setProducts(data.data || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // FETCH CATEGORIES
  // ======================================================

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();

      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ======================================================
  // FETCH BRANDS
  // ======================================================

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();

      if (data.success) {
        setBrands(data.data || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ======================================================
  // DELETE PRODUCT
  // ======================================================

  const deleteProduct = async (id) => {
    const confirmDelete = confirm("Are you sure you want to delete this product?");

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        fetchProducts();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ======================================================
  // EFFECT
  // ======================================================

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryId, brandId]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts();
  }, []);

  return (
    <div className={styles.container}>
      {/* HEADER */}

       {/* Header */}
      <div className={styles.header}>
         <Link href="/admin" className={styles.back}>←</Link>
        <div>
          <h1>Products</h1>
          <p>Manage optical shop products</p>
        </div>

        <button
          className={styles.addBtn}
          onClick={() => {
            setEditData(null);      
            setOpenForm(true) 
          }}
        >
          + Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {openForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <ProductForm
              editData={editData}
              onSuccess={() => {
                setOpenForm(false);
              }}
              onCancel={() => {
                setOpenForm(false);
              }}
              title={"Add Product"}
            />
          </div>
        </div>
      )}

      {/* FILTERS */}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search product or SKU"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <select
          value={categoryId}
          onChange={(e) => {
            setPage(1);
            setCategoryId(e.target.value);
          }}
        >
          <option value="">All Categories</option>

          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          value={brandId}
          onChange={(e) => {
            setPage(1);
            setBrandId(e.target.value);
          }}
        >
          <option value="">All Brands</option>

          {brands.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}

      <div className={styles.grid}>
  {products.map((product) => (
    <div key={product.id} className={styles.card}>
      <div className={styles.cardImg}>
        {product.image ? (
          <Image src={product.image} alt={product.name} width={200} height={140} />
        ) : (
          <div className={styles.noImg}>No Image</div>
        )}
      </div>

      <div className={styles.cardTop}>
        <span className={styles.cardName}>{product.name}</span>
        <span className={`${styles.badge} ${product.is_active ? styles.active : styles.inactive}`}>
          {product.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className={styles.meta}>
        {product.category_name && <span className={styles.tag}>{product.category_name}</span>}
        {product.brand_name && <span className={styles.tag}>{product.brand_name}</span>}
      </div>

      {product.sku && <span className={styles.sku}>SKU: {product.sku}</span>}

      <div className={styles.divider} />

      <div className={styles.prices}>
        <span className={styles.selling}>₹{product.selling_price}</span>
        <span className={styles.purchase}>₹{product.purchase_price}</span>
      </div>

      <span className={styles.stock}>{product.stock_qty} in stock</span>

      <div className={styles.cardActions}>
        <button className={styles.editBtn} onClick={() => { setEditData(product); setOpenForm(true); }}>Edit</button>
        <button className={styles.deleteBtn} onClick={() => deleteProduct(product.id)}>Delete</button>
      </div>
    </div>
  ))}
</div>

      {/* PAGINATION */}

      <div className={styles.pagination}>
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Prev
        </button>

        <span>
          Page {page} of {pagination.totalPages}
        </span>

        <button
          disabled={page === pagination.totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

