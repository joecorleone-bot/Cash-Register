import { Package, Plus, Sparkles } from 'lucide-react';
import { money } from '@/lib/pos-client';
import type { Product } from '@/lib/pos-types';

const toyEmoji = ['🧸', '💖', '🐱', '☁️', '🦖', '🐰', '🍓', '🌈'];

export default function InventoryView({ products, onAddProduct, onStockIn }: { products: Product[]; onAddProduct: () => void; onStockIn: (product: Product) => void }) {
  const lowStock = products.filter((p) => p.stock <= p.lowStock);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <>
      <section className="posPageActions posToyInventoryHead">
        <div><span className="posEyebrow"><Sparkles size={13} /> TOY ROOM</span><h2>Products & Stock</h2><p>{products.length} products • {totalUnits} total units in Neon PostgreSQL.</p></div>
        <button className="posPrimaryButton" onClick={onAddProduct}><Plus size={16} />Add Toy</button>
      </section>

      {lowStock.length > 0 && <div className="posStockWarning"><Package size={18} /><span><b>Restock reminder:</b> {lowStock.map((p) => p.name).join(', ')}</span></div>}

      <section className="posInventoryGrid posToyInventoryGrid">
        {products.map((product, index) => (
          <article className="posCard posProductCard posToyInventoryCard" key={product.id}>
            <div className="posInventoryVisual"><span>{toyEmoji[index % toyEmoji.length]}</span><em>{product.stock <= product.lowStock ? 'Restock soon' : 'Ready to sell'}</em></div>
            <div className="posProductHead">
              <div><h3>{product.name}</h3><small>{product.sku}</small></div>
              <span className={product.stock <= product.lowStock ? 'posBadge low' : 'posBadge good'}>{product.stock <= product.lowStock ? 'LOW' : 'OK'}</span>
            </div>
            <div className="posPriceLine">{money(product.price)}</div>
            <div className="posProductMeta"><span>Stock <b>{product.stock}</b></span><span>Cost <b>{money(product.cost)}</b></span></div>
            <div className="posInventoryMeter"><i style={{ width: `${Math.min(100, Math.max(8, (product.stock / Math.max(product.lowStock * 3, 1)) * 100))}%` }} /></div>
            <button className="posStockButton" onClick={() => onStockIn(product)}><Plus size={15} />Stock In</button>
          </article>
        ))}
        {!products.length && <div className="posEmpty">Belum ada produk.</div>}
      </section>
    </>
  );
}
