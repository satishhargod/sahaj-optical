import pool from "@/lib/db";
import { uploadFile } from "@/lib/uploadFile";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    const search = searchParams.get("search") || "";
    const category_id = searchParams.get("category_id") || "";
    const brand_id = searchParams.get("brand_id") || "";

    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params = [];

    // Search
    if (search) {
      where += ` AND (
        p.name LIKE ?
        OR p.sku LIKE ?
      )`;

      params.push(`%${search}%`, `%${search}%`);
    }

    // Category Filter
    if (category_id) {
      where += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    // Brand Filter
    if (brand_id) {
      where += ` AND p.brand_id = ?`;
      params.push(brand_id);
    }

    // Total Count
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products p
      ${where}
      `,
      params
    );

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    // Products
    const [rows] = await pool.query(
      `
      SELECT 
          p.*,
          c.name AS category_name,
          b.name AS brand_name
      FROM products p
      LEFT JOIN categories c 
          ON c.id = p.category_id
      LEFT JOIN brands b 
          ON b.id = p.brand_id

      ${where}

      ORDER BY p.id DESC

      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.log("PRODUCT_GET_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const category_id = formData.get("category_id");
    const brand_id = formData.get("brand_id");

    const name = formData.get("name");
    const sku = formData.get("sku");

    const purchase_price = formData.get("purchase_price");
    const selling_price = formData.get("selling_price");
      const product_type = formData.get("product_type");

    const stock_qty = formData.get("stock_qty");

    const is_active = formData.get("is_active");

    // Optical fields
    const frame_type = formData.get("frame_type");
    const frame_material = formData.get("frame_material");
    const frame_shape = formData.get("frame_shape");
    const frame_color = formData.get("frame_color");
    const lens_type = formData.get("lens_type");

    const imageFile = formData.get("image");

    // Validation
    if (!category_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!selling_price) {
      return NextResponse.json(
        {
          success: false,
          message: "Selling price is required",
        },
        {
          status: 400,
        }
      );
    }

    // Upload image
    let image = null;

    if (imageFile && imageFile.name) {
      image = await uploadFile(imageFile, "products");
    }

    // Duplicate SKU check
    if (sku) {
      const [existSku] = await pool.query(
        `
        SELECT id
        FROM products
        WHERE sku = ?
        LIMIT 1
        `,
        [sku]
      );

      if (existSku.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "SKU already exists",
          },
          {
            status: 400,
          }
        );
      }
    }

    // Insert Product
    const [result] = await pool.query(
      `
      INSERT INTO products (
        category_id,
        brand_id,
        name,
        sku,
        purchase_price,
        selling_price,
        product_type,
        stock_qty,
        image,
        is_active,
        frame_type,
        frame_material,
        frame_shape,
        frame_color,
        lens_type
      )
      VALUES (?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        category_id,
        brand_id || null,
        name,
        sku || null,
        purchase_price || 0,
        selling_price,
        product_type,
        stock_qty || 0,
        image,
        is_active ?? 1,

        // Optical fields
        frame_type || null,
        frame_material || null,
        frame_shape || null,
        frame_color || null,
        lens_type || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product_id: result.insertId,
    });
  } catch (error) {
    console.log("PRODUCT_POST_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}