import { Package, Receipt, ShoppingBag, Wallet } from 'lucide-react';
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
    return {
      name: d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' }),
      sales: total(transactions.filter((t) => dateKey(t.date) === key)),
    };
  });

  const topProducts = products
    .map((product) => ({
      ...product,
      sold: monthTx.reduce(
        (sum, tx) => sum + tx.items.filter((item) => item.productId === product.id).reduce((s, item) => s + item.quantity, 0),
        0
      ),
    }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return (
    <>
      <section className="posHero">
        <div><span>LIVE DATABASE</span><h2>POS → API → Neon → Dashboard</h2><p>Setiap checkout direkod terus ke PostgreSQL dan dashboard membaca data yang sama.</p></div>
        <button className="posPrimaryButton" onClick={onNewSale}>New Sale</button>
      </section>

      <section className="posMetricGrid">
        <Metric icon={<Wallet />} label="Sales Today" value={money(total(todayTx))} />
        <Metric icon={<Receipt />} label="Orders Today" value={String(todayTx.length)} />
        <Metric icon={<ShoppingBag />} label="Units This Month" value={String(units(monthTx))} />
        <Metric icon={<Package />} label="Low Stock" value={String(lowStock.length)} />
      </section>

      <section className="posDashboardGrid">
        <div className="posCard posChartCard">
          <div className="posCardHeader"><div><h3>7-Day Sales Trend</h3><p>Sales amount from Neon transactions</p></div></div>
          <div className="posChartBox">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Line type="monotone" dataKey="sales" stroke="#8a68ff" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="posCard">
          <div className="posCardHeader"><div><h3>Top Products</h3><p>This month</p></div></div>
          <div className="posRankList">
            {topProducts.map((p, index) => (
              <div className="posRankRow" key={p.id}>
                <span className="posRank">{index + 1}</span>
                <div><b>{p.name}</b><small>{p.sold} units</small></div>
                <strong>{money(p.sold * p.price)}</strong>
              </div>
            ))}
            {!topProducts.length && <div className="posEmpty">Belum ada produk.</div>}
          </div>
        </div>
      </section>

      <section className="posMiniGrid">
        <div className="posCard posMini"><span>Stock Cost Value</span><b>{money(stockValue)}</b></div>
        <div className="posCard posMini"><span>Month Sales</span><b>{money(total(monthTx))}</b></div>
        <div className="posCard posMini"><span>Products</span><b>{products.length}</b></div>
      </section>
    </>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="posCard posMetric"><div className="posMetricIcon">{icon}</div><div><span>{label}</span><b>{value}</b></div></div>;
}
