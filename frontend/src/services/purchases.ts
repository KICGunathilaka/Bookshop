const API_BASE = (import.meta.env && typeof import.meta.env.VITE_API_BASE === 'string'
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:5000');
const API_URL = `${API_BASE}/api/purchases`;

export type PurchaseItemInput = {
  productId: number;
  quantity: number;
  unitPrice: number;
  brand?: string | null;
};

export type PurchaseInput = {
  vendorId: number | null;
  invoiceNo?: string | null;
  purchaseDate?: string | null; // YYYY-MM-DD
  note?: string | null;
  items: PurchaseItemInput[];
};

export async function createPurchase(payload: PurchaseInput) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create purchase');
  }
  return res.json();
}

export async function getNextInvoiceNo(): Promise<{ nextInvoiceNo: string }> {
  const res = await fetch(`${API_URL}/next-invoice`);
  if (!res.ok) {
    throw new Error('Failed to fetch next invoice number');
  }
  return res.json();
}

export type PurchaseListItem = {
  purchase_id: number;
  invoice_no: string | null;
  purchase_date: string;
  total_amount: number;
  vendor_name: string | null;
  items: Array<{
    product_id: number;
    product_name: string;
    brand: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
};

export async function listPurchases(params: { q?: string; vendorId?: number | null; from?: string | null; to?: string | null; limit?: number }): Promise<{ purchases: PurchaseListItem[] }> {
  const url = new URL(API_URL);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.vendorId) url.searchParams.set('vendorId', String(params.vendorId));
  if (params.from) url.searchParams.set('from', String(params.from));
  if (params.to) url.searchParams.set('to', String(params.to));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch purchases');
  return res.json();
}