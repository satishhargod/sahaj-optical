import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET LIST
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";

    let sql = `
      SELECT *
      FROM categories
      WHERE name LIKE ?
      ORDER BY id DESC
    `;

    const [rows] = await pool.query(sql, [`%${search}%`]);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

// CREATE
export async function POST(req) {
  try {
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
      `SELECT id FROM categories WHERE LOWER(name)=LOWER(?)`,
      [name]
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

    const [result] = await pool.query(
      `
      INSERT INTO categories
      (name,image,is_active)
      VALUES (?,?,?)
    `,
      [name, image, is_active]
    );

    return NextResponse.json({
      success: true,
      message: "Category created",
      id: result.insertId,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
      },
      { status: 500 }
    );
  }
}