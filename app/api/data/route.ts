import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [products, transactions, movements] = await Promise.all([
    sql`SELECT id, name, sku, price::float8 AS price, cost::float8 AS cost, stock, low_stock AS "lowStock" FROM products ORDER BY id`,
    sql`SELECT t.id, t.receipt_no AS "receiptNo", t.sold_at AS date, t.total::float8 AS total, t.payment, t.note,
        COALESCE(json_agg(json_build_object('productId', ti.product_id, 'quantity', ti.quantity, 'unitPrice', ti.unit_price::float8, 'subtotal', ti.subtotal::float8) ORDER BY ti.id) FILTER (WHERE ti.id IS NOT NULL), '[]') AS items
        FROM transactions t LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
        GROUP BY t.id ORDER BY t.sold_at DESC`,
    sql`SELECT id, product_id AS "productId", quantity, movement_type AS "movementType", transaction_id AS "transactionId", moved_at AS date, note FROM stock_movements ORDER BY moved_at DESC`,
  ]);
  return NextResponse.json({ products, transactions, movements });
}

export async function POST(request: Request) {
  const body = await request.json();
  const action = body?.action;

  if (action === 'product') {
    const [product] = await sql`
      INSERT INTO products (name, sku, price, cost, stock, low_stock)
      VALUES (${body.name}, ${body.sku}, ${body.price}, ${body.cost ?? 0}, ${body.stock ?? 0}, ${body.lowStock ?? 5})
      RETURNING id, name, sku, price::float8 AS price, cost::float8 AS cost, stock, low_stock AS "lowStock"`;
    return NextResponse.json(product, { status: 201 });
  }

  if (action === 'stock-in') {
    const [product] = await sql`SELECT id, stock FROM products WHERE id = ${body.productId} FOR UPDATE`;
    if (!product) return NextResponse.json({ error: 'Produk tidak dijumpai' }, { status: 404 });
    const qty = Number(body.quantity);
    if (!Number.isInteger(qty) || qty <= 0) return NextResponse.json({ error: 'Kuantiti tidak sah' }, { status: 400 });
    const result = await sql.transaction([
      sql`UPDATE products SET stock = stock + ${qty}, updated_at = NOW() WHERE id = ${body.productId}`,
      sql`INSERT INTO stock_movements (product_id, quantity, movement_type, note) VALUES (${body.productId}, ${qty}, 'STOCK_IN', ${body.note ?? 'Restock'})`,
    ]);
    return NextResponse.json({ ok: true, result });
  }

  if (action === 'checkout') {
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: 'Cart kosong' }, { status: 400 });
    const payment = body.payment;
    if (!['Tunai', 'QR / Online Transfer', 'Kad'].includes(payment)) return NextResponse.json({ error: 'Kaedah pembayaran tidak sah' }, { status: 400 });

    const result = await sql.transaction([
      sql`SELECT id FROM products WHERE id = ANY(${items.map((i: { productId: number }) => i.productId)}::bigint[]) FOR UPDATE`,
      ...items.map((item: { productId: number; quantity: number }) => sql`UPDATE products SET stock = stock - ${item.quantity}, updated_at = NOW() WHERE id = ${item.productId} AND stock >= ${item.quantity}`),
    ]);

    const products = await sql`SELECT id, price::float8 AS price, stock FROM products WHERE id = ANY(${items.map((i: { productId: number }) => i.productId)}::bigint[])`;
    const productMap = new Map(products.map((p: { id: number; price: number; stock: number }) => [Number(p.id), p]));
    if (items.some((i: { productId: number; quantity: number }) => !productMap.get(Number(i.productId)) || Number(i.quantity) <= 0)) return NextResponse.json({ error: 'Item jualan tidak sah' }, { status: 400 });
    const total = items.reduce((sum: number, i: { productId: number; quantity: number }) => sum + Number(productMap.get(Number(i.productId))!.price) * Number(i.quantity), 0);
    const [counter] = await sql`INSERT INTO receipt_counters (sale_date, next_no) VALUES (CURRENT_DATE, 2) ON CONFLICT (sale_date) DO UPDATE SET next_no = receipt_counters.next_no + 1 RETURNING next_no - 1 AS receipt_no`;
    const receiptNo = `SQ-${new Date().toISOString().slice(0,10).replaceAll('-', '')}-${String(counter.receipt_no).padStart(4, '0')}`;
    const [transaction] = await sql.transaction([
      sql`INSERT INTO transactions (receipt_no, sold_at, total, payment, note) VALUES (${receiptNo}, COALESCE(${body.date}, NOW()), ${total}, ${payment}, ${body.note ?? ''}) RETURNING id, receipt_no AS "receiptNo", sold_at AS date, total::float8 AS total, payment, note`,
    ]);
    await sql.transaction([
      ...items.map((i: { productId: number; quantity: number }) => {
        const p = productMap.get(Number(i.productId))!;
        return sql`INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal) VALUES (${transaction.id}, ${i.productId}, ${i.quantity}, ${p.price}, ${Number(i.quantity) * Number(p.price)})`;
      }),
      ...items.map((i: { productId: number; quantity: number }) => sql`INSERT INTO stock_movements (product_id, quantity, movement_type, transaction_id, note) VALUES (${i.productId}, ${-Number(i.quantity)}, 'SALE', ${transaction.id}, ${body.note ?? 'Sale'})`),
    ]);
    return NextResponse.json({ ...transaction, items }, { status: 201 });
  }

  return NextResponse.json({ error: 'Action tidak disokong' }, { status: 400 });
}
