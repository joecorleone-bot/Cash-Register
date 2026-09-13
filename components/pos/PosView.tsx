import { Minus, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { money } from '@/lib/pos-client';
import type { CartItem, Payment, Product, Transaction } from '@/lib/pos-types';

const payments: Payment[] = ['Tunai', 'QR / Online Transfer', 'Kad'];

export default function PosView({
  products,
  cart,
  payment,
  note,
  editing,
  saving,
  productQuery,
  onProductQuery,
  onAdd,
  onQty,
  onRemove,
  onPayment,
  onNote,
  onCheckout,
  onCancelEdit,
}: {
  products: Product[];
  cart: CartItem[];
  payment: Payment;
  note: string;
  editing: Transaction | null;
  saving: boolean;
  productQuery: string;
  onProductQuery: (value: string) => void;
  onAdd: (productId: number) => void;
  onQty: (productId: number, delta: number) => void;
  onRemove: (productId: number) => void;
  onPayment: (value: Payment) => void;
  onNote: (value: string) => void;
  onCheckout: () => void;
  onCancelEdit: () => void;
}) {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const oldQty = (productId: number) => editing?.items.find((i) => i.productId === productId)?.quantity || 0;
  const available = (productId: number) => (productMap.get(productId)?.stock || 0) + oldQty(productId);
  const filteredProducts = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(productQuery.toLowerCase()));
  const total = cart.reduce((sum, item) => sum + (productMap.get(item.productId)?.price || 0) * item.quantity, 0);
  const units = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="posCheckoutLayout">
      <div className="posCard posCatalogPanel">
        <div className="posSectionTitle">
          <div><h2>{editing ? `Edit ${editing.id}` : 'Product Catalog'}</h2><p>Click product to add into cart.</p></div>
          {editing && <button className="posSecondaryButton" onClick={onCancelEdit}>Cancel Edit</button>}
        </div>
        <div className="posSearchBox"><Search size={16} /><input value={productQuery} onChange={(e) => onProductQuery(e.target.value)} placeholder="Search product or SKU" /></div>
        <div className="posCatalogGrid">
          {filteredProducts.map((product) => {
            const stock = available(product.id);
            return (
              <button key={product.id} className={`posCatalogItem ${stock <= product.lowStock ? 'low' : ''}`} disabled={stock <= 0} onClick={() => onAdd(product.id)}>
                <div className="posProductEmoji">🧸</div>
                <b>{product.name}</b><small>{product.sku}</small><strong>{money(product.price)}</strong><span>{stock} in stock</span>
              </button>
            );
          })}
          {!filteredProducts.length && <div className="posEmpty">Tiada produk dijumpai.</div>}
        </div>
      </div>

      <div className="posCard posCartPanel">
        <div className="posSectionTitle"><div><h2>Active Cart</h2><p>{units} item(s)</p></div><Receipt size={20} /></div>
        <div className="posCartRows">
          {!cart.length && <div className="posEmpty">Select a product to begin.</div>}
          {cart.map((item) => {
            const product = productMap.get(item.productId);
            if (!product) return null;
            return (
              <div className="posCartRow" key={item.productId}>
                <div><b>{product.name}</b><small>{money(product.price)} each</small></div>
                <div className="posQtyBox"><button onClick={() => onQty(item.productId, -1)}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => onQty(item.productId, 1)}><Plus size={14} /></button></div>
                <strong>{money(product.price * item.quantity)}</strong>
                <button className="posIconButton danger" onClick={() => onRemove(item.productId)}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>

        <div className="posCheckoutForm">
          <label>Payment Method<select value={payment} onChange={(e) => onPayment(e.target.value as Payment)}>{payments.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Note<textarea rows={2} value={note} onChange={(e) => onNote(e.target.value)} placeholder="Optional note" /></label>
        </div>
        <div className="posTotalBox"><span>Total</span><b>{money(total)}</b></div>
        <button className="posPrimaryButton posCheckoutButton" disabled={!cart.length || saving} onClick={onCheckout}>{saving ? 'Saving...' : editing ? 'Update Transaction' : 'Complete Checkout'}</button>
      </div>
    </section>
  );
}
