"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, LayoutDashboard, Package, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
import DashboardView from './DashboardView';
import InventoryView from './InventoryView';
import PosView from './PosView';
import ReportsView from './ReportsView';
import ReceiptModal from './ReceiptModal';
import { AddProductModal, EditProductModal, StockInModal } from './InventoryModals';
import { exportTransactionsCsv, posApi, posToolsApi } from '@/lib/pos-client';
import type { CartItem, Payment, Product, Transaction, View } from '@/lib/pos-types';

type DiscountType = 'percent' | 'fixed';
type ProductFormValue = { name: string; sku: string; price: number; cost: number; stock: number; lowStock: number };
type CashSummary = { received: number; change: number } | null;

export default function PosApp() {
  const [view, setView] = useState<View>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<Payment>('Tunai');
  const [note, setNote] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [receiptCash, setReceiptCash] = useState<CashSummary>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState<Product | null>(null);
  const [editProductValue, setEditProductValue] = useState<ProductFormValue>({ name: '', sku: '', price: 0, cost: 0, stock: 0, lowStock: 5 });
  const [stockOpen, setStockOpen] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState(1);
  const [stockNote, setStockNote] = useState('Restock');
  const [newProduct, setNewProduct] = useState<ProductFormValue>({ name: '', sku: '', price: 0, cost: 0, stock: 0, lowStock: 5 });

  const loadData = useCallback(async () => {
    try {
      setError('');
      const data = await posApi();
      setProducts((data.products || []).map((p: Product) => ({ ...p, id: Number(p.id), price: Number(p.price), cost: Number(p.cost), stock: Number(p.stock), lowStock: Number(p.lowStock) })));
      setTransactions((data.transactions || []).map((t: Transaction) => ({ ...t, total: Number(t.total), items: (t.items || []).map((i) => ({ ...i, productId: Number(i.productId), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })) })));
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuatkan data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const activeProducts = useMemo(() => products.filter((p) => !p.sku.startsWith('ARCHIVED-')), [products]);
  const oldQty = (productId: number) => editing?.items.find((i) => i.productId === productId)?.quantity || 0;
  const available = (productId: number) => (productMap.get(productId)?.stock || 0) + oldQty(productId);
  const subtotal = cart.reduce((sum, item) => sum + (productMap.get(item.productId)?.price || 0) * item.quantity, 0);
  const rawDiscount = discountType === 'percent' ? subtotal * Math.min(Math.max(discountValue, 0), 100) / 100 : Math.max(discountValue, 0);
  const discountAmount = Math.min(rawDiscount, subtotal);
  const total = Math.max(subtotal - discountAmount, 0);

  function resetSale() { setEditing(null); setCart([]); setPayment('Tunai'); setNote(''); setDiscountType('percent'); setDiscountValue(0); setCashReceived(0); }
  function addToCart(productId: number) { const max = available(productId); if (max <= 0) return; setCart((current) => { const found = current.find((i) => i.productId === productId); if (!found) return [...current, { productId, quantity: 1 }]; if (found.quantity >= max) return current; return current.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i); }); }
  function changeQty(productId: number, delta: number) { const max = available(productId); setCart((current) => current.map((i) => i.productId === productId ? { ...i, quantity: Math.min(max, Math.max(0, i.quantity + delta)) } : i).filter((i) => i.quantity > 0)); }

  async function checkout() {
    if (!cart.length || saving) return;
    if (payment === 'Tunai' && cashReceived < total) { setError('Cash received tidak mencukupi untuk jumlah pembayaran.'); return; }
    try {
      setSaving(true); setError('');
      const cashSnapshot = payment === 'Tunai' ? { received: cashReceived, change: Math.max(cashReceived - total, 0) } : null;
      const baseTx = await posApi(editing ? { action: 'update-transaction', receiptNo: editing.id, items: cart, payment, note } : { action: 'checkout', items: cart, payment, note });
      const tx = discountAmount > 0 ? await posToolsApi({ action: 'apply-discount', receiptNo: baseTx.id, discountAmount }) : baseTx;
      await loadData();
      setReceiptCash(cashSnapshot);
      setReceipt(tx);
      resetSale();
    } catch (e) { setError(e instanceof Error ? e.message : 'Checkout gagal.'); }
    finally { setSaving(false); }
  }

  function editTransaction(tx: Transaction) {
    setEditing(tx);
    setCart(tx.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    setPayment(tx.payment); setNote(tx.note || '');
    const gross = tx.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    setDiscountType('fixed'); setDiscountValue(Math.max(gross - tx.total, 0));
    setCashReceived(tx.payment === 'Tunai' ? tx.total : 0);
    setView('pos'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openProductEditor(product: Product) {
    setEditProductOpen(product);
    setEditProductValue({ name: product.name, sku: product.sku, price: product.price, cost: product.cost, stock: product.stock, lowStock: product.lowStock });
  }

  async function saveProductEdit() {
    if (!editProductOpen || !editProductValue.name.trim() || !editProductValue.sku.trim() || editProductValue.price <= 0) return;
    try {
      setSaving(true); setError('');
      await posToolsApi({ action: 'edit-product', productId: editProductOpen.id, ...editProductValue });
      await loadData();
      setEditProductOpen(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal edit produk.'); }
    finally { setSaving(false); }
  }

  async function deleteTransaction(tx: Transaction) { if (!confirm(`Padam transaksi ${tx.id}? Stok akan dipulangkan.`)) return; try { setSaving(true); setError(''); await posApi({ action: 'delete-transaction', receiptNo: tx.id }); await loadData(); } catch (e) { setError(e instanceof Error ? e.message : 'Gagal padam transaksi.'); } finally { setSaving(false); } }
  async function addProduct() { if (!newProduct.name.trim() || !newProduct.sku.trim() || newProduct.price <= 0) return; try { setSaving(true); setError(''); await posApi({ action: 'product', ...newProduct }); await loadData(); setNewProduct({ name: '', sku: '', price: 0, cost: 0, stock: 0, lowStock: 5 }); setAddProductOpen(false); } catch (e) { setError(e instanceof Error ? e.message : 'Gagal tambah produk.'); } finally { setSaving(false); } }
  async function stockIn() { if (!stockOpen || stockQty <= 0) return; try { setSaving(true); setError(''); await posApi({ action: 'stock-in', productId: stockOpen.id, quantity: stockQty, note: stockNote }); await loadData(); setStockOpen(null); setStockQty(1); setStockNote('Restock'); } catch (e) { setError(e instanceof Error ? e.message : 'Stock In gagal.'); } finally { setSaving(false); } }
  async function archiveProduct(product: Product) { if (!confirm(`Archive ${product.name}? Produk akan disembunyikan daripada POS dan baki stok menjadi 0. Sejarah jualan kekal.`)) return; try { setSaving(true); setError(''); await posToolsApi({ action: 'archive-product', productId: product.id }); await loadData(); } catch (e) { setError(e instanceof Error ? e.message : 'Gagal archive produk.'); } finally { setSaving(false); } }

  function closeReceipt() { setReceipt(null); setReceiptCash(null); }
  function newSaleFromReceipt() { closeReceipt(); resetSale(); setView('pos'); }
  const title = view === 'dashboard' ? 'Sales Dashboard' : view === 'pos' ? 'Cash Register' : view === 'inventory' ? 'Inventory' : 'Daily Reports';

  return <main className="posAppShell">
    <aside className="posSidebar"><div className="posBrand"><div className="posBrandMark"><Sparkles size={20} /></div><div><b>Squishy Toy POS</b><span>Play • Sell • Smile</span></div></div><nav><button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}><LayoutDashboard size={18} />Dashboard</button><button className={view === 'pos' ? 'active' : ''} onClick={() => setView('pos')}><ShoppingBag size={18} />Sales / POS</button><button className={view === 'inventory' ? 'active' : ''} onClick={() => setView('inventory')}><Package size={18} />Inventory</button><button className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}><BarChart3 size={18} />Daily Reports</button></nav><div className="posDbStatus"><span className={loading ? 'posDot busy' : 'posDot'} />{loading ? 'Connecting...' : 'Neon PostgreSQL live'}</div></aside>
    <section className="posMainArea">
      <header className="posTopbar"><div><p>Squishy toy store workspace ✨</p><h1>{title}</h1></div><button className="posSecondaryButton" onClick={loadData}><RefreshCw size={16} />Refresh</button></header>
      {error && <div className="posAlert"><span>{error}</span><button onClick={() => setError('')}>×</button></div>}
      {view === 'dashboard' && <DashboardView products={activeProducts} transactions={transactions} onNewSale={() => setView('pos')} />}
      {view === 'pos' && <PosView products={activeProducts} cart={cart} payment={payment} note={note} editing={editing} saving={saving} productQuery={productQuery} discountType={discountType} discountValue={discountValue} cashReceived={cashReceived} onProductQuery={setProductQuery} onAdd={addToCart} onQty={changeQty} onRemove={(id) => setCart((c) => c.filter((i) => i.productId !== id))} onPayment={(value) => { setPayment(value); if (value !== 'Tunai') setCashReceived(0); }} onNote={setNote} onDiscountType={setDiscountType} onDiscountValue={setDiscountValue} onCashReceived={setCashReceived} onCheckout={checkout} onCancelEdit={resetSale} />}
      {view === 'inventory' && <InventoryView products={activeProducts} onAddProduct={() => setAddProductOpen(true)} onEditProduct={openProductEditor} onStockIn={(product) => { setStockOpen(product); setStockQty(1); setStockNote('Restock'); }} onDeleteProduct={archiveProduct} />}
      {view === 'reports' && <ReportsView products={products} transactions={transactions} query={query} dateFilter={dateFilter} onQuery={setQuery} onDateFilter={setDateFilter} onExport={(rows) => exportTransactionsCsv(rows, productMap)} onView={(tx) => { setReceiptCash(null); setReceipt(tx); }} onEdit={editTransaction} onDelete={deleteTransaction} />}
    </section>
    {addProductOpen && <AddProductModal value={newProduct} saving={saving} onChange={setNewProduct} onClose={() => setAddProductOpen(false)} onSave={addProduct} />}
    {editProductOpen && <EditProductModal product={editProductOpen} value={editProductValue} saving={saving} onChange={setEditProductValue} onClose={() => setEditProductOpen(null)} onSave={saveProductEdit} />}
    {stockOpen && <StockInModal product={stockOpen} quantity={stockQty} note={stockNote} saving={saving} onQuantity={setStockQty} onNote={setStockNote} onClose={() => setStockOpen(null)} onSave={stockIn} />}
    {receipt && <ReceiptModal receipt={receipt} products={products} cashReceived={receiptCash?.received} changeDue={receiptCash?.change} onClose={closeReceipt} onNewSale={newSaleFromReceipt} />}
  </main>;
}
