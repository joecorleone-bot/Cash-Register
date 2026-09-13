import { Banknote, CreditCard, Minus, Plus, QrCode, Receipt, Search, ShoppingBag, Sparkles, Trash2 } from 'lucide-react';
import { money } from '@/lib/pos-client';
import type { CartItem, Payment, Product, Transaction } from '@/lib/pos-types';

const payments: { value: Payment; label: string; icon: typeof Banknote }[] = [
  { value: 'Tunai', label: 'Cash', icon: Banknote },
  { value: 'QR / Online Transfer', label: 'QR / Transfer', icon: QrCode },
  { value: 'Kad', label: 'Card', icon: CreditCard },
];

const toyEmoji = ['🧸', '💖', '🐱', '☁️', '🦖', '🐰', '🍓', '🌈'];

export default function PosView({ products, cart, payment, note, editing, saving, productQuery, onProductQuery, onAdd, onQty, onRemove, onPayment, onNote, onCheckout, onCancelEdit }: {
  products: Product[]; cart: CartItem[]; payment: Payment; note: string; editing: Transaction | null; saving: boolean; productQuery: string;
  onProductQuery: (value: string) => void; onAdd: (productId: number) => void; onQty: (productId: number, delta: number) => void; onRemove: (productId: number) => void;
  onPayment: (value: Payment) => void; onNote: (value: string) => void; onCheckout: () => void; onCancelEdit: () => void;
}) {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const oldQty = (productId: number) => editing?.items.find((i) => i.productId === productId)?.quantity || 0;
  const available = (productId: number) => (productMap.get(productId)?.stock || 0) + oldQty(productId);
  const filteredProducts = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(productQuery.toLowerCase()));
  const total = cart.reduce((sum, item) => sum + (productMap.get(item.productId)?.price || 0) * item.quantity, 0);
  const units = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="posCheckoutLayout posV2Layout">
      <div className="posCard posCatalogPanel posToyShelf">
        <div className="posSectionTitle">
          <div><span className="posEyebrow"><Sparkles size={13} /> TOY SHELF</span><h2>{editing ? `Edit ${editing.id}` : 'Choose Your Squishy'}</h2><p>Tap a toy card to add it to the cart.</p></div>
          {editing && <button className="posSecondaryButton" onClick={onCancelEdit}>Cancel Edit</button>}
        </div>
        <div className="posSearchBox posToySearch"><Search size={17} /><input value={productQuery} onChange={(e) => onProductQuery(e.target.value)} placeholder="Search toy name or SKU..." /></div>
        <div className="posShelfInfo"><span><ShoppingBag size={14} /> {filteredProducts.length} toys</span><span>Tap product to add</span></div>
        <div className="posCatalogGrid posToyCatalogGrid">
          {filteredProducts.map((product, index) => {
            const stock = available(product.id);
            const isLow = stock <= product.lowStock;
            return <button key={product.id} className={`posCatalogItem posToyProduct ${isLow ? 'low' : ''}`} disabled={stock <= 0} onClick={() => onAdd(product.id)}>
              <div className="posToyProductVisual"><span>{toyEmoji[index % toyEmoji.length]}</span><i>{stock <= 0 ? 'SOLD OUT' : isLow ? 'LOW STOCK' : 'IN STOCK'}</i></div>
              <div className="posToyProductText"><b>{product.name}</b><small>{product.sku}</small></div>
              <div className="posToyProductBottom"><strong>{money(product.price)}</strong><span>{stock} left</span></div>
              <div className="posToyAddHint"><Plus size={13} /> Add to cart</div>
            </button>;
          })}
          {!filteredProducts.length && <div className="posEmpty">Tiada produk dijumpai.</div>}
        </div>
      </div>

      <div className="posCard posCartPanel posV2Cart">
        <div className="posCartHero"><div><span className="posEyebrow"><Receipt size={13} /> CURRENT ORDER</span><h2>Customer Cart</h2><p>{units} toy{units === 1 ? '' : 's'} selected</p></div><div className="posCartBubble">🛒</div></div>
        <div className="posCartRows">
          {!cart.length && <div className="posEmpty posCartEmpty"><div>🧸</div><b>Cart is waiting!</b><span>Choose a squishy from the toy shelf.</span></div>}
          {cart.map((item, index) => {
            const product = productMap.get(item.productId); if (!product) return null;
            return <div className="posCartRow posV2CartRow" key={item.productId}>
              <div className="posCartProduct"><span className="posCartEmoji">{toyEmoji[index % toyEmoji.length]}</span><div><b>{product.name}</b><small>{money(product.price)} each</small></div></div>
              <div className="posQtyBox posV2Qty"><button onClick={() => onQty(item.productId, -1)}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => onQty(item.productId, 1)}><Plus size={14} /></button></div>
              <strong>{money(product.price * item.quantity)}</strong>
              <button className="posIconButton danger" onClick={() => onRemove(item.productId)}><Trash2 size={15} /></button>
            </div>;
          })}
        </div>

        <div className="posPaymentSection">
          <span className="posPaymentTitle">Payment Method</span>
          <div className="posPaymentTiles">{payments.map(({ value, label, icon: Icon }) => <button key={value} className={payment === value ? 'active' : ''} onClick={() => onPayment(value)}><Icon size={18} /><span>{label}</span></button>)}</div>
        </div>
        <div className="posCheckoutForm"><label>Order Note<textarea rows={2} value={note} onChange={(e) => onNote(e.target.value)} placeholder="Optional note for this order" /></label></div>
        <div className="posV2Summary"><div><span>Items</span><b>{units}</b></div><div className="total"><span>Total Amount</span><b>{money(total)}</b></div></div>
        <button className="posPrimaryButton posCheckoutButton posV2Checkout" disabled={!cart.length || saving} onClick={onCheckout}>{saving ? 'Saving Order...' : editing ? 'Update Transaction' : <><Sparkles size={16} /> Complete Checkout</>}</button>
      </div>
    </section>
  );
}
