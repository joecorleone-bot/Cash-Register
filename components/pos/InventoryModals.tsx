import Modal from './Modal';
import type { Product } from '@/lib/pos-types';

type ProductFormValue = { name: string; sku: string; category: string; price: number; cost: number; stock: number; lowStock: number };
const categories = ['Squishy', 'Tumbler', 'Accessories', 'Others'];

function CategoryField({ value, onChange }: { value: ProductFormValue; onChange: (value: ProductFormValue) => void }) {
  return <label>Category<select value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>;
}

export function AddProductModal({ value, saving, onChange, onClose, onSave }: { value: ProductFormValue; saving: boolean; onChange: (value: ProductFormValue) => void; onClose: () => void; onSave: () => void; }) {
  return <Modal title="Add Product" onClose={onClose}><div className="posFormGrid">
    <label>Name<input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} /></label><CategoryField value={value} onChange={onChange} />
    <label>SKU<input value={value.sku} onChange={(e) => onChange({ ...value, sku: e.target.value })} /></label><label>Price (RM)<input type="number" min="0" step="0.01" value={value.price} onChange={(e) => onChange({ ...value, price: Number(e.target.value) })} /></label>
    <label>Cost (RM)<input type="number" min="0" step="0.01" value={value.cost} onChange={(e) => onChange({ ...value, cost: Number(e.target.value) })} /></label><label>Initial Stock<input type="number" min="0" value={value.stock} onChange={(e) => onChange({ ...value, stock: Number(e.target.value) })} /></label>
    <label>Low Stock Level<input type="number" min="0" value={value.lowStock} onChange={(e) => onChange({ ...value, lowStock: Number(e.target.value) })} /></label>
  </div><div className="posModalActions"><button className="posSecondaryButton" onClick={onClose}>Cancel</button><button className="posPrimaryButton" disabled={saving} onClick={onSave}>Save Product</button></div></Modal>;
}

export function EditProductModal({ product, value, saving, onChange, onClose, onSave }: { product: Product; value: ProductFormValue; saving: boolean; onChange: (value: ProductFormValue) => void; onClose: () => void; onSave: () => void; }) {
  return <Modal title={`Edit Product — ${product.name}`} onClose={onClose}><div className="posFormGrid">
    <label>Name<input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} /></label><CategoryField value={value} onChange={onChange} />
    <label>SKU<input value={value.sku} onChange={(e) => onChange({ ...value, sku: e.target.value })} /></label><label>Price (RM)<input type="number" min="0" step="0.01" value={value.price} onChange={(e) => onChange({ ...value, price: Number(e.target.value) })} /></label>
    <label>Cost (RM)<input type="number" min="0" step="0.01" value={value.cost} onChange={(e) => onChange({ ...value, cost: Number(e.target.value) })} /></label><label>Current Stock<input type="number" min="0" step="1" value={value.stock} onChange={(e) => onChange({ ...value, stock: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} /></label>
    <label>Low Stock Level<input type="number" min="0" step="1" value={value.lowStock} onChange={(e) => onChange({ ...value, lowStock: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} /></label>
  </div><p style={{ marginTop: 12, fontSize: 12, opacity: .7 }}>Changing Current Stock creates an inventory adjustment record automatically.</p><div className="posModalActions"><button className="posSecondaryButton" onClick={onClose}>Cancel</button><button className="posPrimaryButton" disabled={saving || !value.name.trim() || !value.sku.trim() || value.price <= 0} onClick={onSave}>{saving ? 'Saving...' : 'Save Changes'}</button></div></Modal>;
}

export function StockInModal({ product, quantity, note, saving, onQuantity, onNote, onClose, onSave }: { product: Product; quantity: number; note: string; saving: boolean; onQuantity: (value: number) => void; onNote: (value: string) => void; onClose: () => void; onSave: () => void; }) {
  return <Modal title={`Stock In — ${product.name}`} onClose={onClose}><div className="posFormGrid one"><label>Quantity<input type="number" min="1" value={quantity} onChange={(e) => onQuantity(Number(e.target.value))} /></label><label>Note<input value={note} onChange={(e) => onNote(e.target.value)} /></label></div><div className="posModalActions"><button className="posSecondaryButton" onClick={onClose}>Cancel</button><button className="posPrimaryButton" disabled={saving || quantity <= 0} onClick={onSave}>Add Stock</button></div></Modal>;
}
