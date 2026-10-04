import pool from "@/lib/db";
import { NextResponse } from "next/server";


// ======================================================
// GET SINGLE PRODUCT
// ======================================================

export async function GET(req, { params }) {
  try {
    const { id } = params;

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
      WHERE p.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.log("PRODUCT_SINGLE_GET_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// UPDATE PRODUCT
// ======================================================

export async function PUT(req, { params }) {
  try {
    const { id } = params;

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

    // Check Product Exists
    const [existProduct] = await pool.query(
      `
      SELECT id, image
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existProduct.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    // Duplicate SKU Check
    if (sku) {
      const [existSku] = await pool.query(
        `
        SELECT id
        FROM products
        WHERE sku = ?
        AND id != ?
        LIMIT 1
        `,
        [sku, id]
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

    // Image Upload
    let image = existProduct[0].image;

    if (imageFile && imageFile.name) {
      image = await uploadFile(imageFile, "products");
    }

    // Update Product
    await pool.query(
      `
      UPDATE products
      SET
          category_id = ?,
          brand_id = ?,
          name = ?,
          sku = ?,
          purchase_price = ?,
          selling_price = ?,
          product_type = ?,
          stock_qty = ?,
          image = ?,
          is_active = ?,
          frame_type = ?,
          frame_material = ?,
          frame_shape = ?,
          frame_color = ?,
          lens_type = ?
      WHERE id = ?
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

        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.log("PRODUCT_UPDATE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
      },
      {
        status: 500,
      }
    );
  }
}


// ======================================================
// DELETE PRODUCT
// ======================================================

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check Exists

    const [existProduct] = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existProduct.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    // Hard Delete

    await pool.query(
      `
      DELETE FROM products
      WHERE id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log("PRODUCT_DELETE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      {
        status: 500,
      }
    );
  }
}