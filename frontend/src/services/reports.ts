// Reports service pointing to backend on port 5001
const API_URL = 'http://localhost:5000/api/reports';

export async function downloadPrintshopItemsCSV(params: { from?: string; to?: string; filename?: string } = {}): Promise<void> {
  const url = new URL(`${API_URL}/printshop-items.csv`);
  if (params.from) url.searchParams.set('from', String(params.from));
  if (params.to) url.searchParams.set('to', String(params.to));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to download printshop items report');
  const blob = await res.blob();
  const a = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  const fname = params.filename || 'printshop_items.csv';
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}