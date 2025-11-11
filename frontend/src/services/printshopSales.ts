// Temporarily point printshop sales API to backend on port 5001
const API_URL = 'http://localhost:5001/api/printshop-sales';

export type PrintshopSaleItemInput = {
  inventoryId: number;
  quantity: number;
  unitPrice: number;
  brand?: string | null;
};

export async function getNextInvoiceNo(): Promise<{ nextInvoiceNo: string }> {
  const res = await fetch(`${API_URL}/next-invoice`);
  if (!res.ok) throw new Error('Failed to get next invoice');
  return res.json();
}

export type PrintshopSaleListItem = {
  printshop_sale_id: number;
  invoice_no: string | null;
  sale_date: string; // YYYY-MM-DD
  total_amount: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  note: string | null;
  items: Array<{
    product_id: number;
    product_name: string;
    brand: string | null;
    quantity: number;
    unit_price: number;
  }>; // May be empty for service-only sales
};

export async function listPrintshopSales(params: { q?: string; from?: string | null; to?: string | null; limit?: number }): Promise<{ sales: PrintshopSaleListItem[] }> {
  const url = new URL(API_URL);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.from) url.searchParams.set('from', String(params.from));
  if (params.to) url.searchParams.set('to', String(params.to));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch printshop sales');
  return res.json();
}

export async function createPrintshopSale(payload: {
  invoiceNo: string | null;
  saleDate?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  note?: string | null; // remark / description
  totalAmount?: number; // required when items are not provided
  items?: PrintshopSaleItemInput[]; // optional items; if present, total is computed server-side
}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create printshop sale');
  }
  return res.json();
}