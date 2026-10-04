import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET ALL CUSTOMERS
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const search = (searchParams.get("search") || "").trim();

    const offset = (page - 1) * limit;

    let where = "";
    let values = [];

    if (search) {
      where = `
        WHERE 
          name LIKE ? OR
          mobile LIKE ? OR
          address LIKE ?
      `;

      values = [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ];
    }

    const [rows] = await pool.query(
      `
      SELECT * FROM users
      ${where}
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      values
    );

    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM users
      ${where}
      `,
      values
    );

    const total = countRows?.[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: rows || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

 // ADD CUSTOMER
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      mobile,
      address,
    } = body;
    // CHECK MOBILE ALREADY EXISTS
    const [existing] = await pool.query(
      `
      SELECT * FROM users
      WHERE mobile = ?
      LIMIT 1
      `,
      [mobile]
    );

    // IF CUSTOMER EXISTS RETURN OLD DATA
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "Customer already exists",
        data: existing[0],
      });
    }

    // INSERT NEW CUSTOMER
    const [result] = await pool.query(
      `
      INSERT INTO users (
        name,
        mobile,
        address
      )
      VALUES (?, ?, ?)
      `,
      [
        name,
        mobile,
        address,
      ]
    );

    // GET INSERTED CUSTOMER
    const [rows] = await pool.query(
      `
      SELECT * FROM users
      WHERE id = ?
      `,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      duplicate: false,
      message: "Customer added successfully",
      data: rows[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}