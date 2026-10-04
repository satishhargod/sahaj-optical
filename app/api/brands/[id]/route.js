import pool from "@/lib/db";
import { NextResponse } from "next/server";

// UPDATE
export async function PUT(req, { params }) {
  try {
    const { id } = params;

    const body = await req.json();

    const name = body.name?.trim();
    const logo = body.logo || null;
    const is_active = body.is_active ?? 1;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand name required",
        },
        { status: 400 }
      );
    }

    // duplicate check
    const [exists] = await pool.query(
      `
      SELECT id
      FROM brands
      WHERE LOWER(name)=LOWER(?)
      AND id != ?
    `,
      [name, id]
    );

    if (exists.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand already exists",
        },
        { status: 400 }
      );
    }

    await pool.query(
      `
      UPDATE brands
      SET
        name=?,
        logo=?,
        is_active=?
      WHERE id=?
    `,
      [name, logo, is_active, id]
    );

    return NextResponse.json({
      success: true,
      message: "Brand updated",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update brand",
      },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // check product usage
    const [products] = await pool.query(
      `
      SELECT id
      FROM products
      WHERE brand_id=?
      LIMIT 1
    `,
      [id]
    );

    if (products.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand used in products",
        },
        { status: 400 }
      );
    }

    await pool.query(
      `DELETE FROM brands WHERE id=?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Brand deleted",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete brand",
      },
      { status: 500 }
    );
  }
}