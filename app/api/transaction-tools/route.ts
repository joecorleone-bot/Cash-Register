import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function positiveInt(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function nonNegativeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function errorMessage(error: unknown) {
  const e = error as { code?: string; message?: string };
  if (e?.code === '23505') return 'SKU sudah digunakan oleh produk lain.';
  return e?.message || 'Ralat pangkalan data.';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? '');

    if (action === 'edit-product') {
      const productId = positiveInt(body.productId);
      const name = String(body.name ?? '').trim();
      const sku = String(body.sku ?? '').trim().toUpperCase();
      const price = nonNegativeNumber(body.price);
      const cost = nonNegativeNumber(body.cost);
      const stock = nonNegativeNumber(body.stock);
      const lowStock = nonNegativeNumber(body.lowStock);

      if (!productId || !name || !sku || sku.startsWith('ARCHIVED-') || price === null || price <= 0 || cost === null || stock === null || lowStock === null) {
        return NextResponse.json({ error: 'Maklumat produk tidak sah.' }, { status: 400 });
      }

      const nextStock = Math.trunc(stock);
      const nextLowStock = Math.trunc(lowStock);
      const [product] = await sql`
        WITH target AS MATERIALIZED (
          SELECT id, stock
          FROM products
          WHERE id = ${productId}
            AND sku NOT LIKE 'ARCHIVED-%'
          FOR UPDATE
        ), movement AS (
          INSERT INTO stock_movements (product_id, quantity, movement_type, note)
          SELECT id, ${nextStock} - stock, 'ADJUSTMENT', 'Inventory product edited: stock adjusted'
          FROM target
          WHERE ${nextStock} <> stock
          RETURNING id
        ), updated AS (
          UPDATE products p
          SET name = ${name},
              sku = ${sku},
              price = ${price},
              cost = ${cost},
              stock = ${nextStock},
              low_stock = ${nextLowStock},
              updated_at = NOW()
          FROM target t
          WHERE p.id = t.id
          RETURNING p.id, p.name, p.sku, p.price, p.cost, p.stock, p.low_stock
        )
        SELECT id, name, sku,
               price::float8 AS price,
               cost::float8 AS cost,
               stock,
               low_stock AS "lowStock"
        FROM updated
      `;

      if (!product) return NextResponse.json({ error: 'Produk tidak dijumpai atau sudah diarkib.' }, { status: 404 });
      return NextResponse.json(product);
    }

    if (action === 'archive-product') {
      const productId = positiveInt(body.productId);
      if (!productId) return NextResponse.json({ error: 'Produk tidak sah.' }, { status: 400 });

      const [product] = await sql`
        WITH target AS MATERIALIZED (
          SELECT id, sku, stock
          FROM products
          WHERE id = ${productId}
            AND sku NOT LIKE 'ARCHIVED-%'
          FOR UPDATE
        ), movement AS (
          INSERT INTO stock_movements (product_id, quantity, movement_type, note)
          SELECT id, -stock, 'ADJUSTMENT', 'Product archived from active inventory'
          FROM target
          WHERE stock <> 0
          RETURNING id
        ), updated AS (
          UPDATE products p
          SET sku = 'ARCHIVED-' || p.id::text || '-' || p.sku,
              stock = 0,
              updated_at = NOW()
          FROM target t
          WHERE p.id = t.id
          RETURNING p.id, p.name, p.sku
        )
        SELECT * FROM updated
      `;

      if (!product) return NextResponse.json({ error: 'Produk tidak dijumpai atau sudah diarkib.' }, { status: 404 });
      return NextResponse.json(product);
    }

    if (action === 'apply-discount') {
      const receiptNo = String(body.receiptNo ?? '').trim();
      const discountAmount = nonNegativeNumber(body.discountAmount);
      if (!receiptNo || discountAmount === null) return NextResponse.json({ error: 'Discount tidak sah.' }, { status: 400 });

      const [transaction] = await sql`
        WITH gross AS (
          SELECT t.id, t.receipt_no, COALESCE(SUM(ti.subtotal), 0)::numeric AS subtotal
          FROM transactions t
          LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
          WHERE t.receipt_no = ${receiptNo}
          GROUP BY t.id
        ), updated AS (
          UPDATE transactions t
          SET total = GREATEST(g.subtotal - LEAST(${discountAmount}, g.subtotal), 0)
          FROM gross g
          WHERE t.id = g.id
          RETURNING t.id, t.receipt_no, t.sold_at, t.total, t.payment, t.note
        )
        SELECT
          u.receipt_no AS id,
          u.receipt_no AS "receiptNo",
          u.sold_at AS date,
          u.total::float8 AS total,
          u.payment,
          u.note,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'productId', ti.product_id,
              'quantity', ti.quantity,
              'unitPrice', ti.unit_price::float8,
              'subtotal', ti.subtotal::float8
            ) ORDER BY ti.id)
             FROM transaction_items ti WHERE ti.transaction_id = u.id),
            '[]'::json
          ) AS items
        FROM updated u
      `;

      if (!transaction) return NextResponse.json({ error: 'Transaksi tidak dijumpai.' }, { status: 404 });
      return NextResponse.json(transaction);
    }

    return NextResponse.json({ error: 'Action tidak dikenali.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
