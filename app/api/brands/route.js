import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";

    const [rows] = await pool.query(
      `
      SELECT *
      FROM brands
      WHERE name LIKE ?
      ORDER BY id DESC
    `,
      [`%${search}%`]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch brands",
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
    `,
      [name]
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

    const [result] = await pool.query(
      `
      INSERT INTO brands
      (name,logo,is_active)
      VALUES (?,?,?)
    `,
      [name, logo, is_active]
    );

    return NextResponse.json({
      success: true,
      message: "Brand created",
      id: result.insertId,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create brand",
      },
      { status: 500 }
    );
  }
}