import type { Transaction } from './pos-types';

export const money = (value: number) =>
  `RM ${Number(value || 0).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const dateKey = (value: string | Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value);

export const monthKey = (value: string | Date) => dateKey(value).slice(0, 7);

export const dateLabel = (value: string) =>
  new Date(value).toLocaleString('ms-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

async function apiRequest(path: string, body?: unknown) {
  const response = await fetch(
    path,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : { cache: 'no-store' }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Operasi gagal.');
  return data;
}

export async function posApi(body?: unknown) {
  return apiRequest('/api/data', body);
}

export async function posToolsApi(body: unknown) {
  return apiRequest('/api/transaction-tools', body);
}

export function exportTransactionsCsv(transactions: Transaction[], productMap: ReadonlyMap<number, { name: string; sku: string }>) {
  const rows = [
    ['Receipt No', 'Tarikh', 'Produk', 'SKU', 'Qty', 'Unit Price', 'Jumlah', 'Payment', 'Nota'],
    ...transactions.flatMap((tx) =>
      tx.items.map((item) => {
        const p = productMap.get(item.productId);
        return [
          tx.id,
          dateLabel(tx.date),
          p?.name || '',
          p?.sku || '',
          item.quantity,
          item.unitPrice.toFixed(2),
          (item.quantity * item.unitPrice).toFixed(2),
          tx.payment,
          tx.note || '',
        ];
      })
    ),
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `squishy-sales-${dateKey(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
