import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET CUSTOMER DETAILS
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.query(
      `
      SELECT * FROM users
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
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

// UPDATE CUSTOMER
export async function PUT(req, { params }) {
  try {
    const { id } = await params;

    const body = await req.json();

    const {
      name,
      mobile,
      address,
    } = body;

    await pool.query(
      `
      UPDATE users
      SET
        name = ?,
        mobile = ?,
        address = ?
      WHERE id = ?
      `,
      [
        name,
        mobile,
        address,
        id,
      ]
    );

    const [rows] = await pool.query(
      `
      SELECT * FROM users
      WHERE id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
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

// DELETE CUSTOMER
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    await pool.query(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
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