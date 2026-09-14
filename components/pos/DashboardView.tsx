import type { ReactNode } from 'react';
import { Gift, Package, PartyPopper, Receipt, ShoppingBag, Sparkles, Star, Wallet } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dateKey, money, monthKey } from '@/lib/pos-client';
import type { Product, Transaction } from '@/lib/pos-types';

export default function DashboardView({ products, transactions, onNewSale }: { products: Product[]; transactions: Transaction[]; onNewSale: () => void }) {
  const today = dateKey(new Date());
  const month = monthKey(new Date());
  const todayTx = transactions.filter((t) => dateKey(t.date) === today);
  const monthTx = transactions.filter((t) => monthKey(t.date) === month);
  const total = (rows: Transaction[]) => rows.reduce((sum, row) => sum + row.total, 0);
  const units = (rows: Transaction[]) => rows.reduce((sum, row) => sum + row.items.reduce((s, item) => s + item.quantity, 0), 0);
  const lowStock = products.filter((p) => p.stock <= p.lowStock);
  const stockValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);

  const trend = Array.from({ length: 7 }, (_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - index));
    const key = dateKey(d);
    return { name: d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' }), sales: total(transactions.filter((t) => dateKey(t.date) === key)) };
  });

  const topProducts = products.map((product) => ({
    ...product,
    sold: monthTx.reduce((sum, tx) => sum + tx.items.filter((item) => item.productId === product.id).reduce((s, item) => s + item.quantity, 0), 0),
  })).sort((a, b) => b.sold - a.sold).slice(0, 5);

  return (
    <>
      <section className="posHero posToyHero">
        <div className="posToyCopy">
          <span className="posToyBadge"><Sparkles size={13} /> LITTLE SQUISHY</span>
          <h2>Welcome to We'Ouls little toy shop! ✨</h2>
          <p>Pantau jualan, stok dan produk paling popular dalam satu dashboard yang ceria.</p>
          <button className="posPrimaryButton posToySaleButton" onClick={onNewSale}><ShoppingBag size={17} /> Start New Sale</button>
        </div>
        <div className="posToyScene" aria-hidden="true">
          <span className="toyFloat toyBear">🧸</span><span className="toyFloat toyStar">⭐</span><span className="toyFloat toyHeart">💖</span><span className="toyFloat toyCloud">☁️</span>
          <div className="toyBubble bubbleA" /><div className="toyBubble bubbleB" /><div className="toyBubble bubbleC" />
        </div>
      </section>

      <section className="posMetricGrid posToyMetrics">
        <Metric icon={<Wallet />} label="Sales Today" value={money(total(todayTx))} tone="pink" />
        <Metric icon={<Receipt />} label="Orders Today" value={String(todayTx.length)} tone="blue" />
        <Metric icon={<Gift />} label="Toys Sold This Month" value={String(units(monthTx))} tone="purple" />
        <Metric icon={<Package />} label="Need Restock" value={String(lowStock.length)} tone="orange" />
      </section>

      <section className="posDashboardGrid">
        <div className="posCard posChartCard posToyCard">
          <div className="posCardHeader"><div><span className="posEyebrow"><PartyPopper size={13} /> SALES ADVENTURE</span><h3>7-Day Sales Trend</h3><p>See how your toy shop is doing this week.</p></div></div>
          <div className="posChartBox"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="4 5" vertical={false} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(value) => money(Number(value))} /><Line type="monotone" dataKey="sales" stroke="#8a68ff" strokeWidth={4} dot={{ r: 5, fill: '#ff79ad', strokeWidth: 2 }} activeDot={{ r: 7 }} /></LineChart></ResponsiveContainer></div>
        </div>

        <div className="posCard posToyCard">
          <div className="posCardHeader"><div><span className="posEyebrow"><Star size={13} /> LITTLE STARS</span><h3>Top Toys</h3><p>Customer favourites this month.</p></div></div>
          <div className="posRankList">{topProducts.map((p, index) => <div className="posRankRow posToyRank" key={p.id}><span className="posRank">{['🥇','🥈','🥉','⭐','✨'][index]}</span><div><b>{p.name}</b><small>{p.sold} toys sold</small></div><strong>{money(p.sold * p.price)}</strong></div>)}{!topProducts.length && <div className="posEmpty">Belum ada produk.</div>}</div>
        </div>
      </section>

      <section className="posMiniGrid">
        <div className="posCard posMini posToyMini"><span>📦 Stock Cost Value</span><b>{money(stockValue)}</b></div>
        <div className="posCard posMini posToyMini"><span>🎉 Month Sales</span><b>{money(total(monthTx))}</b></div>
        <div className="posCard posMini posToyMini"><span>🧸 Toy Products</span><b>{products.length}</b></div>
      </section>
    </>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return <div className={`posCard posMetric posToyMetric ${tone}`}><div className="posMetricIcon">{icon}</div><div><span>{label}</span><b>{value}</b></div><div className="posMetricSpark">✦</div></div>;
}
