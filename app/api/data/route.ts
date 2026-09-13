import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PAYMENTS = ['Tunai', 'QR / Online Transfer', 'Kad'] as const;
type Payment = (typeof PAYMENTS)[number];

type CartInput = { productId: number; quantity: number };

function asPositiveInt(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function asNonNegativeNumber(value: unknown, fallback = 0) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalizeItems(value: unknown): CartInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items = value.map((item) => ({
    productId: asPositiveInt(item?.productId),
    quantity: asPositiveInt(item?.quantity),
  }));
  if (items.some((item) => item.productId === null || item.quantity === null)) return null;
  return items as CartInput[];
}

function isPayment(value: unknown): value is Payment {
  return typeof value === 'string' && PAYMENTS.includes(value as Payment);
}

function errorMessage(error: unknown) {
  const e = error as { code?: string; message?: string };
  if (e?.code === '23505') return 'SKU atau Receipt No. sudah wujud.';
  if (e?.code === '23514') return 'Data tidak memenuhi syarat sistem.';
  return e?.message || 'Ralat pangkalan data.';
}

export async function GET() {
  try {
    const [products, transactions, movements] = await Promise.all([
      sql`
        SELECT id, name, sku,
               price::float8 AS price,
               cost::float8 AS cost,
               stock,
               low_stock AS "lowStock"
        FROM products
        ORDER BY name ASC
      `,
      sql`
        SELECT
          t.receipt_no AS id,
          t.receipt_no AS "receiptNo",
          t.sold_at AS date,
          t.total::float8 AS total,
          t.payment,
          t.note,
          COALESCE(
            json_agg(
              json_build_object(
                'productId', ti.product_id,
                'quantity', ti.quantity,
                'unitPrice', ti.unit_price::float8,
                'subtotal', ti.subtotal::float8
              ) ORDER BY ti.id
            ) FILTER (WHERE ti.id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
        GROUP BY t.id
        ORDER BY t.sold_at DESC
      `,
      sql`
        SELECT id,
               product_id AS "productId",
               quantity,
               movement_type AS "movementType",
               transaction_id AS "transactionId",
               moved_at AS date,
               note
        FROM stock_movements
        ORDER BY moved_at DESC
        LIMIT 500
      `,
    ]);

    return NextResponse.json({
      products,
      transactions,
      movements,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? '');

    if (action === 'product') {
      const name = String(body.name ?? '').trim();
      const sku = String(body.sku ?? '').trim().toUpperCase();
      const price = asNonNegativeNumber(body.price);
      const cost = asNonNegativeNumber(body.cost);
      const stock = asNonNegativeNumber(body.stock);
      const lowStock = asNonNegativeNumber(body.lowStock, 5);

      if (!name || !sku || price === null || price <= 0 || cost === null || stock === null || lowStock === null) {
        return NextResponse.json({ error: 'Maklumat produk tidak sah.' }, { status: 400 });
      }

      const [product] = await sql`
        WITH created AS (
          INSERT INTO products (name, sku, price, cost, stock, low_stock)
          VALUES (
            ${name}, ${sku}, ${price}, ${cost},
            ${Math.trunc(stock)}, ${Math.trunc(lowStock)}
          )
          RETURNING id, name, sku, price, cost, stock, low_stock
        ), movement AS (
          INSERT INTO stock_movements (product_id, quantity, movement_type, note)
          SELECT id, stock, 'STOCK_IN', 'Initial stock'
          FROM created
          WHERE stock > 0
          RETURNING id
        )
        SELECT id, name, sku,
               price::float8 AS price,
               cost::float8 AS cost,
               stock,
               low_stock AS "lowStock"
        FROM created
      `;

      return NextResponse.json(product, { status: 201 });
    }

    if (action === 'stock-in') {
      const productId = asPositiveInt(body.productId);
      const quantity = asPositiveInt(body.quantity);
      const note = String(body.note ?? 'Restock').trim() || 'Restock';

      if (!productId || !quantity) {
        return NextResponse.json({ error: 'Produk atau kuantiti tidak sah.' }, { status: 400 });
      }

      const [product] = await sql`
        WITH locked AS MATERIALIZED (
          SELECT id FROM products WHERE id = ${productId} FOR UPDATE
        ), updated AS (
          UPDATE products p
          SET stock = p.stock + ${quantity}, updated_at = NOW()
          FROM locked l
          WHERE p.id = l.id
          RETURNING p.id, p.name, p.sku, p.price, p.cost, p.stock, p.low_stock
        ), movement AS (
          INSERT INTO stock_movements (product_id, quantity, movement_type, note)
          SELECT id, ${quantity}, 'STOCK_IN', ${note}
          FROM updated
          RETURNING id
        )
        SELECT id, name, sku,
               price::float8 AS price,
               cost::float8 AS cost,
               stock,
               low_stock AS "lowStock"
        FROM updated
      `;

      if (!product) {
        return NextResponse.json({ error: 'Produk tidak dijumpai.' }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    if (action === 'checkout') {
      const items = normalizeItems(body.items);
      const payment = body.payment;
      const note = String(body.note ?? '').trim();

      if (!items) return NextResponse.json({ error: 'Cart kosong atau item tidak sah.' }, { status: 400 });
      if (!isPayment(payment)) return NextResponse.json({ error: 'Kaedah pembayaran tidak sah.' }, { status: 400 });

      const payload = JSON.stringify(items);
      const [transaction] = await sql`
        WITH input AS (
          SELECT "productId" AS product_id, SUM(quantity)::int AS quantity
          FROM jsonb_to_recordset(${payload}::jsonb)
            AS x("productId" bigint, quantity int)
          GROUP BY "productId"
        ), product_state AS MATERIALIZED (
          SELECT p.id, p.price, p.stock, i.quantity
          FROM products p
          JOIN input i ON i.product_id = p.id
          FOR UPDATE OF p
        ), valid AS (
          SELECT
            (SELECT COUNT(*) FROM input) > 0
            AND (SELECT COUNT(*) FROM input) = COUNT(*)
            AND COALESCE(bool_and(quantity > 0 AND stock >= quantity), false) AS ok
          FROM product_state
        ), counter AS (
          INSERT INTO receipt_counters (sale_date, next_no)
          SELECT (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date, 2
          FROM valid WHERE ok
          ON CONFLICT (sale_date)
          DO UPDATE SET next_no = receipt_counters.next_no + 1
          RETURNING sale_date, next_no - 1 AS seq
        ), tx AS (
          INSERT INTO transactions (receipt_no, sold_at, total, payment, note)
          SELECT
            'SQ-' || to_char(c.sale_date, 'YYYYMMDD') || '-' || lpad(c.seq::text, 4, '0'),
            NOW(),
            SUM(ps.price * ps.quantity),
            ${payment},
            ${note}
          FROM counter c
          CROSS JOIN product_state ps
          GROUP BY c.sale_date, c.seq
          RETURNING id, receipt_no, sold_at, total, payment, note
        ), item_rows AS (
          INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal)
          SELECT tx.id, ps.id, ps.quantity, ps.price, ps.price * ps.quantity
          FROM tx CROSS JOIN product_state ps
          RETURNING product_id, quantity, unit_price, subtotal
        ), stock_update AS (
          UPDATE products p
          SET stock = p.stock - ps.quantity, updated_at = NOW()
          FROM product_state ps, valid v
          WHERE v.ok AND p.id = ps.id
          RETURNING p.id
        ), movement_rows AS (
          INSERT INTO stock_movements (product_id, quantity, movement_type, transaction_id, note)
          SELECT ps.id, -ps.quantity, 'SALE', tx.id, COALESCE(NULLIF(${note}, ''), 'Sale')
          FROM tx CROSS JOIN product_state ps
          RETURNING id
        )
        SELECT
          tx.receipt_no AS id,
          tx.receipt_no AS "receiptNo",
          tx.sold_at AS date,
          tx.total::float8 AS total,
          tx.payment,
          tx.note,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'productId', ir.product_id,
              'quantity', ir.quantity,
              'unitPrice', ir.unit_price::float8,
              'subtotal', ir.subtotal::float8
            ) ORDER BY ir.product_id) FROM item_rows ir),
            '[]'::json
          ) AS items
        FROM tx
      `;

      if (!transaction) {
        return NextResponse.json({ error: 'Stok tidak mencukupi atau item tidak sah.' }, { status: 409 });
      }
      return NextResponse.json(transaction, { status: 201 });
    }

    if (action === 'update-transaction') {
      const receiptNo = String(body.receiptNo ?? '').trim();
      const items = normalizeItems(body.items);
      const payment = body.payment;
      const note = String(body.note ?? '').trim();

      if (!receiptNo || !items || !isPayment(payment)) {
        return NextResponse.json({ error: 'Transaksi tidak sah.' }, { status: 400 });
      }

      const payload = JSON.stringify(items);
      const [transaction] = await sql`
        WITH target AS MATERIALIZED (
          SELECT id, receipt_no, sold_at
          FROM transactions
          WHERE receipt_no = ${receiptNo}
          FOR UPDATE
        ), old_items AS (
          SELECT ti.product_id, SUM(ti.quantity)::int AS quantity
          FROM transaction_items ti
          JOIN target t ON t.id = ti.transaction_id
          GROUP BY ti.product_id
        ), input AS (
          SELECT "productId" AS product_id, SUM(quantity)::int AS quantity
          FROM jsonb_to_recordset(${payload}::jsonb)
            AS x("productId" bigint, quantity int)
          GROUP BY "productId"
        ), all_ids AS (
          SELECT product_id FROM old_items
          UNION
          SELECT product_id FROM input
        ), locked_products AS MATERIALIZED (
          SELECT p.id, p.price, p.stock
          FROM products p
          JOIN all_ids a ON a.product_id = p.id
          FOR UPDATE OF p
        ), product_state AS (
          SELECT lp.id, lp.price, lp.stock,
                 COALESCE(i.quantity, 0) AS new_qty,
                 COALESCE(o.quantity, 0) AS old_qty
          FROM locked_products lp
          LEFT JOIN input i ON i.product_id = lp.id
          LEFT JOIN old_items o ON o.product_id = lp.id
        ), valid AS (
          SELECT
            EXISTS(SELECT 1 FROM target)
            AND (SELECT COUNT(*) FROM input) > 0
            AND (SELECT COUNT(*) FROM input) = (SELECT COUNT(*) FROM locked_products lp JOIN input i ON i.product_id = lp.id)
            AND COALESCE(bool_and(CASE WHEN new_qty > 0 THEN stock + old_qty >= new_qty ELSE true END), false) AS ok
          FROM product_state
        ), stock_adjust AS (
          UPDATE products p
          SET stock = p.stock + ps.old_qty - ps.new_qty, updated_at = NOW()
          FROM product_state ps, valid v
          WHERE v.ok AND p.id = ps.id
          RETURNING p.id
        ), deleted_items AS (
          DELETE FROM transaction_items
          WHERE transaction_id = (SELECT id FROM target)
            AND (SELECT ok FROM valid)
          RETURNING product_id, quantity
        ), updated_tx AS (
          UPDATE transactions t
          SET total = x.total, payment = ${payment}, note = ${note}
          FROM (
            SELECT SUM(price * new_qty) AS total
            FROM product_state
            WHERE new_qty > 0
          ) x, valid v
          WHERE v.ok AND t.id = (SELECT id FROM target)
          RETURNING t.id, t.receipt_no, t.sold_at, t.total, t.payment, t.note
        ), inserted_items AS (
          INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal)
          SELECT ut.id, ps.id, ps.new_qty, ps.price, ps.price * ps.new_qty
          FROM updated_tx ut CROSS JOIN product_state ps
          WHERE ps.new_qty > 0
          RETURNING product_id, quantity, unit_price, subtotal
        ), restore_moves AS (
          INSERT INTO stock_movements (product_id, quantity, movement_type, transaction_id, note)
          SELECT o.product_id, o.quantity, 'ADJUSTMENT', ut.id, 'Edit transaction: restore previous sale'
          FROM old_items o CROSS JOIN updated_tx ut
          RETURNING id
        ), sale_moves AS (
          INSERT INTO stock_movements (product_id, quantity, movement_type, transaction_id, note)
          SELECT ps.id, -ps.new_qty, 'SALE', ut.id, 'Edited sale'
          FROM product_state ps CROSS JOIN updated_tx ut
          WHERE ps.new_qty > 0
          RETURNING id
        )
        SELECT
          ut.receipt_no AS id,
          ut.receipt_no AS "receiptNo",
          ut.sold_at AS date,
          ut.total::float8 AS total,
          ut.payment,
          ut.note,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'productId', ii.product_id,
              'quantity', ii.quantity,
              'unitPrice', ii.unit_price::float8,
              'subtotal', ii.subtotal::float8
            ) ORDER BY ii.product_id) FROM inserted_items ii),
            '[]'::json
          ) AS items
        FROM updated_tx ut
      `;

      if (!transaction) {
        return NextResponse.json({ error: 'Transaksi tidak dijumpai atau stok tidak mencukupi.' }, { status: 409 });
      }
      return NextResponse.json(transaction);
    }

    if (action === 'delete-transaction') {
      const receiptNo = String(body.receiptNo ?? '').trim();
      if (!receiptNo) return NextResponse.json({ error: 'Receipt No. diperlukan.' }, { status: 400 });

      const [deleted] = await sql`
        WITH target AS MATERIALIZED (
          SELECT id, receipt_no
          FROM transactions
          WHERE receipt_no = ${receiptNo}
          FOR UPDATE
        ), restore_qty AS (
          SELECT ti.product_id, SUM(ti.quantity)::int AS quantity
          FROM transaction_items ti
          JOIN target t ON t.id = ti.transaction_id
          GROUP BY ti.product_id
        ), locked_products AS MATERIALIZED (
          SELECT p.id
          FROM products p
          JOIN restore_qty r ON r.product_id = p.id
          FOR UPDATE OF p
        ), restored AS (
          UPDATE products p
          SET stock = p.stock + r.quantity, updated_at = NOW()
          FROM restore_qty r, locked_products lp
          WHERE p.id = r.product_id AND lp.id = p.id
          RETURNING p.id
        ), movements AS (
          INSERT INTO stock_movements (product_id, quantity, movement_type, transaction_id, note)
          SELECT r.product_id, r.quantity, 'ADJUSTMENT', t.id, 'Transaction deleted: stock restored'
          FROM restore_qty r CROSS JOIN target t
          RETURNING id
        ), gone AS (
          DELETE FROM transactions t
          WHERE t.id = (SELECT id FROM target)
          RETURNING t.receipt_no
        )
        SELECT receipt_no AS "receiptNo" FROM gone
      `;

      if (!deleted) {
        return NextResponse.json({ error: 'Transaksi tidak dijumpai.' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, ...deleted });
    }

    return NextResponse.json({ error: 'Action tidak disokong.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
