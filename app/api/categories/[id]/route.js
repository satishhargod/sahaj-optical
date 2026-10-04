import pool from "@/lib/db";
import { NextResponse } from "next/server";

// UPDATE
export async function PUT(req, { params }) {
  try {
    const { id } = params;

    const body = await req.json();

    const name = body.name?.trim();
    const image = body.image || null;
    const is_active = body.is_active ?? 1;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name required",
        },
        { status: 400 }
      );
    }

    // duplicate check
    const [exists] = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE LOWER(name)=LOWER(?)
      AND id != ?
    `,
      [name, id]
    );

    if (exists.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category already exists",
        },
        { status: 400 }
      );
    }

    await pool.query(
      `
      UPDATE categories
      SET
        name=?,
        image=?,
        is_active=?
      WHERE id=?
    `,
      [name, image, is_active, id]
    );

    return NextResponse.json({
      success: true,
      message: "Category updated",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update category",
      },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // product use check
    const [products] = await pool.query(
      `
      SELECT id
      FROM products
      WHERE category_id=?
      LIMIT 1
    `,
      [id]
    );

    if (products.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Category used in products",
        },
        { status: 400 }
      );
    }

    await pool.query(`DELETE FROM categories WHERE id=?`, [id]);

    return NextResponse.json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete category",
      },
      { status: 500 }
    );
  }
}