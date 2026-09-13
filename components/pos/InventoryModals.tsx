import Modal from './Modal';
import type { Product } from '@/lib/pos-types';

export function AddProductModal({ value, saving, onChange, onClose, onSave }: {
  value: { name: string; sku: string; price: number; cost: number; stock: number; lowStock: number };
  saving: boolean;
  onChange: (value: { name: string; sku: string; price: number; cost: number; stock: number; lowStock: number }) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return <Modal title="Add Product" onClose={onClose}>
    <div className="posFormGrid">
      <label>Name<input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} /></label>
      <label>SKU<input value={value.sku} onChange={(e) => onChange({ ...value, sku: e.target.value })} /></label>
      <label>Price (RM)<input type="number" min="0" step="0.01" value={value.price} onChange={(e) => onChange({ ...value, price: Number(e.target.value) })} /></label>
      <label>Cost (RM)<input type="number" min="0" step="0.01" value={value.cost} onChange={(e) => onChange({ ...value, cost: Number(e.target.value) })} /></label>
      <label>Initial Stock<input type="number" min="0" value={value.stock} onChange={(e) => onChange({ ...value, stock: Number(e.target.value) })} /></label>
      <label>Low Stock Level<input type="number" min="0" value={value.lowStock} onChange={(e) => onChange({ ...value, lowStock: Number(e.target.value) })} /></label>
    </div>
    <div className="posModalActions"><button className="posSecondaryButton" onClick={onClose}>Cancel</button><button className="posPrimaryButton" disabled={saving} onClick={onSave}>Save Product</button></div>
  </Modal>;
}

export function StockInModal({ product, quantity, note, saving, onQuantity, onNote, onClose, onSave }: {
  product: Product;
  quantity: number;
  note: string;
  saving: boolean;
  onQuantity: (value: number) => void;
  onNote: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return <Modal title={`Stock In — ${product.name}`} onClose={onClose}>
    <div className="posFormGrid one">
      <label>Quantity<input type="number" min="1" value={quantity} onChange={(e) => onQuantity(Number(e.target.value))} /></label>
      <label>Note<input value={note} onChange={(e) => onNote(e.target.value)} /></label>
    </div>
    <div className="posModalActions"><button className="posSecondaryButton" onClick={onClose}>Cancel</button><button className="posPrimaryButton" disabled={saving || quantity <= 0} onClick={onSave}>Add Stock</button></div>
  </Modal>;
}
