const API_URL = 'http://localhost:5000/api/inventory';

export type InventoryItem = {
  inventory_id: number;
  product_id: number;
  product_name: string;
  category: string | null;
  unit: string;
  vendor_id: number | null;
  vendor_name: string | null;
  brand: string | null;
  purchase_price: number | null;
  selling_price: number | null;
  stock_quantity: number;
  created_at: string;
};

export async function listInventory(params: {
  q?: string;
  vendorId?: number;
  brand?: string;
  minStock?: number;
  maxStock?: number;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<{ items: InventoryItem[] }> {
  const url = new URL(API_URL);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.vendorId) url.searchParams.set('vendorId', String(params.vendorId));
  if (params.brand) url.searchParams.set('brand', params.brand);
  if (typeof params.minStock === 'number') url.searchParams.set('minStock', String(params.minStock));
  if (typeof params.maxStock === 'number') url.searchParams.set('maxStock', String(params.maxStock));
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
}