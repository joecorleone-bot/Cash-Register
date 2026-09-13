import { Printer } from 'lucide-react';
import Modal from './Modal';
import { dateLabel, money } from '@/lib/pos-client';
import type { Product, Transaction } from '@/lib/pos-types';

export default function ReceiptModal({ receipt, products, onClose }: { receipt: Transaction; products: Product[]; onClose: () => void }) {
  const map = new Map(products.map((p) => [p.id, p]));
  return (
    <Modal title="Receipt" onClose={onClose}>
      <div className="posReceiptPaper" id="receipt">
        <div className="posReceiptBrand">SQUISHY POS</div>
        <h3>{receipt.id}</h3>
        <p>{dateLabel(receipt.date)}</p>
        {receipt.items.map((item) => (
          <div className="posReceiptLine" key={item.productId}>
            <span>{map.get(item.productId)?.name || 'Product'} × {item.quantity}</span>
            <b>{money(item.unitPrice * item.quantity)}</b>
          </div>
        ))}
        <div className="posReceiptTotal"><span>TOTAL</span><b>{money(receipt.total)}</b></div>
        <div className="posReceiptMeta"><span>Payment</span><b>{receipt.payment}</b></div>
        {receipt.note && <div className="posReceiptMeta"><span>Note</span><b>{receipt.note}</b></div>}
        <p className="posThankYou">Thank you!</p>
      </div>
      <div className="posModalActions"><button className="posSecondaryButton" onClick={onClose}>Close</button><button className="posPrimaryButton" onClick={() => window.print()}><Printer size={16} />Print Receipt</button></div>
    </Modal>
  );
}
