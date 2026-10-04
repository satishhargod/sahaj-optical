import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";

    const [rows] = await pool.query(
      `SELECT id, name FROM products p WHERE p.product_type = ? ORDER BY p.name ASC LIMIT 200`,
      [type]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}