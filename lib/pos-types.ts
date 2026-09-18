export type Payment = 'Tunai' | 'QR / Online Transfer' | 'Kad';
export type View = 'dashboard' | 'pos' | 'inventory' | 'reports';

export type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStock: number;
};

export type SaleItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
};

export type Transaction = {
  id: string;
  receiptNo?: string;
  date: string;
  total: number;
  payment: Payment;
  note: string;
  items: SaleItem[];
};

export type CartItem = {
  productId: number;
  quantity: number;
};
