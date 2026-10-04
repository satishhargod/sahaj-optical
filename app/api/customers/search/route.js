import { NextResponse } from "next/server";
import pool from "@/lib/db";
 
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
 
    if (!q) return NextResponse.json({ success: true, data: [] });
 
    const [rows] = await pool.query(
      `SELECT id, name, mobile, address FROM users
       WHERE name LIKE ? OR mobile LIKE ?
       ORDER BY id DESC
       LIMIT 10`,
      [`%${q}%`, `%${q}%`]
    );
 
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}