"use client";

import { useEffect, useState } from "react";
import styles from "./products.module.scss";
import { toast } from "react-toastify";

const defaultForm = {
    category_id: "",
    brand_id: "",
    name: "",
    sku: "",
    purchase_price: "",
    selling_price: "",
    stock_qty: "",
    is_active: 1,
    // Optical fields
    frame_type: "",
    frame_material: "",
    frame_shape: "",
    frame_color: "",
    lens_type: "",
};

const frameTypes = [
    "Full Rim",
    "Half Rim",
    "Rimless",
    "Wayfarer",
    "Round",
    "Square",
    "Rectangle",
    "Oval",
    "Cat Eye",
    "Aviator",
    "Clubmaster",
    "Geometric",
    "Oversized",
    "Wrap Around",
    "Sports",
    "Kids",
];

const frameMaterials = [
    "Metal",
    "Acetate",
    "Plastic",
    "Titanium",
    "TR90",
    "Stainless Steel",
    "Wood",
    "Carbon Fiber",
    "Nylon",
    "Mixed Material",
];

const frameShapes = [
    "Round",
    "Square",
    "Rectangle",
    "Oval",
    "Cat Eye",
    "Aviator",
    "Geometric",
    "Wayfarer",
    "Butterfly",
    "Wrap Around",
];

const frameColors = [
    "Black",
    "Brown",
    "Golden",
    "Silver",
    "Blue",
    "Red",
    "Green",
    "Pink",
    "Transparent",
    "Gunmetal",
    "Tortoise",
    "White",
];

const lensTypes = [
    "Single Vision",
    "Bifocal",
    "Progressive",
    "Blue Cut",
    "Photochromic",
    "Anti Glare",
    "Polarized",
    "Computer Lens",
    "Reading Lens",
    "Zero Power",
];

export default function ProductForm({
    editData = null,
    onSuccess = () => { },
    onCancel = () => { },
    title = '',
}) {
    const [form, setForm] = useState(defaultForm);

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState("");

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchBrands();
    }, []);

    useEffect(() => {
        if (editData) {
            setForm({
                category_id: editData.category_id || "",
                brand_id: editData.brand_id || "",
                name: editData.name || "",
                sku: editData.sku || "",
                purchase_price: editData.purchase_price || "",
                product_type:"",
                selling_price: editData.selling_price || "",
                stock_qty: editData.stock_qty || "",
                is_active: editData.is_active ?? 1,
                frame_type: editData.frame_type || "",
                frame_material: editData.frame_material || "",
                frame_shape: editData.frame_shape || "",
                frame_color: editData.frame_color || "",
                lens_type: editData.lens_type || "",
            });

            setPreview(editData.image || "");
        }
    }, [editData]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
            product_type:selectedCategory?.name?.toLowerCase()
        }));
    };

    const handleImage = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setImage(file);

        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const formData = new FormData();

            Object.keys(form).forEach((key) => {
                formData.append(key, form[key]);
            });

            if (image) {
                formData.append("image", image);
            }

            const url = editData
                ? `/api/products/${editData.id}`
                : "/api/products";

            const method = editData ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                body: formData,
            });

            const data = await res.json();

            if (!data.success) {
                // alert();
                toast.error(data.message || "Something went wrong")
                return;
            }

            toast.success(
                editData
                    ? "Product updated successfully"
                    : "Product created successfully"
            );

            setForm(defaultForm);
            setImage(null);
            setPreview("");

            onSuccess();
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong");
            // alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(
        (item) => String(item.id) === String(form.category_id)
    );

    const categoryName = selectedCategory?.name?.toLowerCase() || "";

    const isFrameCategory = categoryName.includes("frame");
    const isLensCategory = categoryName.includes("lens");

    return (
        <>
            <div className={styles.addEditTitle}>
                <h4>{title}</h4>
            </div>
            <form className={styles.productForm} onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                    {/* Category */}
                    <div className={styles.formGroup}>
                        <label>Category</label>

                        <select
                            name="category_id"
                            value={form.category_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Category</option>

                            {categories.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Brand */}
                    <div className={styles.formGroup}>
                        <label>Brand</label>

                        <select
                            name="brand_id"
                            value={form.brand_id}
                            onChange={handleChange}
                        >
                            <option value="">Select Brand</option>

                            {brands.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div className={styles.formGroup}>
                        <label>Product Name</label>

                        <input
                            type="text"
                            name="name"
                            placeholder="Enter product name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* SKU */}
                    <div className={styles.formGroup}>
                        <label>SKU</label>

                        <input
                            type="text"
                            name="sku"
                            placeholder="Enter SKU"
                            value={form.sku}
                            onChange={handleChange}
                        />
                    </div>

                    {isFrameCategory && (
                        <>
                            {/* Frame Type */}
                            <div className={styles.formGroup}>
                                <label>Frame Type</label>

                                <select
                                    name="frame_type"
                                    value={form.frame_type}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Frame Type</option>

                                    {frameTypes.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Frame Material */}
                            <div className={styles.formGroup}>
                                <label>Frame Material</label>

                                <select
                                    name="frame_material"
                                    value={form.frame_material}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Frame Material</option>

                                    {frameMaterials.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Frame Shape */}
                            <div className={styles.formGroup}>
                                <label>Frame Shape</label>

                                <select
                                    name="frame_shape"
                                    value={form.frame_shape}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Frame Shape</option>

                                    {frameShapes.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Frame Color */}
                            <div className={styles.formGroup}>
                                <label>Frame Color</label>

                                <select
                                    name="frame_color"
                                    value={form.frame_color}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Frame Color</option>

                                    {frameColors.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Lens Type */}
                    {isLensCategory && (
                        <div className={styles.formGroup}>
                            <label>Lens Type</label>

                            <select
                                name="lens_type"
                                value={form.lens_type}
                                onChange={handleChange}
                            >
                                <option value="">Select Lens Type</option>

                                {lensTypes.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Purchase Price */}
                    <div className={styles.formGroup}>
                        <label>Purchase Price</label>

                        <input
                            type="number"
                            name="purchase_price"
                            placeholder="0"
                            value={form.purchase_price}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Selling Price */}
                    <div className={styles.formGroup}>
                        <label>Selling Price</label>

                        <input
                            type="number"
                            name="selling_price"
                            placeholder="0"
                            value={form.selling_price}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Stock */}
                    <div className={styles.formGroup}>
                        <label>Stock Qty</label>

                        <input
                            type="number"
                            name="stock_qty"
                            placeholder="0"
                            value={form.stock_qty}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Status */}
                    <div className={styles.formGroup}>
                        <label>Status</label>

                        <select
                            name="is_active"
                            value={form.is_active}
                            onChange={handleChange}
                        >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                        </select>
                    </div>

                    {/* Image */}
                    <div className={styles.formGroup}>
                        <label>Product Image</label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImage}
                        />

                        {preview && (
                            <img
                                src={preview}
                                alt="preview"
                                className={styles.preview}
                            />
                        )}
                    </div>
                </div>



                <div className={styles.formActions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : editData
                                ? "Update Product"
                                : "Create Product"}
                    </button>
                </div>
            </form>
        </>

    );
}