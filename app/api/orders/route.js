// app/api/orders/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ── GET — fetch all orders with prescriptions + payments ─────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where += " AND (o.name LIKE ? OR o.mobile LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      where += " AND o.status = ?";
      params.push(status);
    }

    // Total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM orders o ${where}`,
      params
    );
    const total = countRows?.[0]?.total || 0;

    // Orders
    const [orders] = await pool.query(
      `SELECT * FROM orders o ${where} ORDER BY o.createdAt DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, data: [], total, totalPages: Math.ceil(total / limit), page, limit });
    }

    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map(() => "?").join(",");

    // Prescriptions
    const [prescriptions] = await pool.query(
      `SELECT * FROM prescriptions WHERE order_id IN (${placeholders})`,
      orderIds
    );

    // Payments
    const [payments] = await pool.query(
      `SELECT * FROM payments WHERE order_id IN (${placeholders}) ORDER BY payment_date ASC`,
      orderIds
    );

    // Merge
    const data = orders.map((order) => ({
      ...order,
      prescriptions: (prescriptions || []).filter((p) => p.order_id === order.id),
      payments: (payments || []).filter((p) => p.order_id === order.id),
    }));

    return NextResponse.json({ success: true, data, total, totalPages: Math.ceil(total / limit), page, limit });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ── POST — create new order ───────────────────────────────────────────────────
export async function POST(req) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const body = await req.json();
    const {
      name, mobile, address, date, remark,
      total, status = "pending",
      prescriptions = [], payments = [],
    } = body;

    // Calculate totals
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const remaining = Number(total || 0) - totalPaid;

    // Insert order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (name, mobile, address, date, remark, total, totalPaid, remaining, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, mobile, address, date, remark, total, totalPaid, remaining, status]
    );
    const orderId = orderResult.insertId;

    // Insert prescriptions
    for (const p of prescriptions) {
      if (!Object.values(p).some((v) => v !== "" && v != null)) continue;
      await conn.query(
        `INSERT INTO prescriptions
          (order_id, name, sphericalR, sphericalL, cylindricalR, cylindricalL, axisR, axisL, visionR, visionL, pdR, pdL, addR, addL, glassname, framename, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, NOW())`,
        [orderId, p.name || "", p.sphericalR || "", p.sphericalL || "", p.cylindricalR || "",
          p.cylindricalL || "", p.axisR || "", p.axisL || "", p.visionR || "", p.visionL || "", p.pdR || "", p.pdL || "",
          p.addR || "", p.addL || "", p.glassname || "", p.framename || ""]
      );
    }

    // Insert payments
    for (const pay of payments) {
      if (!pay.amount) continue;
      await conn.query(
        `INSERT INTO payments (order_id, amount, payment_date, paymentMode, createdAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [orderId, pay.amount, pay.date || null, pay.paymentMode || "cash"]
      );
    }

    // Upsert customer into users table
    if (mobile || name) {
      let existing = [];
      if (mobile) {
        [existing] = await conn.query(
          "SELECT id FROM users WHERE mobile = ?",
          [mobile]
        );
      }
      if (existing.length === 0 && name) {
        [existing] = await conn.query(
          "SELECT id FROM users WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
          [name]
        );
      }

      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO users (name, mobile, address, createdAt, updatedAt)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [name || "", mobile || "", address || ""]
        );
      } else {
        await conn.query(
          `UPDATE users 
           SET name = COALESCE(NULLIF(?, ''), name),
               address = COALESCE(NULLIF(?, ''), address),
               updatedAt = NOW()
           WHERE id = ?`,
          [name || "", address || "", existing[0].id]
        );
      }
    }

    await conn.commit();
    return NextResponse.json({ success: true, id: orderId });
  } catch (error) {
    await conn.rollback();
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    conn.release();
  }
}

// ── PUT — update order ────────────────────────────────────────────────────────
export async function PUT(req) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const body = await req.json();
    const {
      id, name, mobile, address, date, remark,
      total, status, prescriptions = [], payments = [],
    } = body;

    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const remaining = Number(total || 0) - totalPaid;

    await conn.query(
      `UPDATE orders SET name=?, mobile=?, address=?, date=?, remark=?, total=?, totalPaid=?, remaining=?, status=?
       WHERE id=?`,
      [name, mobile, address, date, remark, total, totalPaid, remaining, status, id]
    );

    // Upsert customer into users table if needed
    if (mobile || name) {
      let existing = [];
      if (mobile) {
        [existing] = await conn.query(
          "SELECT id FROM users WHERE mobile = ?",
          [mobile]
        );
      }
      if (existing.length === 0 && name) {
        [existing] = await conn.query(
          "SELECT id FROM users WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
          [name]
        );
      }

      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO users (name, mobile, address, createdAt, updatedAt)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [name || "", mobile || "", address || ""]
        );
      }
    }

    // Replace prescriptions
    await conn.query(`DELETE FROM prescriptions WHERE order_id = ?`, [id]);
    for (const p of prescriptions) {
      if (!Object.values(p).some((v) => v !== "" && v != null)) continue;
      await conn.query(
        `INSERT INTO prescriptions
          (order_id, name, sphericalR, sphericalL, cylindricalR, cylindricalL, axisR, axisL, pdR, pdL, addR, addL, glassname, framename, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, p.name || "", p.sphericalR || "", p.sphericalL || "", p.cylindricalR || "",
          p.cylindricalL || "", p.axisR || "", p.axisL || "", p.pdR || "", p.pdL || "",
          p.addR || "", p.addL || "", p.glassname || "", p.framename || ""]
      );
    }

    // Replace payments
    await conn.query(`DELETE FROM payments WHERE order_id = ?`, [id]);
    for (const pay of payments) {
      if (!pay.amount) continue;
      await conn.query(
        `INSERT INTO payments (order_id, amount, payment_date, paymentMode, createdAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [id, pay.amount, pay.date || null, pay.paymentMode || "cash"]
      );
    }

    await conn.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await conn.rollback();
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    conn.release();
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = await req.json();
    await conn.query(`DELETE FROM prescriptions WHERE order_id = ?`, [id]);
    await conn.query(`DELETE FROM payments      WHERE order_id = ?`, [id]);
    await conn.query(`DELETE FROM orders        WHERE id = ?`, [id]);
    await conn.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await conn.rollback();
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    conn.release();
  }
}