"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, CreditCard, Download, LayoutDashboard, Menu, Package, Plus, Receipt, Search, ShoppingBag, Sparkles, Trash2, Wallet, X, ArrowDownToLine, AlertTriangle, Boxes, Minus, CheckCircle2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Payment = "Tunai" | "QR / Online Transfer" | "Kad";
type View = "dashboard" | "pos" | "products" | "reports";
type Product = { id: number; name: string; sku: string; price: number; cost: number; stock: number; lowStock: number };
type Sale = { id: number; date: string; productId: number; quantity: number; amount: number; payment: Payment; note: string };
type StockMovement = { id: number; productId: number; quantity: number; date: string; note: string };
type CartItem = { productId: number; quantity: number };

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [sales, setSales] = useState<Sale[]>(seedSales);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [view, setView] = useState<View>("dashboard");
  const [openSale, setOpenSale] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  const [openStockIn, setOpenStockIn] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [salePayment, setSalePayment] = useState<Payment>("Tunai");
  const [saleNote, setSaleNote] = useState("");
  const [productForm, setProductForm] = useState({ name: "", sku: "", price: 0, cost: 0, stock: 0, lowStock: 5 });
  const [stockForm, setStockForm] = useState({ quantity: 1, note: "Restock" });

  useEffect(() => { const tick = () => setCurrentDateTime(localDateTime()); tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, []);

  const today = currentDateTime ? currentDateTime.slice(0, 10) : "2026-09-12";
  const currentMonth = currentDateTime ? currentDateTime.slice(0, 7) : "2026-09";
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const todaySales = useMemo(() => sales.filter(s => s.date.startsWith(today)), [sales, today]);
  const weekSales = useMemo(() => sales.filter(s => { const d = new Date(s.date); const now = new Date(`${today}T00:00:00`); const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const diff = Math.floor((now.getTime() - day.getTime()) / 86400000); return diff >= 0 && diff < 7; }), [sales, today]);
  const monthSales = useMemo(() => sales.filter(s => s.date.startsWith(currentMonth)), [sales, currentMonth]);
  const total = (xs: Sale[]) => xs.reduce((a, s) => a + s.amount, 0);
  const totalUnits = monthSales.reduce((a, s) => a + s.quantity, 0);
  const lowStock = products.filter(p => p.stock <= p.lowStock);
  const filtered = sales.filter(s => { const p = productMap.get(s.productId); return (!query || `${p?.name} ${p?.sku} ${s.note}`.toLowerCase().includes(query.toLowerCase())) && (!date || s.date.startsWith(date)); });
  const filteredProducts = products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(productQuery.toLowerCase()));
  const trend = Array.from({ length: 7 }, (_, i) => { const d = new Date(`${today}T00:00:00`); d.setDate(d.getDate() - (6 - i)); const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; return { name: d.toLocaleDateString("ms-MY", { day: "2-digit", month: "short" }), jualan: total(sales.filter(s => s.date.startsWith(iso))) }; });
  const topProducts = products.map(p => ({ ...p, sold: monthSales.filter(s => s.productId === p.id).reduce((a, s) => a + s.quantity, 0) })).sort((a, b) => b.sold - a.sold).slice(0, 4);
  const estimatedProfit = monthSales.reduce((sum, s) => { const p = productMap.get(s.productId); return sum + s.amount - (p?.cost ?? 0) * s.quantity; }, 0);
  const stockValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const potentialSalesValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (productMap.get(item.productId)?.price ?? 0) * item.quantity, 0);
  const cartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  function go(next: View) { setView(next); }
  function openNewSale() { setEditing(null); setCart([]); setSalePayment("Tunai"); setSaleNote(""); setOpenSale(true); }
  function addToCart(productId: number) { const p = productMap.get(productId); if (!p || p.stock <= 0) return; setCart(prev => { const existing = prev.find(x => x.productId === productId); if (existing) { if (existing.quantity >= p.stock) return prev; return prev.map(x => x.productId === productId ? { ...x, quantity: x.quantity + 1 } : x); } return [...prev, { productId, quantity: 1 }]; }); }
  function changeCartQty(productId: number, delta: number) { const p = productMap.get(productId); if (!p) return; setCart(prev => prev.map(x => x.productId === productId ? { ...x, quantity: Math.min(p.stock, Math.max(0, x.quantity + delta)) } : x).filter(x => x.quantity > 0)); }
  function removeCartItem(productId: number) { setCart(prev => prev.filter(x => x.productId !== productId)); }
  function editSale(s: Sale) { setEditing(s); setCart([{ productId: s.productId, quantity: s.quantity }]); setSalePayment(s.payment); setSaleNote(s.note); setOpenSale(true); }
  function saveSale() {
    if (!cart.length) return;
    const old = editing ? sales.find(s => s.id === editing.id) : null;
    const availableFor = (p: Product, requested: number) => p.stock + (old?.productId === p.id ? old.quantity : 0);
    for (const item of cart) { const p = productMap.get(item.productId); if (!p || item.quantity <= 0 || item.quantity > availableFor(p, item.quantity)) return; }
    if (old) {
      setProducts(prev => prev.map(p => { const oldQty = old.productId === p.id ? old.quantity : 0; const newQty = cart.find(x => x.productId === p.id)?.quantity ?? 0; return { ...p, stock: p.stock + oldQty - newQty }; }));
      setSales(prev => { const first = cart[0]; const amount = cart.reduce((sum, x) => sum + (productMap.get(x.productId)?.price ?? 0) * x.quantity, 0); return prev.map(s => s.id === old.id ? { ...s, productId: first.productId, quantity: cartUnits, amount, payment: salePayment, note: saleNote } : s); });
    } else {
      setProducts(prev => prev.map(p => { const item = cart.find(x => x.productId === p.id); return item ? { ...p, stock: p.stock - item.quantity } : p; }));
      const stamp = localDateTime();
      setSales(prev => cart.map(item => { const p = productMap.get(item.productId)!; return { id: Date.now() + item.productId, date: stamp, productId: item.productId, quantity: item.quantity, amount: p.price * item.quantity, payment: salePayment, note: saleNote }; }).concat(prev));
    }
    setOpenSale(false); setEditing(null); setCart([]);
  }
  function removeSale(id: number) { const sale = sales.find(s => s.id === id); if (!sale) return; if (confirm("Padam rekod jualan ini? Stok akan dipulangkan.")) { setProducts(prev => prev.map(p => p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p)); setSales(prev => prev.filter(s => s.id !== id)); } }
  function addProduct() { if (!productForm.name.trim() || !productForm.sku.trim() || productForm.price <= 0) return; setProducts(prev => [...prev, { ...productForm, id: Date.now() }]); setProductForm({ name: "", sku: "", price: 0, cost: 0, stock: 0, lowStock: 5 }); setOpenProduct(false); }
  function openRestock(p: Product) { setStockProduct(p); setStockForm({ quantity: 1, note: "Restock" }); setOpenStockIn(true); }
  function addStock() { if (!stockProduct || stockForm.quantity <= 0) return; setProducts(prev => prev.map(p => p.id === stockProduct.id ? { ...p, stock: p.stock + stockForm.quantity } : p)); setMovements(prev => [{ id: Date.now(), productId: stockProduct.id, quantity: stockForm.quantity, date: localDateTime(), note: stockForm.note }, ...prev]); setOpenStockIn(false); setStockProduct(null); }
  function exportCsv() { const rows = [["Tarikh & Masa", "Produk", "SKU", "Qty", "Jumlah (RM)", "Kaedah Pembayaran", "Nota"], ...filtered.map(s => { const p = productMap.get(s.productId); return [s.date, p?.name ?? "", p?.sku ?? "", s.quantity, s.amount.toFixed(2), s.payment, s.note]; })]; const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); a.download = "squishy-sales.csv"; a.click(); }
  const displayDate = currentDateTime ? new Date(currentDateTime).toLocaleString("ms-MY", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Memuatkan waktu sistem...";

  return <main className="app">
    <aside className="sidebar"><div className="brand"><div className="brandIcon"><Sparkles size={22}/></div><div><b>Squishy</b><span>Sales Studio</span></div></div><nav>
      <a className={view === "dashboard" ? "active" : ""} onClick={() => go("dashboard")}><LayoutDashboard size={18}/> Dashboard</a>
      <a className={view === "pos" ? "active" : ""} onClick={() => { go("pos"); openNewSale(); }}><Plus size={18}/> POS / Jualan</a>
      <a className={view === "products" ? "active" : ""} onClick={() => go("products")}><Package size={18}/> Produk & Stok</a>
      <a className={view === "reports" ? "active" : ""} onClick={() => go("reports")}><BarChart3 size={18}/> Laporan</a>
    </nav><div className="sideBottom"><span className="statusDot"/> Live sales tracker</div></aside>

    <section className="content"><header><div className="mobileTitle"><button className="iconBtn"><Menu/></button><b>Squishy</b></div><div className="welcome"><p>Hi! Jom tengok prestasi hari ini ✨</p><h1>{view === "dashboard" ? "Sales Dashboard" : view === "products" ? "Produk & Stok" : view === "reports" ? "Laporan Jualan" : "POS / Jualan"}</h1></div><button className="primary" onClick={openNewSale}><Plus size={18}/> Rekod Jualan</button></header>

      {view === "dashboard" && <>
        <div className="hero"><div><span className="heroBadge"><Sparkles size={13}/> SQUISHY POS</span><h2>Keep selling, keep squishing! 🫧</h2><p>Urus jualan, produk dan stok Squishy dalam satu dashboard yang simple dan fun.</p></div><div className="heroBubble bubbleOne">🧸</div><div className="heroBubble bubbleTwo">💖</div><div className="heroBubble bubbleThree">✨</div></div>
        <div className="toolbar"><div className="datePill"><CalendarDays size={17}/> {displayDate} <span>•</span> Waktu sistem</div><div style={{display:"flex",gap:8}}><button className="outline" onClick={() => go("products")}><Package size={16}/> Produk & Stok</button><button className="outline" onClick={exportCsv}><Download size={17}/> Eksport</button></div></div>
        <section className="kpis"><Kpi title="Jualan Hari Ini" value={total(todaySales)} icon={<Wallet/>} accent="green"/><Kpi title="Jualan Minggu Ini" value={total(weekSales)} icon={<BarChart3/>} accent="blue"/><Kpi title="Jualan Bulan Ini" value={total(monthSales)} icon={<Receipt/>} accent="purple"/><Kpi title="Unit Terjual" value={totalUnits} icon={<ShoppingBag/>} accent="orange" plain/></section>
        <section className="charts"><div className="panel trend"><div className="panelHead"><div><h2>Jualan Naik ✨</h2><p>7 hari terakhir</p></div><span className="selectMini">Bulan semasa</span></div><ResponsiveContainer width="100%" height={250}><LineChart data={trend}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis tickFormatter={v => `RM${v}`}/><Tooltip formatter={(v) => [money(Number(v)), "Jualan"]}/><Line type="monotone" dataKey="jualan" stroke="#8a68ff" strokeWidth={4} dot={{r:5,fill:"#ff5f96",strokeWidth:2}}/></LineChart></ResponsiveContainer></div><div className="panel"><div className="panelHead"><div><h2>Top Selling 🏆</h2><p>Produk paling banyak terjual</p></div></div><div className="topProducts">{topProducts.map((p, i) => <div className="topProduct" key={p.id}><span className="rank">#{i + 1}</span><div><b>{p.name}</b><small>{p.sku} • {p.stock} stok</small></div><strong>{p.sold} pcs</strong></div>)}</div></div></section>
        <section className="insights"><div className="panel insight"><div className="kpiIcon purple"><CreditCard/></div><div><span>Anggaran Untung Bulan Ini</span><strong>{money(estimatedProfit)}</strong></div></div><div className="panel insight lowStockInsight"><div className="kpiIcon orange"><Package/></div><div><span>Low Stock Alert • {lowStock.length} produk</span>{lowStock.length ? <div className="lowStockNames">{lowStock.map(p => <span key={p.id}>{p.name} ({p.stock})</span>)}</div> : <strong>Semua stok OK ✓</strong>}</div></div><div className="panel insight"><div className="kpiIcon blue"><ShoppingBag/></div><div><span>Produk Aktif</span><strong>{products.length}</strong></div></div></section>
        <TransactionTable filtered={filtered} productMap={productMap} query={query} setQuery={setQuery} date={date} setDate={setDate} editSale={editSale} removeSale={removeSale}/>
      </>}

      {view === "products" && <ProductPage products={products} lowStock={lowStock} filteredProducts={filteredProducts} productQuery={productQuery} setProductQuery={setProductQuery} openRestock={openRestock} setOpenProduct={setOpenProduct} stockValue={stockValue} potentialSalesValue={potentialSalesValue}/>} 
      {view === "pos" && <PosPage products={products} lowStock={lowStock} addToCart={addToCart} cartUnits={cartUnits} cartTotal={cartTotal} openNewSale={openNewSale}/>} 
      {view === "reports" && <ReportPage sales={sales} monthSales={monthSales} productMap={productMap} totalUnits={totalUnits} estimatedProfit={estimatedProfit} exportCsv={exportCsv}/>} 
    </section>

    {openSale && <div className="modalBack"><div className="modal posModal"><div className="modalHead"><div><h2>{editing ? "Edit Jualan ✨" : "POS — Pelbagai Produk 🛒"}</h2><p>{editing ? "Edit transaksi jualan." : "Pilih satu atau lebih produk dalam satu pembelian."}</p></div><button className="iconBtn" onClick={() => setOpenSale(false)}><X/></button></div>
      <div className="posCheckout"><div className="posProducts"><div className="posSearch"><Search size={16}/><input value={productQuery} onChange={e => setProductQuery(e.target.value)} placeholder="Cari produk / SKU..."/></div><div className="posProductGrid">{filteredProducts.map(p => <button className={`posProduct ${p.stock <= p.lowStock ? "low" : ""}`} key={p.id} onClick={() => addToCart(p.id)} disabled={p.stock <= 0}><span className="posEmoji">🫧</span><b>{p.name}</b><small>{p.sku}</small><strong>{money(p.price)}</strong><em>{p.stock} stok</em></button>)}</div></div>
      <div className="cartPanel"><div className="cartHeader"><div><h3>Cart</h3><span>{cartUnits} unit • {cart.length} produk</span></div><ShoppingBag size={20}/></div><div className="cartItems">{cart.length ? cart.map(item => { const p = productMap.get(item.productId); if (!p) return null; return <div className="cartItem" key={item.productId}><div className="cartItemInfo"><b>{p.name}</b><small>{money(p.price)} × {item.quantity}</small></div><div className="qty"><button onClick={() => changeCartQty(p.id,-1)}><Minus size={13}/></button><b>{item.quantity}</b><button onClick={() => changeCartQty(p.id,1)}><Plus size={13}/></button></div><strong>{money(p.price * item.quantity)}</strong><button className="deleteBtn" onClick={() => removeCartItem(p.id)}><Trash2 size={14}/></button></div>}) : <div className="cartEmpty"><ShoppingBag size={28}/><p>Cart kosong</p><small>Klik produk untuk masukkan ke cart.</small></div>}</div>
        <div className="cartBottom"><label>Pembayaran<select value={salePayment} onChange={e => setSalePayment(e.target.value as Payment)}><option>Tunai</option><option>QR / Online Transfer</option><option>Kad</option></select></label><label>Nota<input value={saleNote} onChange={e => setSaleNote(e.target.value)} placeholder="Contoh: Promo / repeat customer"/></label><div className="cartGrand"><span>Total</span><b>{money(cartTotal)}</b></div><button className="primary checkoutBtn" disabled={!cart.length} onClick={saveSale}><CheckCircle2 size={18}/> {editing ? "Simpan Perubahan" : "Complete Sale"}</button></div>
      </div></div></div></div>}

    {openProduct && <div className="modalBack"><div className="modal"><div className="modalHead"><div><h2>Tambah Produk 📦</h2><p>Masukkan maklumat produk dan stok awal.</p></div><button className="iconBtn" onClick={() => setOpenProduct(false)}><X/></button></div><div className="formGrid"><label>Nama Produk<input value={productForm.name} onChange={e => setProductForm({...productForm,name:e.target.value})} placeholder="Squishy Bunny"/></label><label>SKU<input value={productForm.sku} onChange={e => setProductForm({...productForm,sku:e.target.value.toUpperCase()})} placeholder="SQ-BUNNY"/></label><label>Harga Jual (RM)<input type="number" min="0" value={productForm.price || ""} onChange={e => setProductForm({...productForm,price:Number(e.target.value)})}/></label><label>Kos (RM)<input type="number" min="0" value={productForm.cost || ""} onChange={e => setProductForm({...productForm,cost:Number(e.target.value)})}/></label><label>Stok Awal<input type="number" min="0" value={productForm.stock} onChange={e => setProductForm({...productForm,stock:Number(e.target.value)})}/></label><label>Low Stock Threshold<input type="number" min="0" value={productForm.lowStock} onChange={e => setProductForm({...productForm,lowStock:Number(e.target.value)})}/></label></div><div className="modalActions"><button className="outline" onClick={() => setOpenProduct(false)}>Batal</button><button className="primary" onClick={addProduct}>Tambah Produk</button></div></div></div>}

    {openStockIn && stockProduct && <div className="modalBack"><div className="modal"><div className="modalHead"><div><h2>Stock In 📦</h2><p>{stockProduct.name} • {stockProduct.sku} • stok semasa {stockProduct.stock}</p></div><button className="iconBtn" onClick={() => setOpenStockIn(false)}><X/></button></div><div className="formGrid"><label>Jumlah Masuk<input type="number" min="1" value={stockForm.quantity} onChange={e => setStockForm({...stockForm,quantity:Number(e.target.value)})}/></label><label>Stok Selepas Stock In<input value={stockProduct.stock + stockForm.quantity} readOnly/></label><label className="full">Nota<input value={stockForm.note} onChange={e => setStockForm({...stockForm,note:e.target.value})}/></label></div><div className="modalActions"><button className="outline" onClick={() => setOpenStockIn(false)}>Batal</button><button className="primary" onClick={addStock}><ArrowDownToLine size={17}/> Tambah Stok</button></div></div></div>}
  </main>;
}

function Kpi({ title, value, icon, accent, plain }: { title: string; value: number; icon: React.ReactNode; accent: string; plain?: boolean }) { return <div className="kpi"><div className={`kpiIcon ${accent}`}>{icon}</div><div><span>{title}</span><strong>{plain ? value.toLocaleString("en-MY") : money(value)}</strong></div></div>; }

function TransactionTable({ filtered, productMap, query, setQuery, date, setDate, editSale, removeSale }: any) { return <section className="panel tablePanel"><div className="panelHead tableHead"><div><h2>Transaksi Terkini</h2><p>{filtered.length} rekod dipaparkan</p></div><div className="filters"><div className="search"><Search size={16}/><input value={query} onChange={(e:any) => setQuery(e.target.value)} placeholder="Cari produk / SKU..."/></div><input className="dateFilter" type="date" value={date} onChange={(e:any) => setDate(e.target.value)}/></div></div><div className="tableWrap"><table><thead><tr><th>Tarikh & Masa</th><th>Produk</th><th>Qty</th><th>Jumlah</th><th>Pembayaran</th><th>Nota</th><th></th></tr></thead><tbody>{filtered.map((s:any) => { const p = productMap.get(s.productId); return <tr key={s.id}><td>{dateLabel(s.date)}</td><td><span className="categoryTag">{p?.name ?? "Unknown"}</span><small className="skuText">{p?.sku}</small></td><td>{s.quantity}</td><td className="amount">{money(s.amount)}</td><td><span className={`payment ${s.payment === "Tunai" ? "cash" : s.payment === "Kad" ? "card" : "qr"}`}>{s.payment}</span></td><td className="muted">{s.note || "—"}</td><td><button className="textBtn" onClick={() => editSale(s)}>Edit</button><button className="deleteBtn" onClick={() => removeSale(s.id)}><Trash2 size={15}/></button></td></tr>})}</tbody></table></div></section>; }

function ProductPage({ products, lowStock, filteredProducts, productQuery, setProductQuery, openRestock, setOpenProduct, stockValue, potentialSalesValue }: any) { return <>
  <div className="toolbar"><div className="datePill"><Boxes size={17}/> {products.length} produk aktif • {lowStock.length} low stock</div><button className="primary" onClick={() => setOpenProduct(true)}><Plus size={17}/> Tambah Produk</button></div>
  <section className="productStats"><div className="panel miniStat"><div className="kpiIcon blue"><Boxes/></div><div><span>Total SKU</span><strong>{products.length}</strong></div></div><div className="panel miniStat"><div className="kpiIcon orange"><AlertTriangle/></div><div><span>Perlu Restock</span><strong>{lowStock.length}</strong></div></div><div className="panel miniStat"><div className="kpiIcon purple"><Wallet/></div><div><span>Nilai Kos Stok</span><strong>{money(stockValue)}</strong></div></div><div className="panel miniStat"><div className="kpiIcon green"><ShoppingBag/></div><div><span>Potensi Jualan</span><strong>{money(potentialSalesValue)}</strong></div></div></section>
  {lowStock.length > 0 && <div className="stockAlert"><AlertTriangle size={19}/><div><b>Low Stock Alert</b><span>{lowStock.map((p:any) => `${p.name} (${p.stock} unit)`).join(" • ")}</span></div></div>}
  <section className="productSection"><div className="productToolbar"><div><h2>Senarai Produk</h2><p>Urus harga, SKU dan stok dengan mudah.</p></div><div className="search"><Search size={16}/><input value={productQuery} onChange={(e:any) => setProductQuery(e.target.value)} placeholder="Cari produk / SKU..."/></div></div><div className="productGrid">{filteredProducts.map((p:any) => { const low = p.stock <= p.lowStock; return <div className={`productCard ${low ? "isLow" : ""}`} key={p.id}><div className="productVisual">🫧</div><div className="productBody"><div className="productTitle"><div><h3>{p.name}</h3><span>{p.sku}</span></div>{low ? <span className="lowBadge">LOW STOCK</span> : <span className="okBadge">OK</span>}</div><div className="productPrice">{money(p.price)} <small>harga jual</small></div><div className="productMeta"><span>Kos <b>{money(p.cost)}</b></span><span>Margin <b>{money(p.price - p.cost)}</b></span></div><div className="stockBarHead"><span>Stok</span><b>{p.stock} unit</b></div><div className="stockBar"><i style={{width:`${Math.min(100, Math.max(4, (p.stock / Math.max(p.lowStock * 5, 1)) * 100))}%`}}/></div><button className="stockInBtn" onClick={() => openRestock(p)}><ArrowDownToLine size={16}/> Stock In</button></div></div>})}</div></section>
</>; }

function PosPage({ products, lowStock, addToCart, cartUnits, cartTotal, openNewSale }: any) { return <div className="posLanding"><div className="panel posIntro"><div><span className="heroBadge">QUICK CHECKOUT</span><h2>POS Pelbagai Produk 🛒</h2><p>Pelanggan boleh pilih banyak produk dalam satu pembelian. Quantity dan stok akan dikawal automatik.</p><button className="primary" onClick={openNewSale}><ShoppingBag size={18}/> Buka POS</button></div><div className="posSummary"><b>{products.length}</b><span>Produk</span><b>{products.reduce((a:any,p:any)=>a+p.stock,0)}</b><span>Unit stok</span><b>{lowStock.length}</b><span>Low stock</span></div></div><div className="posQuickGrid">{products.map((p:any)=><button key={p.id} className="quickProduct" onClick={() => { addToCart(p.id); openNewSale(); }}><span>🫧</span><b>{p.name}</b><small>{money(p.price)} • {p.stock} stok</small></button>)}</div></div>; }

function ReportPage({ sales, monthSales, productMap, totalUnits, estimatedProfit, exportCsv }: any) { const byPayment = ["Tunai", "QR / Online Transfer", "Kad"].map(payment => ({ payment, total: monthSales.filter((s:any) => s.payment === payment).reduce((a:number,s:any)=>a+s.amount,0) })); return <>
  <div className="toolbar"><div className="datePill"><BarChart3 size={17}/> Ringkasan bulan semasa</div><button className="outline" onClick={exportCsv}><Download size={17}/> Eksport CSV</button></div>
  <section className="kpis"><Kpi title="Jumlah Jualan" value={monthSales.reduce((a:number,s:any)=>a+s.amount,0)} icon={<Receipt/>} accent="purple"/><Kpi title="Unit Terjual" value={totalUnits} icon={<ShoppingBag/>} accent="orange" plain/><Kpi title="Anggaran Untung" value={estimatedProfit} icon={<Wallet/>} accent="green"/><Kpi title="Transaksi" value={monthSales.length} icon={<CreditCard/>} accent="blue" plain/></section>
  <section className="panel reportList"><div className="panelHead"><div><h2>Pembayaran Bulan Ini</h2><p>Pecahan mengikut kaedah pembayaran</p></div></div>{byPayment.map(x => <div className="reportRow" key={x.payment}><span>{x.payment}</span><b>{money(x.total)}</b></div>)}</section>
  <section className="panel tablePanel"><div className="panelHead tableHead"><div><h2>Semua Transaksi</h2><p>{sales.length} rekod</p></div></div><div className="tableWrap"><table><thead><tr><th>Tarikh</th><th>Produk</th><th>Qty</th><th>Jumlah</th><th>Pembayaran</th></tr></thead><tbody>{sales.map((s:any) => { const p=productMap.get(s.productId); return <tr key={s.id}><td>{dateLabel(s.date)}</td><td>{p?.name}</td><td>{s.quantity}</td><td className="amount">{money(s.amount)}</td><td>{s.payment}</td></tr>})}</tbody></table></div></section>
</>; }
