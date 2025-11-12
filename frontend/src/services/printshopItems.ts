const API_BASE = (import.meta.env && typeof import.meta.env.VITE_API_BASE === 'string'
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:5000');
const API_URL = `${API_BASE}/api/printshop-items`;

export type PrintshopItem = {
  item_id: number;
  product_id: number;
  product_name: string | null;
  brand: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
};

export async function listPrintshopItems(params: { q?: string; from?: string; to?: string; limit?: number }): Promise<{ items: PrintshopItem[] }> {
  const url = new URL(API_URL);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.from) url.searchParams.set('from', String(params.from));
  if (params.to) url.searchParams.set('to', String(params.to));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch printshop items');
  return res.json();
}