// Temporarily point metrics to backend on port 5001 to pick up updated summary
const API_URL = 'http://localhost:5000/api/metrics';

export type SalesSummary = {
  today: { bookshop: number; printshop: number; total: number };
  month: { bookshop: number; printshop: number; total: number };
};

export async function getSalesSummary(): Promise<SalesSummary> {
  const res = await fetch(`${API_URL}/sales-summary`);
  if (!res.ok) throw new Error('Failed to get sales summary');
  return res.json();
}