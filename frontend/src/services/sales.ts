const API_URL = 'http://localhost:5000/api/sales';

export type SaleItemInput = {
  inventoryId: number;
  quantity: number;
  unitPrice: number;
  brand?: string | null;
};

export type SaleInput = {
  invoiceNo?: string | null;
  saleDate?: string | null; // YYYY-MM-DD
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  note?: string | null;
  items: SaleItemInput[];
};

export async function createSale(payload: SaleInput) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create sale');
  }
  return res.json();
}

export type SaleListItem = {
  sale_id: number;
  invoice_no: string | null;
  sale_date: string;
  total_amount: number;
  customer_name: string | null;
  items: Array<{
    product_id: number;
    product_name: string;
    brand: string | null;
    quantity: number;
    unit_price: number;
  }>;
};

export async function listSales(params: { q?: string; from?: string | null; to?: string | null; limit?: number }): Promise<{ sales: SaleListItem[] }> {
  const url = new URL(API_URL);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.from) url.searchParams.set('from', String(params.from));
  if (params.to) url.searchParams.set('to', String(params.to));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

export async function getNextInvoiceNo(): Promise<{ nextInvoiceNo: string }> {
  const res = await fetch(`${API_URL}/next-invoice`);
  if (!res.ok) {
    throw new Error('Failed to fetch next sales invoice number');
  }
  return res.json();
}