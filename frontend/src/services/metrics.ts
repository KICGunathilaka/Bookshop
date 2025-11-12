const API_BASE = (import.meta.env && typeof import.meta.env.VITE_API_BASE === 'string'
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:5000');
const API_URL = `${API_BASE}/api/metrics`;

export type SalesSummary = {
  today: { bookshop: number; printshop: number; total: number };
  month: { bookshop: number; printshop: number; total: number };
};

export async function getSalesSummary(): Promise<SalesSummary> {
  const res = await fetch(`${API_URL}/sales-summary`);
  if (!res.ok) throw new Error('Failed to get sales summary');
  return res.json();
}