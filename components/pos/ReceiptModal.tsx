import { CheckCircle2, Printer, ShoppingBag } from 'lucide-react';
import Modal from './Modal';
import { dateLabel, money } from '@/lib/pos-client';
import type { Product, Transaction } from '@/lib/pos-types';

export default function ReceiptModal({ receipt, products, cashReceived, changeDue, onClose, onNewSale }: { receipt: Transaction; products: Product[]; cashReceived?: number; changeDue?: number; onClose: () => void; onNewSale?: () => void }) {
  const map = new Map(products.map((p) => [p.id, p]));
  const subtotal = receipt.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = Math.max(subtotal - receipt.total, 0);

  return (
    <Modal title="Sale Completed" onClose={onClose}>
      <div className="posSaleSuccess"><div className="posSuccessIcon"><CheckCircle2 size={28} /></div><div><span>PAYMENT SUCCESSFUL</span><h3>{money(receipt.total)}</h3><p>{receipt.id}</p></div></div>
      <div className="posReceiptPaper" id="receipt">
        <div className="posReceiptBrand">SQUISHY TOY POS</div>
        <h3>{receipt.id}</h3>
        <p>{dateLabel(receipt.date)}</p>
        {receipt.items.map((item) => (
          <div className="posReceiptLine" key={item.productId}>
            <span>{map.get(item.productId)?.name || 'Product'} × {item.quantity}</span>
            <b>{money(item.unitPrice * item.quantity)}</b>
          </div>
        ))}
        {discount > 0 && <>
          <div className="posReceiptMeta"><span>Subtotal</span><b>{money(subtotal)}</b></div>
          <div className="posReceiptMeta posReceiptDiscount"><span>Discount</span><b>- {money(discount)}</b></div>
        </>}
        <div className="posReceiptTotal"><span>TOTAL</span><b>{money(receipt.total)}</b></div>
        <div className="posReceiptMeta"><span>Payment</span><b>{receipt.payment}</b></div>
        {receipt.payment === 'Tunai' && cashReceived !== undefined && <><div className="posReceiptMeta"><span>Cash Received</span><b>{money(cashReceived)}</b></div><div className="posReceiptMeta posReceiptChange"><span>Change</span><b>{money(changeDue || 0)}</b></div></>}
        {receipt.note && <div className="posReceiptMeta"><span>Note</span><b>{receipt.note}</b></div>}
        <p className="posThankYou">Thank you! Come play again ✨</p>
      </div>
      <div className="posModalActions posSuccessActions"><button className="posSecondaryButton" onClick={() => window.print()}><Printer size={16} />Print Receipt</button>{onNewSale ? <button className="posPrimaryButton" onClick={onNewSale}><ShoppingBag size={16} />New Sale</button> : <button className="posPrimaryButton" onClick={onClose}>Done</button>}</div>
    </Modal>
  );
}
