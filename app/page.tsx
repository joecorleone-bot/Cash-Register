"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, CreditCard, Download, LayoutDashboard, Menu, Package, Plus, Receipt, Search, ShoppingBag, Sparkles, Trash2, Wallet, X } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Payment = "Tunai" | "QR / Online Transfer" | "Kad";
type Product = { id: number; name: string; sku: string; price: number; cost: number; stock: number; lowStock: number };
type Sale = { id: number; date: string; productId: number; quantity: number; amount: number; payment: Payment; note: string };

const seedProducts: Product[] = [
  { id: 1, name: "Squishy Bear", sku: "SQ-BEAR", price: 18, cost: 8, stock: 24, lowStock: 5 },
  { id: 2, name: "Squishy Heart", sku: "SQ-HEART", price: 22, cost: 10, stock: 18, lowStock: 5 },
  { id: 3, name: "Squishy Cat", sku: "SQ-CAT", price: 25, cost: 11, stock: 7, lowStock: 5 },
  { id: 4, name: "Squishy Cloud", sku: "SQ-CLOUD", price: 20, cost: 9, stock: 31, lowStock: 5 },
];
const seedSales: Sale[] = [
  { id: 1, date: "2026-09-12T09:15", productId: 1, quantity: 5, amount: 90, payment: "QR / Online Transfer", note: "" },
  { id: 2, date: "2026-09-12T10:42", productId: 2, quantity: 4, amount: 88, payment: "Tunai", note: "Repeat customer" },
  { id: 3, date: "2026-09-11T13:10", productId: 3, quantity: 8, amount: 200, payment: "Kad", note: "" },
  { id: 4, date: "2026-09-11T15:30", productId: 1, quantity: 6, amount: 108, payment: "QR / Online Transfer", note: "" },
  { id: 5, date: "2026-09-10T12:20", productId: 4, quantity: 7, amount: 140, payment: "Tunai", note: "Promo" },
  { id: 6, date: "2026-09-09T16:00", productId: 2, quantity: 10, amount: 220, payment: "Kad", note: "" },
  { id: 7, date: "2026-09-08T11:25", productId: 3, quantity: 4, amount: 100, payment: "Tunai", note: "" },
];

const money = (n: number) => `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`;
const dateLabel = (s: string) => new Date(s).toLocaleString("ms-MY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const localDateTime = () => { const d = new Date(); const pad = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const localDate = () => localDateTime().slice(0, 10);

export default function Home() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [sales, setSales] = useState<Sale[]>(seedSales);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [form, setForm] = useState({ date: "", productId: 1, quantity: 1, payment: "Tunai" as Payment, note: "" });
  const [productForm, setProductForm] = useState({ name: "", sku: "", price: 0, cost: 0, stock: 0, lowStock: 5 });

  useEffect(() => { const tick = () => setCurrentDateTime(localDateTime()); tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, []);

  const today = currentDateTime ? currentDateTime.slice(0, 10) : "2026-09-12";
  const currentMonth = currentDateTime ? currentDateTime.slice(0, 7) : "2026-09";
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const todaySales = useMemo(() => sales.filter(s => s.date.startsWith(today)), [sales, today]);
  const weekSales = useMemo(() => sales.filter(s => { const d = new Date(s.date); const now = new Date(`${today}T00:00:00`); const diff = Math.floor((now.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000); return diff >= 0 && diff < 7; }), [sales, today]);
  const monthSales = useMemo(() => sales.filter(s => s.date.startsWith(currentMonth)), [sales, currentMonth]);
  const total = (xs: Sale[]) => xs.reduce((a, s) => a + s.amount, 0);
  const totalUnits = monthSales.reduce((a, s) => a + s.quantity, 0);
  const lowStock = products.filter(p => p.stock <= p.lowStock);
  const filtered = sales.filter(s => { const p = productMap.get(s.productId); return (!query || `${p?.name} ${p?.sku} ${s.note}`.toLowerCase().includes(query.toLowerCase())) && (!date || s.date.startsWith(date)); });
  const trend = ["08 Sep", "09 Sep", "10 Sep", "11 Sep", "12 Sep"].map(label => ({ name: label, jualan: total(sales.filter(s => dateLabel(s.date).startsWith(label))) }));
  const topProducts = products.map(p => ({ ...p, sold: monthSales.filter(s => s.productId === p.id).reduce((a, s) => a + s.quantity, 0) })).sort((a, b) => b.sold - a.sold).slice(0, 4);
  const estimatedProfit = monthSales.reduce((sum, s) => { const p = productMap.get(s.productId); return sum + s.amount - (p?.cost ?? 0) * s.quantity; }, 0);

  function openNewSale() { setEditing(null); setForm({ date: localDateTime(), productId: products[0]?.id ?? 1, quantity: 1, payment: "Tunai", note: "" }); setOpenForm(true); }
  function saveSale() {
    const product = productMap.get(form.productId); if (!product || !form.date || form.quantity <= 0 || form.quantity > product.stock) return;
    const amount = product.price * form.quantity;
    if (editing) { const old = sales.find(s => s.id === editing.id); if (old) setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: p.stock + old.quantity - form.quantity } : p)); setSales(prev => prev.map(s => s.id === editing.id ? { ...s, ...form, amount } : s)); }
    else { setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: p.stock - form.quantity } : p)); setSales(prev => [{ ...form, amount, id: Date.now() }, ...prev]); }
    setOpenForm(false); setEditing(null);
  }
  function editSale(s: Sale) { setEditing(s); setForm({ date: s.date, productId: s.productId, quantity: s.quantity, payment: s.payment, note: s.note }); setOpenForm(true); }
  function removeSale(id: number) { const sale = sales.find(s => s.id === id); if (!sale) return; if (confirm("Padam rekod jualan ini? Stok akan dipulangkan.")) { setProducts(prev => prev.map(p => p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p)); setSales(prev => prev.filter(s => s.id !== id)); } }
  function addProduct() { if (!productForm.name.trim() || !productForm.sku.trim() || productForm.price <= 0) return; setProducts(prev => [...prev, { ...productForm, id: Date.now() }]); setProductForm({ name: "", sku: "", price: 0, cost: 0, stock: 0, lowStock: 5 }); setOpenProduct(false); }
  function exportCsv() { const rows = [["Tarikh & Masa", "Produk", "SKU", "Qty", "Jumlah (RM)", "Kaedah Pembayaran", "Nota"], ...filtered.map(s => { const p = productMap.get(s.productId); return [s.date, p?.name ?? "", p?.sku ?? "", s.quantity, s.amount.toFixed(2), s.payment, s.note]; })]; const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); a.download = "squishy-sales.csv"; a.click(); }

  const displayDate = currentDateTime ? new Date(currentDateTime).toLocaleString("ms-MY", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Memuatkan waktu sistem...";

  return <main className="app">
    <aside className="sidebar"><div className="brand"><div className="brandIcon"><Sparkles size={22}/></div><div><b>Squishy</b><span>Sales Studio</span></div></div><nav><a className="active"><LayoutDashboard size={18}/> Dashboard</a><a onClick={openNewSale}><Plus size={18}/> POS / Jualan</a><a onClick={() => setOpenProduct(true)}><Package size={18}/> Produk & Stok</a><a><BarChart3 size={18}/> Laporan</a></nav><div className="sideBottom"><span className="statusDot"/> Live sales tracker</div></aside>
    <section className="content"><header><div className="mobileTitle"><button className="iconBtn"><Menu/></button><b>Squishy</b></div><div className="welcome"><p>Hi! Jom tengok prestasi hari ini ✨</p><h1>Sales Dashboard</h1></div><button className="primary" onClick={openNewSale}><Plus size={18}/> Rekod Jualan</button></header>
      <div className="hero"><div><span className="heroBadge"><Sparkles size={13}/> SQUISHY POS</span><h2>Keep selling, keep squishing! 🫧</h2><p>Urus jualan, produk dan stok Squishy dalam satu dashboard yang simple dan fun.</p></div><div className="heroBubble bubbleOne">🧸</div><div className="heroBubble bubbleTwo">💖</div><div className="heroBubble bubbleThree">✨</div></div>
      <div className="toolbar"><div className="datePill"><CalendarDays size={17}/> {displayDate} <span>•</span> Waktu sistem</div><div style={{display:"flex",gap:8}}><button className="outline" onClick={() => setOpenProduct(true)}><Package size={16}/> Produk</button><button className="outline" onClick={exportCsv}><Download size={17}/> Eksport</button></div></div>
      <section className="kpis"><Kpi title="Jualan Hari Ini" value={total(todaySales)} icon={<Wallet/>} accent="green"/><Kpi title="Jualan Minggu Ini" value={total(weekSales)} icon={<BarChart3/>} accent="blue"/><Kpi title="Jualan Bulan Ini" value={total(monthSales)} icon={<Receipt/>} accent="purple"/><Kpi title="Unit Terjual" value={totalUnits} icon={<ShoppingBag/>} accent="orange" plain/></section>
      <section className="charts"><div className="panel trend"><div className="panelHead"><div><h2>Jualan Naik ✨</h2><p>Trend jualan beberapa hari terakhir</p></div><span className="selectMini">Bulan semasa</span></div><ResponsiveContainer width="100%" height={250}><LineChart data={trend}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis tickFormatter={v => `RM${v}`}/><Tooltip formatter={(v) => [money(Number(v)), "Jualan"]}/><Line type="monotone" dataKey="jualan" stroke="#8a68ff" strokeWidth={4} dot={{r:5,fill:"#ff5f96",strokeWidth:2}}/></LineChart></ResponsiveContainer></div><div className="panel"><div className="panelHead"><div><h2>Top Selling 🏆</h2><p>Produk paling banyak terjual</p></div></div><div className="topProducts">{topProducts.map((p, i) => <div className="topProduct" key={p.id}><span className="rank">#{i + 1}</span><div><b>{p.name}</b><small>{p.sku} • {p.stock} stok</small></div><strong>{p.sold} pcs</strong></div>)}</div></div></section>
      <section className="insights"><div className="panel insight"><div className="kpiIcon purple"><CreditCard/></div><div><span>Anggaran Untung Bulan Ini</span><strong>{money(estimatedProfit)}</strong></div></div><div className="panel insight lowStockInsight"><div className="kpiIcon orange"><Package/></div><div><span>Low Stock Alert • {lowStock.length} produk</span>{lowStock.length ? <div className="lowStockNames">{lowStock.map(p => <span key={p.id}>{p.name} ({p.stock})</span>)}</div> : <strong>Semua stok OK ✓</strong>}</div></div><div className="panel insight"><div className="kpiIcon blue"><ShoppingBag/></div><div><span>Produk Aktif</span><strong>{products.length}</strong></div></div></section>
      <section className="panel tablePanel"><div className="panelHead tableHead"><div><h2>Transaksi Terkini</h2><p>{filtered.length} rekod dipaparkan</p></div><div className="filters"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari produk / SKU..."/></div><input className="dateFilter" type="date" value={date} onChange={e => setDate(e.target.value)}/></div></div><div className="tableWrap"><table><thead><tr><th>Tarikh & Masa</th><th>Produk</th><th>Qty</th><th>Jumlah</th><th>Pembayaran</th><th>Nota</th><th></th></tr></thead><tbody>{filtered.map(s => { const p = productMap.get(s.productId); return <tr key={s.id}><td>{dateLabel(s.date)}</td><td><span className="categoryTag">{p?.name ?? "Unknown"}</span><small className="skuText">{p?.sku}</small></td><td>{s.quantity}</td><td className="amount">{money(s.amount)}</td><td><span className={`payment ${s.payment === "Tunai" ? "cash" : s.payment === "Kad" ? "card" : "qr"}`}>{s.payment}</span></td><td className="muted">{s.note || "—"}</td><td><button className="textBtn" onClick={() => editSale(s)}>Edit</button><button className="deleteBtn" onClick={() => removeSale(s.id)}><Trash2 size={15}/></button></td></tr>})}</tbody></table></div></section>
    </section>
    {openForm && <div className="modalBack"><div className="modal"><div className="modalHead"><div><h2>{editing ? "Edit Jualan ✨" : "Rekod Jualan Baru ✨"}</h2><p>Tarikh & masa diambil automatik daripada waktu sistem.</p></div><button className="iconBtn" onClick={() => setOpenForm(false)}><X/></button></div><div className="formGrid"><label>Tarikh & Masa<input type="datetime-local" value={form.date} onChange={e => setForm({...form, date:e.target.value})}/></label><label>Produk<select value={form.productId} onChange={e => setForm({...form, productId:Number(e.target.value), quantity:1})}>{products.map(p => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}</select></label><label>Kuantiti<input type="number" min="1" max={productMap.get(form.productId)?.stock ?? 1} step="1" value={form.quantity} onChange={e => setForm({...form, quantity:Number(e.target.value)})}/><small className="stockHint">Stok tersedia: {productMap.get(form.productId)?.stock ?? 0}</small></label><label>Kaedah Pembayaran<select value={form.payment} onChange={e => setForm({...form, payment:e.target.value as Payment})}><option>Tunai</option><option>QR / Online Transfer</option><option>Kad</option></select></label><label className="full">Nota / Catatan<textarea rows={3} value={form.note} onChange={e => setForm({...form, note:e.target.value})} placeholder="Contoh: repeat customer, promo..."/></label></div><div className="saleTotal">Jumlah: <b>{money((productMap.get(form.productId)?.price ?? 0) * form.quantity)}</b></div><div className="modalActions"><button className="outline" onClick={() => setOpenForm(false)}>Batal</button><button className="primary" onClick={saveSale}>{editing ? "Simpan Perubahan" : "Simpan Jualan"}</button></div></div></div>}
    {openProduct && <div className="modalBack"><div className="modal"><div className="modalHead"><div><h2>Tambah Produk 🧸</h2><p>Masukkan produk Squishy dan stok permulaan</p></div><button className="iconBtn" onClick={() => setOpenProduct(false)}><X/></button></div><div className="formGrid"><label>Nama Produk<input value={productForm.name} onChange={e => setProductForm({...productForm,name:e.target.value})} placeholder="Contoh: Squishy Panda"/></label><label>SKU<input value={productForm.sku} onChange={e => setProductForm({...productForm,sku:e.target.value.toUpperCase()})} placeholder="SQ-PANDA"/></label><label>Harga Jual (RM)<input type="number" min="0" step="0.01" value={productForm.price || ""} onChange={e => setProductForm({...productForm,price:Number(e.target.value)})}/></label><label>Kos Produk (RM)<input type="number" min="0" step="0.01" value={productForm.cost || ""} onChange={e => setProductForm({...productForm,cost:Number(e.target.value)})}/></label><label>Stok Awal<input type="number" min="0" step="1" value={productForm.stock} onChange={e => setProductForm({...productForm,stock:Number(e.target.value)})}/></label><label>Alert Bila Stok ≤<input type="number" min="0" step="1" value={productForm.lowStock} onChange={e => setProductForm({...productForm,lowStock:Number(e.target.value)})}/></label></div><div className="modalActions"><button className="outline" onClick={() => setOpenProduct(false)}>Batal</button><button className="primary" onClick={addProduct}><Plus size={16}/> Tambah Produk</button></div></div></div>}
  </main>
}

function Kpi({title,value,icon,accent,plain=false}:{title:string,value:number,icon:React.ReactNode,accent:string,plain?:boolean}) { return <div className="kpi"><div className={`kpiIcon ${accent}`}>{icon}</div><div><span>{title}</span><strong>{plain ? value.toLocaleString("en-MY") : money(value)}</strong></div></div> }
