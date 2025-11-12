const API_BASE = (import.meta.env && typeof import.meta.env.VITE_API_BASE === 'string'
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:5000');
const API_URL = `${API_BASE}/api/vendors`;

export type Vendor = {
  vendor_id: number;
  vendor_name: string;
  contact_number?: string | null;
  email?: string | null;
  address?: string | null;
  created_at?: string;
};

export type VendorInput = {
  vendor_name: string;
  contact_number?: string | null;
  email?: string | null;
  address?: string | null;
};

export async function addVendor(payload: VendorInput) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create vendor');
  return res.json();
}

export async function getVendors(filters: { q?: string; from_date?: string; to_date?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.from_date) params.set('from_date', filters.from_date);
  if (filters.to_date) params.set('to_date', filters.to_date);
  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch vendors');
  return res.json();
}

export async function searchVendors(q: string) {
  const data = await getVendors({ q });
  return (data?.items ?? []) as Vendor[];
}