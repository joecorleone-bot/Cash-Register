import { CreditCard, Download, Search, Trash2 } from 'lucide-react';
import { dateKey, dateLabel, money } from '@/lib/pos-client';
import type { Product, Transaction } from '@/lib/pos-types';

export default function ReportsView({
  products,
  transactions,
  query,
  dateFilter,
  onQuery,
  onDateFilter,
  onExport,
  onView,
  onEdit,
  onDelete,
}: {
  products: Product[];
  transactions: Transaction[];
  query: string;
  dateFilter: string;
  onQuery: (value: string) => void;
  onDateFilter: (value: string) => void;
  onExport: (rows: Transaction[]) => void;
  onView: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const filtered = transactions.filter((tx) => {
    const names = tx.items.map((item) => productMap.get(item.productId)?.name || '').join(' ');
    const searchHit = `${tx.id} ${tx.note} ${names}`.toLowerCase().includes(query.toLowerCase());
    const dateHit = !dateFilter || dateKey(tx.date) === dateFilter;
    return searchHit && dateHit;
  });

  return (
    <section className="posCard posReportCard">
      <div className="posReportHeader">
        <div><h2>Transaction History</h2><p>{filtered.length} receipt(s)</p></div>
        <button className="posSecondaryButton" onClick={() => onExport(filtered)}><Download size={16} />Export CSV</button>
      </div>
      <div className="posFilters">
        <div className="posSearchBox"><Search size={16} /><input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search receipt, product or note" /></div>
        <input className="posDateInput" type="date" value={dateFilter} onChange={(e) => onDateFilter(e.target.value)} />
      </div>
      <div className="posTableWrap">
        <table>
          <thead><tr><th>Receipt</th><th>Date</th><th>Items</th><th>Payment</th><th>Total</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td><b>{tx.id}</b></td>
                <td>{dateLabel(tx.date)}</td>
                <td>{tx.items.map((item) => `${productMap.get(item.productId)?.name || 'Product'} ×${item.quantity}`).join(', ')}</td>
                <td><span className="posPaymentBadge"><CreditCard size={13} />{tx.payment}</span></td>
                <td><b>{money(tx.total)}</b></td>
                <td className="posActions"><button className="posTextButton" onClick={() => onView(tx)}>View</button><button className="posTextButton" onClick={() => onEdit(tx)}>Edit</button><button className="posIconButton danger" onClick={() => onDelete(tx)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="posEmpty">Tiada transaksi dijumpai.</div>}
      </div>
    </section>
  );
}
