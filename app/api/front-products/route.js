// app/api/products/route.js
import { NextResponse } from 'next/server';
// import { pool } from '@/lib/pool'; // adjust to your pool client
import pool from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filterType = searchParams.get('filter_type'); // frame_shape filter
  const limit = parseInt(searchParams.get('limit') || '20');
  const page = parseInt(searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT
        p.id,
        p.name            AS productTitle,
        p.slug,
        p.sku,
        p.gender,
        p.selling_price   AS price,
        p.purchase_price  AS originalPrice,
        p.stock_qty,
        p.frame_type,
        p.frame_material,
        p.frame_shape,
        p.frame_color,
        p.lens_type,
        p.image           AS productImage,
        p.is_active,
        p.created_at,
        c.name            AS type,
        b.name            AS brand
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b     ON b.id = p.brand_id
      WHERE p.is_active = 1
    `;

    const params = [];

    if (filterType) {
      query += ` AND p.frame_shape = ?`;
      params.push(filterType);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [data] = await pool.query(query, params);

    // Count total for pagination
    let countQuery = `SELECT COUNT(*) as total FROM products p WHERE p.is_active = 1`;
    const countParams = [];
    if (filterType) {
      countQuery += ` AND p.frame_shape = ?`;
      countParams.push(filterType);
    }
    const [[{ total }]] = await pool.query(countQuery, countParams);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}