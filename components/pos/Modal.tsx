import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="posModalBack" role="dialog" aria-modal="true">
      <div className="posModalCard">
        <div className="posModalHeader">
          <div><span>SQUISHY POS</span><h2>{title}</h2></div>
          <button className="posIconButton" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
