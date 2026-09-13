import { Package, Plus, Trash2 } from 'lucide-react';
import { money } from '@/lib/pos-client';
import type { Product } from '@/lib/pos-types';

export default function InventoryView({
  products,
  onAddProduct,
  onStockIn,
  onDeleteProduct,
}: {
  products: Product[];
  onAddProduct: () => void;
  onStockIn: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}) {
  const lowStock = products.filter((p) => p.stock <= p.lowStock);

  return (
    <>
      <section className="posPageActions">
        <div><h2>Products & Stock</h2><p>Add, restock or remove products from inventory.</p></div>
        <button className="posPrimaryButton" onClick={onAddProduct}><Plus size={16} />Add Product</button>
      </section>

      {lowStock.length > 0 && <div className="posStockWarning"><Package size={18} /><span><b>Low stock:</b> {lowStock.map((p) => p.name).join(', ')}</span></div>}

      <section className="posInventoryGrid">
        {products.map((product) => (
          <article className="posCard posProductCard" key={product.id}>
            <div className="posProductEmoji">🧸</div>
            <div className="posProductHead">
              <div><h3>{product.name}</h3><small>{product.sku}</small></div>
              <span className={product.stock <= product.lowStock ? 'posBadge low' : 'posBadge good'}>{product.stock <= product.lowStock ? 'LOW' : 'OK'}</span>
            </div>
            <div className="posPriceLine">{money(product.price)}</div>
            <div className="posProductMeta"><span>Stock <b>{product.stock}</b></span><span>Cost <b>{money(product.cost)}</b></span></div>
            <div className="posInventoryActions">
              <button className="posStockButton" onClick={() => onStockIn(product)}><Plus size={15} />Stock In</button>
              <button className="posDeleteProductButton" onClick={() => onDeleteProduct(product)} title={`Remove ${product.name}`}><Trash2 size={15} />Remove</button>
            </div>
          </article>
        ))}
        {!products.length && <div className="posEmpty">Belum ada produk.</div>}
      </section>
    </>
  );
}
