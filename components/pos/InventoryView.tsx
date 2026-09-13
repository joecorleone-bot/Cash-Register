import { Archive, Pencil, Package, Plus } from 'lucide-react';
import { money } from '@/lib/pos-client';
import { productEmoji } from '@/lib/product-visual';
import type { Product } from '@/lib/pos-types';

export default function InventoryView({
  products,
  onAddProduct,
  onEditProduct,
  onStockIn,
  onDeleteProduct,
}: {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onStockIn: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}) {
  const lowStock = products.filter((p) => p.stock <= p.lowStock);

  return (
    <>
      <section className="posPageActions">
        <div><h2>Products & Stock</h2><p>Add, edit, restock or archive products from the active inventory.</p></div>
        <button className="posPrimaryButton" onClick={onAddProduct}><Plus size={16} />Add Product</button>
      </section>

      {lowStock.length > 0 && <div className="posStockWarning"><Package size={18} /><span><b>Low stock:</b> {lowStock.map((p) => p.name).join(', ')}</span></div>}

      <section className="posInventoryGrid">
        {products.map((product) => (
          <article className="posCard posProductCard" key={product.id}>
            <div className="posProductEmoji">{productEmoji(product.id)}</div>
            <div className="posProductHead">
              <div><h3>{product.name}</h3><small>{product.sku}</small></div>
              <span className={product.stock <= product.lowStock ? 'posBadge low' : 'posBadge good'}>{product.stock <= product.lowStock ? 'LOW' : 'OK'}</span>
            </div>
            <div className="posPriceLine">{money(product.price)}</div>
            <div className="posProductMeta"><span>Stock <b>{product.stock}</b></span><span>Cost <b>{money(product.cost)}</b></span></div>
            <div className="posInventoryActions">
              <button className="posSecondaryButton" onClick={() => onEditProduct(product)}><Pencil size={15} />Edit</button>
              <button className="posStockButton" onClick={() => onStockIn(product)}><Plus size={15} />Stock In</button>
              <button className="posDeleteProductButton" onClick={() => onDeleteProduct(product)} title={`Archive ${product.name}`}><Archive size={15} />Archive</button>
            </div>
          </article>
        ))}
        {!products.length && <div className="posEmpty">Belum ada produk.</div>}
      </section>
    </>
  );
}
