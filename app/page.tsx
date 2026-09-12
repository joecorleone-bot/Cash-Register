"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, CreditCard, Download, LayoutDashboard, Menu, Plus, Receipt, Search, ShoppingBag, Sparkles, Trash2, Wallet, X } from "lucide-react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Payment = "Tunai" | "QR / Online Transfer" | "Kad";
type Sale = { id: number; date: string; category: string; amount: number; payment: Payment; note: string };

const PRODUCT_CATEGORY = "Squishy";
const seed: Sale[] = [
  { id: 1, date: "2026-09-12T09:15", category: PRODUCT_CATEGORY, amount: 185.5, payment: "QR / Online Transfer", note: "" },
  { id: 2, date: "2026-09-12T10:42", category: PRODUCT_CATEGORY, amount: 96, payment: "Tunai", note: "" },
  { id: 3, date: "2026-09-11T13:10", category: PRODUCT_CATEGORY, amount: 320, payment: "Kad", note: "" },
  { id: 4, date: "2026-09-11T15:30", category: PRODUCT_CATEGORY, amount: 245.5, payment: "QR / Online Transfer", note: "" },
  { id: 5, date: "2026-09-10T12:20", category: PRODUCT_CATEGORY, amount: 138, payment: "Tunai", note: "" },
  { id: 6, date: "2026-09-09T16:00", category: PRODUCT_CATEGORY, amount: 450, payment: "Kad", note: "" },
  { id: 7, date: "2026-09-08T11:25", category: PRODUCT_CATEGORY, amount: 215, payment: "Tunai", note: "" },
];

const money = (n: number) => `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`;
const dateLabel = (s: string) => new Date(s).toLocaleString("ms-MY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Home() {
  const [sales, setSales] = useState<Sale[]>(seed);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [form, setForm] = useState<Omit<Sale, "id">>({ date: "2026-09-12T15:00", category: PRODUCT_CATEGORY, amount: 0, payment: "Tunai", note: "" });

  const today = "2026-09-12";
  const todaySales = useMemo(() => sales.filter(s => s.date.startsWith(today)), [sales]);
  const weekSales = useMemo(() => sales.filter(s => { const d = new Date(s.date); const diff = (new Date(today).getTime() - new Date(d.toDateString()).getTime()) / 86400000; return diff >= 0 && diff < 7; }), [sales]);
  const monthSales = useMemo(() => sales.filter(s => s.date.startsWith("2026-09")), [sales]);
  const total = (xs: Sale[]) => xs.reduce((a, s) => a + s.amount, 0);
  const avg = total(monthSales) / Math.max(new Set(monthSales.map(s => s.date.slice(0, 10))).size, 1);
  const totalTransactions = monthSales.length;

  const filtered = sales.filter(s => (!query || `${s.category} ${s.note}`.toLowerCase().includes(query.toLowerCase())) && (!date || s.date.startsWith(date)));
  const trend = ["08 Sep", "09 Sep", "10 Sep", "11 Sep", "12 Sep"].map(label => ({ name: label, jualan: total(sales.filter(s => dateLabel(s.date).startsWith(label)))}));
  const payments = (["Tunai", "QR / Online Transfer", "Kad"] as Payment[]).map(p => ({ name: p, value: total(sales.filter(s => s.payment === p)) })).filter(x => x.value > 0);

  function openNewSale() { setEditing(null); setForm({ date: "2026-09-12T15:00", category: PRODUCT_CATEGORY, amount: 0, payment: "Tunai", note: "" }); setOpenForm(true); }
  function saveSale() {
    if (!form.date || form.amount <= 0) return;
    const sale = { ...form, category: PRODUCT_CATEGORY };
    if (editing) setSales(prev => prev.map(s => s.id === editing.id ? { ...sale, id: editing.id } : s));
    else setSales(prev => [{ ...sale, id: Date.now() }, ...prev]);
    setOpenForm(false); setEditing(null);
  }
  function editSale(s: Sale) { setEditing(s); setForm({ date: s.date, category: PRODUCT_CATEGORY, amount: s.amount, payment: s.payment, note: s.note }); setOpenForm(true); }
  function removeSale(id: number) { if (confirm("Padam rekod jualan ini?")) setSales(prev => prev.filter(s => s.id !== id)); }
  function exportCsv() {
    const rows = [["Tarikh & Masa", "Kategori", "Jumlah (RM)", "Kaedah Pembayaran", "Nota"], ...filtered.map(s => [s.date, PRODUCT_CATEGORY, s.amount.toFixed(2), s.payment, s.note])];
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); a.download = "squishy-sales.csv"; a.click();
  }

  return <main className="app">
    <aside className="sidebar"><div className="brand"><div className="brandIcon"><Sparkles size={22}/></div><div><b>Squishy</b><span>Sales Studio</span></div></div><nav><a className="active"><LayoutDashboard size={18}/> Dashboard</a><a onClick={openNewSale}><Plus size={18}/> Rekod Jualan</a><a><BarChart3 size={18}/> Laporan</a></nav><div className="sideBottom"><span className="statusDot"/> Live sales tracker</div></aside>
    <section className="content"><header><div className="mobileTitle"><button className="iconBtn"><Menu/></button><b>Squishy</b></div><div className="welcome"><p>Hi! Jom tengok prestasi hari ini ✨</p><h1>Sales Dashboard</h1></div><button className="primary" onClick={openNewSale}><Plus size={18}/> Rekod Jualan</button></header>
      <div className="hero"><div><span className="heroBadge"><Sparkles size={13}/> SQUISHY SALES</span><h2>Keep selling, keep squishing! 🫧</h2><p>Pantau jualan harian anda dengan cara yang lebih mudah dan fun.</p></div><div className="heroBubble bubbleOne">🧸</div><div className="heroBubble bubbleTwo">💖</div><div className="heroBubble bubbleThree">✨</div></div>
      <div className="toolbar"><div className="datePill"><CalendarDays size={17}/> 12 September 2026 <span>•</span> Hari ini</div><button className="outline" onClick={exportCsv}><Download size={17}/> Eksport</button></div>
      <section className="kpis"><Kpi title="Jualan Hari Ini" value={total(todaySales)} icon={<Wallet/>} accent="green"/><Kpi title="Jualan Minggu Ini" value={total(weekSales)} icon={<BarChart3/>} accent="blue"/><Kpi title="Jualan Bulan Ini" value={total(monthSales)} icon={<Receipt/>} accent="purple"/><Kpi title="Transaksi Bulan Ini" value={totalTransactions} icon={<ShoppingBag/>} accent="orange" plain/></section>
      <section className="charts"><div className="panel trend"><div className="panelHead"><div><h2>Jualan Naik ✨</h2><p>Trend jualan beberapa hari terakhir</p></div><span className="selectMini">September 2026 ▾</span></div><ResponsiveContainer width="100%" height={250}><LineChart data={trend}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis tickFormatter={v => `RM${v}`}/><Tooltip formatter={(v) => [money(Number(v)), "Jualan"]}/><Line type="monotone" dataKey="jualan" stroke="#8a68ff" strokeWidth={4} dot={{r:5,fill:"#ff5f96",strokeWidth:2}}/></LineChart></ResponsiveContainer></div><div className="panel"><div className="panelHead"><div><h2>Bayaran</h2><p>Bagaimana pelanggan bayar</p></div></div><div className="donut"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={payments} dataKey="value" nameKey="name" innerRadius={55} outerRadius={78} paddingAngle={3}>{payments.map((_, i) => <Cell key={i} fill={i === 0 ? "#18a66a" : i === 1 ? "#3b82f6" : "#8b5cf6"}/>)}</Pie><Tooltip formatter={(v) => money(Number(v))}/></PieChart></ResponsiveContainer></div><div className="legend">{payments.map((p, i) => <div key={p.name}><i className={`dot d${i}`}/><span>{p.name}</span><b>{money(p.value)}</b></div>)}</div></div></section>
      <section className="panel tablePanel"><div className="panelHead tableHead"><div><h2>Transaksi Terkini</h2><p>{filtered.length} rekod dipaparkan</p></div><div className="filters"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari rekod..."/></div><input className="dateFilter" type="date" value={date} onChange={e => setDate(e.target.value)}/></div></div><div className="tableWrap"><table><thead><tr><th>Tarikh & Masa</th><th>Kategori</th><th>Jumlah</th><th>Pembayaran</th><th>Nota</th><th></th></tr></thead><tbody>{filtered.map(s => <tr key={s.id}><td>{dateLabel(s.date)}</td><td><span className="categoryTag">{PRODUCT_CATEGORY} ✨</span></td><td className="amount">{money(s.amount)}</td><td><span className={`payment ${s.payment === "Tunai" ? "cash" : s.payment === "Kad" ? "card" : "qr"}`}>{s.payment}</span></td><td className="muted">{s.note || "—"}</td><td><button className="textBtn" onClick={() => editSale(s)}>Edit</button><button className="deleteBtn" onClick={() => removeSale(s.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></section>
    </section>
    {openForm && <div className="modalBack"><div className="modal"><div className="modalHead"><div><h2>{editing ? "Edit Jualan ✨" : "Rekod Jualan Baru ✨"}</h2><p>Tambah transaksi Squishy dengan cepat</p></div><button className="iconBtn" onClick={() => setOpenForm(false)}><X/></button></div><div className="formGrid"><label>Tarikh & Masa<input type="datetime-local" value={form.date} onChange={e => setForm({...form, date:e.target.value})}/></label><label>Kategori<select value={PRODUCT_CATEGORY} disabled><option>{PRODUCT_CATEGORY}</option></select></label><label>Jumlah Jualan (RM)<input type="number" min="0" step="0.01" value={form.amount || ""} onChange={e => setForm({...form, amount:Number(e.target.value)})}/></label><label>Kaedah Pembayaran<select value={form.payment} onChange={e => setForm({...form, payment:e.target.value as Payment})}><option>Tunai</option><option>QR / Online Transfer</option><option>Kad</option></select></label><label className="full">Nota / Catatan<textarea rows={3} value={form.note} onChange={e => setForm({...form, note:e.target.value})} placeholder="Contoh: 2 pcs, customer repeat, promo..."/></label></div><div className="modalActions"><button className="outline" onClick={() => setOpenForm(false)}>Batal</button><button className="primary" onClick={saveSale}>{editing ? "Simpan Perubahan" : "Simpan Jualan"}</button></div></div></div>}
  </main>
}

function Kpi({title,value,icon,accent,plain=false}:{title:string,value:number,icon:React.ReactNode,accent:string,plain?:boolean}) { return <div className="kpi"><div className={`kpiIcon ${accent}`}>{icon}</div><div><span>{title}</span><strong>{plain ? value.toLocaleString("en-MY") : money(value)}</strong></div></div> }
