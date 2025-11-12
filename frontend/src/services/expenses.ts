const API_BASE = (import.meta.env && typeof import.meta.env.VITE_API_BASE === 'string'
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:5000');
const API_URL = `${API_BASE}/api/expenses`;

export type ExpenseInput = {
  expenseName: string;
  expenseDate?: string | null; // YYYY-MM-DD
  amount: number;
  note?: string | null;
};

export async function createExpense(payload: ExpenseInput) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to record expense');
  }
  return res.json();
}

export type ExpenseListItem = {
  expense_id: number;
  expense_name: string;
  expense_date: string | null;
  amount: number;
  note: string | null;
  created_at: string;
};

export async function listExpenses(params: { q?: string; from?: string | null; to?: string | null; limit?: number }): Promise<{ expenses: ExpenseListItem[] }> {
  const url = new URL(API_URL);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.from) url.searchParams.set('from', String(params.from));
  if (params.to) url.searchParams.set('to', String(params.to));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}