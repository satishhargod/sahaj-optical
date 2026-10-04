'use client';

import styles from './orders.module.scss';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaEdit, FaFilePdf, FaPlus, FaTrash, FaSearch, FaWhatsapp, FaUser, FaTimes, FaEye } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Link from 'next/link';
import autoTable from "jspdf-autotable";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  pending:     { label: "Pending",     color: "#f59e0b" },
  "in-progress":{ label: "In Progress", color: "#3b82f6" },
  completed:   { label: "Completed",   color: "#16a34a" },
};

const EMPTY_PRESCRIPTION = {
  sphericalR: "0.00", sphericalL: "0.00",
  cylindricalR: "0.00", cylindricalL: "0.00",
  axisR: "0.00", axisL: "0.00",
  visionR: "0.00", visionL: "0.00",
  pdR: "0.00", pdL: "0.00",
  addR: "0.00", addL: "0.00",
  glassname: "",
  framename: "",
}
const EMPTY_PAYMENT = { amount:"", date:"", paymentMode:"cash" };
const EMPTY_FORM = {
  name:"", mobile:"", address:"", date:"", remark:"", total:"", status:"pending",
  prescriptions:[{ ...EMPTY_PRESCRIPTION }],
  payments:[{ ...EMPTY_PAYMENT }],
};

// ── PDF Generator ─────────────────────────────────────────────────────────────
const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// Helper function - file ke upar add karo generatePDF se pehle
const checkPageBreak = (doc, y, neededHeight = 40) => {
  const pageHeight = 297;
  const footerStart = 278;
  
  if (y + neededHeight > footerStart - 10) {
    doc.addPage();
    
    // Naye page ka background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, "F");
    
    // Top mini header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 14, "F");
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 14, 210, 2, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SAHAJ OPTICAL — Continued", 105, 10, { align: "center" });
    
    return 22; // Naya y start position
  }
  return y;
};

async function generatePDF(order, download = true) {
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210, M = 14;

  // ── Background ──────────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, W, 297, "F");

  // ── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 42, "F");

  // Accent stripe
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 38, W, 4, "F");

  // Logo
  try {
    const logo = await loadImage("/logo.png");
    doc.addImage(logo, "PNG", M, 8, 22, 22);
  } catch (_) {}

  // Shop name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("SAHAJ OPTICAL", W / 2, 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
 doc.text("Phone: +91 96170 93363", W / 2, 25, {
  align: "center",
});

doc.text(
  "Address: S-48 Kalindi Gold City, Near Aurobindo Hospital, Indore",
  W / 2,
  31,
  {
    align: "center",
  }
)
  // Bill No right
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Bill #${order.id}`, W - M, 14, { align: "right" });
  doc.text(`Date: ${order.date ? new Date(order.date).toLocaleDateString("en-GB") : "--"}`, W - M, 20, { align: "right" });

  // ── Customer card ────────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 48, W - M * 2, 30, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, 48, W - M * 2, 30, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text("CUSTOMER DETAILS", M + 5, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Name:`, M + 5, 64);
  doc.setFont("helvetica", "bold");
  doc.text(order.name || "--", M + 22, 64);

  doc.setFont("helvetica", "normal");
  doc.text(`Mobile:`, M + 90, 64);
  doc.setFont("helvetica", "bold");
  doc.text(order.mobile || "--", M + 107, 64);

  doc.setFont("helvetica", "normal");
  doc.text(`Address:`, M + 5, 72);
  doc.setFont("helvetica", "bold");
  doc.text(order.address || "--", M + 24, 72, { maxWidth: 140 });

  // ── Prescription tables ──────────────────────────────────────────────────
  let y = 86;

  for (const p of (order.prescriptions || [])) {
    y = checkPageBreak(doc, y, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text("EYE TEST PRESCRIPTION", M, y);
    if (p.name) {
      doc.setTextColor(100, 116, 139);
      doc.text(`— ${p.name}`, M + 52, y);
    }
    y += 2;

    // doc.autoTable({
    //   startY: y,
    //   head: [["Parameter", "Right Eye (OD)", "Left Eye (OS)"]],
    //   body: [
    //     ["Spherical",    p.sphericalR   || "—", p.sphericalL   || "—"],
    //     ["Cylindrical",  p.cylindricalR || "—", p.cylindricalL || "—"],
    //     ["Axis",         p.axisR        || "—", p.axisL        || "—"],
    //     ["Pupil Distance", p.pdR        || "—", p.pdL          || "—"],
    //     ["Add Power",    p.addR         || "—", p.addL         || "—"],
    //   ],
    //   theme: "grid",
    //   styles: { fontSize: 9.5, cellPadding: 3.5, textColor: [15,23,42] },
    //   headStyles: { fillColor: [15,23,42], textColor: 255, fontStyle: "bold", fontSize: 9 },
    //   alternateRowStyles: { fillColor: [248,250,252] },
    //   columnStyles: {
    //     0: { fontStyle: "bold", cellWidth: 52, fillColor: [239,246,255], textColor: [30,58,138] },
    //     1: { halign: "center" },
    //     2: { halign: "center" },
    //   },
    //   margin: { left: M, right: M },
    // });

    autoTable(doc, {
  startY: y,
  head: [["", "Spherical", "Cylindrical", "Axis", "Vision", "Pupil Dist.", "Add Power"]],
  body: [
    ["Right Eye", p.sphericalR||"—", p.cylindricalR||"—", p.axisR||"—", p.visionR||"—", p.pdR||"—", p.addR||"—"],
    ["Left Eye",  p.sphericalL||"—", p.cylindricalL||"—", p.axisL||"—", p.visionL||"—", p.pdL||"—", p.addL||"—"],
  ],
  theme: "grid",
  styles: { fontSize: 9, cellPadding: 3, textColor: [15, 23, 42], halign: "center" },
  headStyles: {
    fillColor: [15, 23, 42],
    textColor: 255,
    fontStyle: "bold",
    fontSize: 8.5,
    halign: "center",
  },
  alternateRowStyles: { fillColor: [248, 250, 252] },
  columnStyles: {
    0: {
      fontStyle: "bold",
      cellWidth: 24,
      fillColor: [239, 246, 255],
      textColor: [30, 58, 138],
      halign: "center",
    },
  },
  margin: { left: M, right: M },
});

    y = doc.lastAutoTable.finalY + 4;
    y = checkPageBreak(doc, y, 20);
    // Glass / Frame name below table
    if (p.glassname || p.framename) {
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(M, y, W - M * 2, 12, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 138);
      if (p.glassname) doc.text(`Glass: ${p.glassname}`, M + 4, y + 5);
      if (p.framename) doc.text(`Frame: ${p.framename}`, M + 85, y + 5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100,116,139);
      doc.text("Tested by: Vikrant Acharya", W - M, y + 5, { align: "right" });
      y += 16;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100,116,139);
      doc.text("Tested by: Vikrant Acharya", W - M, y, { align: "right" });
      y += 8;
    }
    y += 4;
  }

  // ── Payment summary ──────────────────────────────────────────────────────
  y = checkPageBreak(doc, y, 50);
  const paid      = Number(order.totalPaid  || 0);
  const remaining = Number(order.remaining  || 0);
  const total     = Number(order.total      || 0);

  y += 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, y, W - M * 2, 38, 3, 3, "F");
  doc.setDrawColor(226,232,240);
  doc.roundedRect(M, y, W - M * 2, 38, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37,99,235);
  doc.text("PAYMENT SUMMARY", M + 5, y + 8);

  const colL = M + 5, colR = W - M - 5;
  const drawRow = (label, value, vy, bold = false, color = [15,23,42]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(label, colL, vy);
    doc.text(value,  colR, vy, { align: "right" });
  };

  drawRow("Total Amount",    `Rs. ${total}`,     y + 16);
  drawRow("Amount Paid",     `Rs. ${paid}`,      y + 24, false, [22,163,74]);
  drawRow("Remaining",       `Rs. ${remaining}`, y + 32, true, remaining > 0 ? [220,38,38] : [22,163,74]);

  // Status pill
  const sConf = STATUS[order.status] || STATUS.pending;
  doc.setFillColor(...hexToRgb(sConf.color));
  doc.roundedRect(W - M - 34, y + 4, 32, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255,255,255);
  doc.text(sConf.label.toUpperCase(), W - M - 18, y + 9.5, { align: "center" });

  y += 44;

  // Remark
  if (order.remark) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100,116,139);
    doc.text(`Remark: ${order.remark}`, M, y);
    y += 8;
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFillColor(15,23,42);
  doc.rect(0, 278, W, 19, "F");
  doc.setFillColor(37,99,235);
  doc.rect(0, 278, W, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255,255,255);
  doc.text("Thank You for Choosing Sahaj Optical!", W/2, 287, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148,163,184);
  doc.text("Your vision is our priority", W/2, 293, { align: "center" });

  if (download) {
    doc.save(`Sahaj-Optical-${order.name}-${order.id}.pdf`);
    // WhatsApp redirect
    const phone = (order.mobile || "").replace(/\D/g, "");
    if (phone) {
      setTimeout(() => {
        window.open(
          `https://wa.me/91${phone}?text=${encodeURIComponent(`Hello ${order.name},\n\nYour bill from *Sahaj Optical* (Bill #${order.id}) is ready!\n\n*Total:* ₹${order.total}\n*Paid:* ₹${order.totalPaid || 0}\n*Remaining:* ₹${order.remaining || 0}\n\nThank you for your visit! 🙏`)}`,
          "_blank"
        );
      }, 3000);
    }
  }
  return doc;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

// ── Customer search dropdown by Name ───────────────────────────────────────────
function CustomerNameInput({ value, onChange, onSelect }) {
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const timer = useRef(null);

  const handleChange = (v) => {
    onChange(v);
    clearTimeout(timer.current);
    if (!v || v.trim().length < 1) { 
      setResults([]); 
      setOpen(false); 
      return; 
    }
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/customers/search?q=${encodeURIComponent(v.trim())}`);
        const data = await res.json();
        setResults(data.data || []);
        setOpen((data.data || []).length > 0);
      } catch {
        setResults([]);
      }
    }, 250);
  };

  return (
    <div className={styles.customerSearch}>
      <input
        value={value || ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Type name to search or add new…"
        autoComplete="off"
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onFocus={() => value && value.trim().length >= 1 && results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((c) => (
            <li key={c.id} onMouseDown={() => { onSelect(c); setOpen(false); }}>
              <span className={styles.dropName}><FaUser size={10} /> {c.name}</span>
              <span className={styles.dropMobile}>{c.mobile || "No Mobile"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── GlassFrameSelect Component ─────────────────────────────────────────────
function GlassFrameSelect({ type, value, onChange }) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    fetch(`/api/products/ptype?type=${type}`)
      .then((r) => r.json())
      .then((data) => setOptions(data.data || []));
  }, [type]);

  return (
    <select
      className={styles.rxCell}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">-- Select {type === "lens" ? "Lens" : "Frame"} --</option>
      {options.map((r) => (
        <option key={r.id} value={r.name}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
// ── Main Component ────────────────────────────────────────────────────────────
export default function Orders() {
  const [orders,      setOrders]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [limit,       setLimit]       = useState(15);
  const [loading,     setLoading]     = useState(false);
  const [apiLoad,     setApiLoad]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [statusF,     setStatusF]     = useState("");
  const [showModal,   setShowModal]   = useState(false);
  const [isEdit,      setIsEdit]      = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form,        setForm]        = useState({ ...EMPTY_FORM });
  const [viewOrder,   setViewOrder]   = useState(null);

  const totalPaid = (form.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const remaining = Number(form.total || 0) - totalPaid;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(
    async (pg = 1, currentLimit = limit, currentSearch = search, currentStatus = statusF) => {
      setApiLoad(true);
      try {
        const params = new URLSearchParams({
          page: pg.toString(),
          limit: currentLimit.toString(),
          ...(currentSearch ? { search: currentSearch.trim() } : {}),
          ...(currentStatus ? { status: currentStatus } : {}),
        });
        const res = await fetch(`/api/orders?${params}`);
        const data = await res.json();

        if (data.success) {
          setOrders(data.data || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || Math.ceil((data.total || 0) / currentLimit) || 1);
        }
      } finally {
        setApiLoad(false);
      }
    },
    [limit, search, statusF]
  );

  useEffect(() => {
    fetchOrders(page, limit, search, statusF);
  }, [page, limit]);

  // Search debounce
  const searchTimer = useRef(null);
  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchOrders(1, limit, v, statusF);
    }, 400);
  };

  const handleStatusChange = (val) => {
    setStatusF(val);
    setPage(1);
    fetchOrders(1, limit, search, val);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || apiLoad) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openNew = () => {
    setIsEdit(false); setEditId(null);
    setForm({ ...EMPTY_FORM, prescriptions: [{ ...EMPTY_PRESCRIPTION }], payments: [{ ...EMPTY_PAYMENT }] });
    setShowModal(true);
  };

  const openEdit = (o) => {
    setIsEdit(true); setEditId(o.id);
    setForm({
      name: o.name||"", mobile: o.mobile||"", address: o.address||"",
      date: o.date ? o.date.slice(0,10) : "", remark: o.remark||"",
      total: o.total||"", status: o.status||"pending",
      prescriptions: o.prescriptions?.length ? o.prescriptions : [{ ...EMPTY_PRESCRIPTION }],
      payments: o.payments?.length
        ? o.payments.map(p => ({ amount:p.amount||"", date:p.payment_date?.slice(0,10)||"", paymentMode:p.paymentMode||"cash" }))
        : [{ ...EMPTY_PAYMENT }],
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        prescriptions: form.prescriptions.filter(p => Object.values(p).some(v => v)),
      };
      const res = await fetch("/api/orders", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editId, ...payload } : payload),
      });
      if (res.ok) {
        setShowModal(false);
        fetchOrders(page, limit, search, statusF);
      }
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this order?")) return;
    await fetch("/api/orders", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id }) });
    fetchOrders(page, limit, search, statusF);
  };

  const prescriptionSet = (idx, field, value) => {
    const updated = [...form.prescriptions];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, prescriptions: updated });
  };

  const paymentSet = (idx, field, value) => {
    const updated = [...form.payments];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, payments: updated });
  };

  useEffect(() => {
    document.body.style.overflow = (showModal || viewOrder) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showModal, viewOrder]);

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin" className={styles.back}>←</Link>
          <div>
            <h1 className={styles.title}>Orders</h1>
            <p className={styles.subtitle}>{total} total records</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              placeholder="Search name, mobile…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <select
            className={styles.pageSizeSelect}
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            title="Records per page"
          >
            <option value={10}>10 per page</option>
            <option value={15}>15 per page</option>
            <option value={20}>20 per page</option>
            <option value={30}>30 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <select className={styles.statusFilter} value={statusF} onChange={(e) => handleStatusChange(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className={styles.newBtn} onClick={openNew}><FaPlus /> New Order</button>
        </div>
      </header>

      {/* ── Order List ── */}
      {apiLoad && orders.length === 0 ? (
        <div className={styles.loaderWrap}><div className={styles.spinner} /></div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>
          <span>📋</span>
          <p>No orders found</p>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((o) => {
            const sConf = STATUS[o.status] || STATUS.pending;
            const paid = Number(o.totalPaid || 0);
            return (
              <div key={o.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardId}>#{o.id}</span>
                    <span className={styles.cardDate}>
                      {o.date ? new Date(o.date).toLocaleDateString("en-GB") : "--"}
                    </span>
                    <span className={styles.statusPill} style={{ "--sc": sConf.color }}>
                      {sConf.label}
                    </span>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.iconBtn} onClick={() => setViewOrder(o)} title="View"><FaEye /></button>
                    <button className={styles.iconBtn} onClick={() => openEdit(o)} title="Edit"><FaEdit /></button>
                    <button className={styles.iconBtn} onClick={() => generatePDF(o, true)} title="PDF"><FaFilePdf /></button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(o.id)} title="Delete"><FaTrash /></button>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.customer}>
                    <strong>{o.name}</strong>
                    <span>{o.mobile}</span>
                    {o.address && <span className={styles.address}>{o.address}</span>}
                  </div>
                  <div className={styles.amounts}>
                    <div className={styles.amtBox}>
                      <span>Total</span><strong>₹{o.total}</strong>
                    </div>
                    <div className={styles.amtBox}>
                      <span>Paid</span><strong className={styles.green}>₹{paid}</strong>
                    </div>
                    <div className={styles.amtBox}>
                      <span>Due</span>
                      <strong className={o.remaining > 0 ? styles.red : styles.green}>₹{o.remaining || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Prescription preview */}
                {o.prescriptions?.slice(0,1).map((p, i) => (
                  <div key={i} className={styles.rxPreview}>
                    <div className={styles.rxRowH}><span>Rx</span><span>RE</span><span>LE</span></div>
                    <div className={styles.rxRow}><span>Sph</span><span>{p.sphericalR||"—"}</span><span>{p.sphericalL||"—"}</span></div>
                    <div className={styles.rxRow}><span>Cyl</span><span>{p.cylindricalR||"—"}</span><span>{p.cylindricalL||"—"}</span></div>
                    <div className={styles.rxRow}><span>Axis</span><span>{p.axisR||"—"}</span><span>{p.axisL||"—"}</span></div>
                  </div>
                ))}
                {o.prescriptions?.length > 1 && (
                  <p className={styles.moreRx}>+{o.prescriptions.length - 1} more prescription(s)</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={page === 1 || apiLoad}
            onClick={() => handlePageChange(1)}
            title="First Page"
          >
            « First
          </button>
          <button
            disabled={page === 1 || apiLoad}
            onClick={() => handlePageChange(page - 1)}
            title="Previous Page"
          >
            ‹ Prev
          </button>
          <div className={styles.pages}>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p = totalPages <= 7 ? i+1 : page <= 4 ? i+1 : page >= totalPages-3 ? totalPages-6+i : page-3+i;
              return (
                <button
                  key={p}
                  className={page===p ? styles.activePage:""}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            disabled={page === totalPages || apiLoad}
            onClick={() => handlePageChange(page + 1)}
            title="Next Page"
          >
            Next ›
          </button>
          <button
            disabled={page === totalPages || apiLoad}
            onClick={() => handlePageChange(totalPages)}
            title="Last Page"
          >
            Last »
          </button>
          <span className={styles.pageInfo}>
            Showing {startRecord}–{endRecord} of {total} records (Page {page} of {totalPages})
          </span>
        </div>
      )}

      {/* ── View Modal ── */}
      {/* ── View Modal ── */}
{viewOrder && (
  <div className={styles.overlay} onClick={() => setViewOrder(null)}>
    <div className={styles.viewModal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.viewHeader}>
        <h2>Order #{viewOrder.id} — {viewOrder.name}</h2>
        <button onClick={() => setViewOrder(null)}><FaTimes /></button>
      </div>
      <div className={styles.viewBody}>
        <div className={styles.viewMeta}>
          <span>{viewOrder.mobile}</span>
          <span>{viewOrder.address}</span>
          <span>{viewOrder.date ? new Date(viewOrder.date).toLocaleDateString("en-GB") : "--"}</span>
          <span className={styles.statusPill} style={{ "--sc": STATUS[viewOrder.status]?.color }}>
            {STATUS[viewOrder.status]?.label}
          </span>
        </div>

        {/* Prescriptions — horizontal table */}
        {viewOrder.prescriptions?.map((p, i) => (
          <div key={i} className={styles.rxFull}>
            <h4>Prescription {i + 1}{p.name ? ` — ${p.name}` : ""}</h4>
            <div className={styles.rxTableWrap}>
              <table className={styles.rxTable}>
                <thead>
                  <tr>
                    <th className={styles.rxRowHead}></th>
                    <th>Spherical</th>
                    <th>Cylindrical</th>
                    <th>Axis</th>
                    <th>Vision</th>
                    <th>Pupil Dist.</th>
                    <th>Add Power</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.rxEyeLabel}>Right Eye</td>
                    <td className={styles.rxViewCell}>{p.sphericalR   || "—"}</td>
                    <td className={styles.rxViewCell}>{p.cylindricalR || "—"}</td>
                    <td className={styles.rxViewCell}>{p.axisR        || "—"}</td>
                    <td className={styles.rxViewCell}>{p.visionR      || "—"}</td>
                    <td className={styles.rxViewCell}>{p.pdR          || "—"}</td>
                    <td className={styles.rxViewCell}>{p.addR         || "—"}</td>
                  </tr>
                  <tr>
                    <td className={styles.rxEyeLabel}>Left Eye</td>
                    <td className={styles.rxViewCell}>{p.sphericalL   || "—"}</td>
                    <td className={styles.rxViewCell}>{p.cylindricalL || "—"}</td>
                    <td className={styles.rxViewCell}>{p.axisL        || "—"}</td>
                    <td className={styles.rxViewCell}>{p.visionL      || "—"}</td>
                    <td className={styles.rxViewCell}>{p.pdL          || "—"}</td>
                    <td className={styles.rxViewCell}>{p.addL         || "—"}</td>
                  </tr>
                  {(p.glassname || p.framename) && (
                    <>
                      {p.glassname && (
                        <tr className={styles.rxProductRow}>
                          <td className={styles.rxEyeLabel}>Glass (Lens)</td>
                          <td colSpan={6} className={styles.rxViewCell}>{p.glassname}</td>
                        </tr>
                      )}
                      {p.framename && (
                        <tr className={styles.rxProductRow}>
                          <td className={styles.rxEyeLabel}>Frame</td>
                          <td colSpan={6} className={styles.rxViewCell}>{p.framename}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className={styles.viewPayments}>
          <h4>Payments</h4>
          {viewOrder.payments?.map((p,i) => (
            <div key={i} className={styles.payRow}>
              <span>₹{p.amount}</span>
              <span>{p.payment_date?.slice(0,10)||"—"}</span>
              <span className={styles.mode}>{p.paymentMode}</span>
            </div>
          ))}
          <div className={styles.payTotal}>
            <span>Total ₹{viewOrder.total}</span>
            <span className={styles.green}>Paid ₹{viewOrder.totalPaid||0}</span>
            <span className={viewOrder.remaining > 0 ? styles.red : styles.green}>Due ₹{viewOrder.remaining||0}</span>
          </div>
        </div>
        {viewOrder.remark && <p className={styles.remark}>📝 {viewOrder.remark}</p>}
      </div>
      <div className={styles.viewFooter}>
        <button className={styles.pdfBtn} onClick={() => generatePDF(viewOrder, true)}>
          <FaFilePdf /> Download PDF
        </button>
        <button className={styles.waBtn} onClick={() => {
          const phone = (viewOrder.mobile||"").replace(/\D/g,"");
          window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(`Hello ${viewOrder.name}, your bill from Sahaj Optical is ready!`)}`, "_blank");
        }}>
          <FaWhatsapp /> WhatsApp
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{isEdit ? "Edit Order" : "New Order"}</h2>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <div className={styles.modalBody}>
              {/* Customer section */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Customer Details</h3>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>Customer Name</label>
                    <CustomerNameInput
                      value={form.name}
                      onChange={(v) => setForm({ ...form, name: v })}
                      onSelect={(c) => {
                        setForm((prev) => ({
                          ...prev,
                          name: c.name || prev.name,
                          mobile: c.mobile || prev.mobile,
                          address: c.address || prev.address,
                        }));
                      }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Mobile Number</label>
                    <input
                      value={form.mobile || ""}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>Address</label>
                    <input
                      value={form.address || ""}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Customer address"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Date</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Remark</label>
                    <input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="Remark" />
                  </div>
                </div>
              </section>

              {/* Prescriptions */}
              <section className={styles.section}>
  <h3 className={styles.sectionTitle}>Eye Prescriptions</h3>
  {form.prescriptions.map((p, idx) => (
    <div key={idx} className={styles.rxBlock}>
      <div className={styles.rxBlockHeader}>
        <span>Prescription {idx + 1}</span>
        {form.prescriptions.length > 1 && (
          <button className={styles.removeRx} onClick={() => {
            const u = [...form.prescriptions]; u.splice(idx, 1);
            setForm({ ...form, prescriptions: u });
          }}><FaTimes /></button>
        )}
      </div>

      {/* Horizontal Table */}
      <div className={styles.rxTableWrap}>
        <table className={styles.rxTable}>
          <thead>
            <tr>
              <th className={styles.rxRowHead}></th>
              <th>Spherical</th>
              <th>Cylindrical</th>
              <th>Axis</th>
              <th>Vision</th>
              <th>Pupil Dist.</th>
              <th>Add Power</th>
            </tr>
          </thead>
          <tbody>
            {/* Right Eye */}
            <tr>
              <td className={styles.rxEyeLabel} data-eye="right">Right Eye</td>
              {[
                ["sphericalR"], ["cylindricalR"], ["axisR"],
                ["visionR"], ["pdR"], ["addR"]
              ].map(([field]) => (
                <td key={field}>
                  <input
                    className={styles.rxCell}
                    type="number"
                    placeholder="0.00"
                    value={p[field] ?? "0.00"}
                    onChange={(e) => prescriptionSet(idx, field, e.target.value)}
                    onFocus={(e) => {
                      if (p[field] === "0.00" || p[field] === "0") prescriptionSet(idx, field, "");
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      prescriptionSet(idx, field, val === "" || isNaN(parseFloat(val)) ? "0.00" : parseFloat(val).toFixed(2));
                    }}
                  />
                </td>
              ))}
            </tr>

            {/* Left Eye */}
            <tr>
              <td className={styles.rxEyeLabel}>Left Eye</td>
              {[
                ["sphericalL"], ["cylindricalL"], ["axisL"],
                ["visionL"], ["pdL"], ["addL"]
              ].map(([field]) => (
                <td key={field}>
                  <input
                    className={styles.rxCell}
                    type="number"
                    placeholder="0.00"
                    value={p[field] ?? "0.00"}
                    onChange={(e) => prescriptionSet(idx, field, e.target.value)}
                    onFocus={(e) => {
                      if (p[field] === "0.00" || p[field] === "0") prescriptionSet(idx, field, "");
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      prescriptionSet(idx, field, val === "" || isNaN(parseFloat(val)) ? "0.00" : parseFloat(val).toFixed(2));
                    }}
                  />
                </td>
              ))}
            </tr>

            {/* Glass Name */}
            <tr className={styles.rxProductRow}>
              <td className={styles.rxEyeLabel}>Glass (Lens)</td>
              <td colSpan={6}>
                 <GlassFrameSelect
      type="lens"
      value={p.glassname}
      onChange={(val) => prescriptionSet(idx, "glassname", val)}
    />
              </td>
            </tr>

            {/* Frame Name */}
            <tr className={styles.rxProductRow}>
              <td className={styles.rxEyeLabel}>Frame</td>
              <td colSpan={6}>
                 <GlassFrameSelect
      type="frame"
      value={p.framename}
      onChange={(val) => prescriptionSet(idx, "framename", val)}
    />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ))}
  <button className={styles.addMore} onClick={() =>
    setForm({ ...form, prescriptions: [...form.prescriptions, { ...EMPTY_PRESCRIPTION }] })
  }>+ Add Prescription</button>
</section>

              {/* Payments */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Payment</h3>
                <div className={styles.field} style={{ marginBottom: 14 }}>
                  <label>Total Amount</label>
                  <input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} placeholder="0" />
                </div>
                {form.payments.map((pay, idx) => (
                  <div key={idx} className={styles.payEntry}>
                    <div className={styles.field}>
                      <label>Amount</label>
                      <input type="number" value={pay.amount} onChange={(e) => paymentSet(idx,"amount",e.target.value)} placeholder="0" />
                    </div>
                    <div className={styles.field}>
                      <label>Date</label>
                      <input type="date" value={pay.date} onChange={(e) => paymentSet(idx,"date",e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label>Mode</label>
                      <select value={pay.paymentMode} onChange={(e) => paymentSet(idx,"paymentMode",e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                    {form.payments.length > 1 && (
                      <button className={styles.removePayBtn} onClick={() => {
                        const u = form.payments.filter((_,i) => i !== idx); setForm({ ...form, payments: u });
                      }}><FaTimes /></button>
                    )}
                  </div>
                ))}
                <button className={styles.addMore} onClick={() => setForm({ ...form, payments: [...form.payments, { ...EMPTY_PAYMENT }] })}>
                  + Add Payment
                </button>
                <div className={styles.remainingBox}>
                  <span>Total Paid: <strong>₹{totalPaid}</strong></span>
                  <span className={remaining > 0 ? styles.red : styles.green}>
                    Remaining: <strong>₹{remaining}</strong>
                  </span>
                </div>
              </section>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving…" : isEdit ? "Update Order" : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function generateAndDownload(order) {
  await generatePDF(order, true);
}