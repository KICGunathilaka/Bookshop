import React, { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { listInventory, type InventoryItem } from '../services/inventory';
import { listSales, type SaleListItem } from '../services/sales';
import { listPrintshopSales, type PrintshopSaleListItem } from '../services/printshopSales';
import { listPurchases, type PurchaseListItem } from '../services/purchases';
import { listExpenses, type ExpenseListItem } from '../services/expenses';
import { downloadPrintshopItemsCSV } from '../services/reports';
import { listPrintshopItems, type PrintshopItem } from '../services/printshopItems';

type ReportTab = 'inventory' | 'sales' | 'printshop' | 'printshop_items' | 'purchases' | 'summary';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
  const [toDateObj, setToDateObj] = useState<Date | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [printshopSales, setPrintshopSales] = useState<PrintshopSaleListItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [printshopItems, setPrintshopItems] = useState<PrintshopItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);

  const shopName = 'Bookshop';

  const formatDate = (d: Date | null) => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handlePreset = (preset: 'today' | 'month' | 'range') => {
    const now = new Date();
    if (preset === 'today') {
      setFromDateObj(now);
      setToDateObj(now);
      setFromDate(formatDate(now));
      setToDate(formatDate(now));
    } else if (preset === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDateObj(first);
      setToDateObj(now);
      setFromDate(formatDate(first));
      setToDate(formatDate(now));
    } else {
      setFromDateObj(null);
      setToDateObj(null);
      setFromDate('');
      setToDate('');
    }
  };

  const reportTitle = useMemo(() => {
    const name = activeTab === 'summary'
      ? 'Summary Report'
      : activeTab === 'inventory'
      ? 'Inventory Report'
      : activeTab === 'sales'
      ? 'Sales Report'
      : activeTab === 'printshop'
      ? 'Printshop Sales Report'
      : activeTab === 'printshop_items'
      ? 'Printshop Items Report'
      : 'Purchases Report';
    const range = fromDate && toDate ? ` (${fromDate} → ${toDate})` : '';
    return `${shopName} — ${name}${range}`;
  }, [activeTab, fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'inventory') {
        const { items } = await listInventory({ from: fromDate || undefined, to: toDate || undefined, limit: 500 });
        setInventory(items);
      } else if (activeTab === 'sales') {
        const { sales } = await listSales({ from: fromDate || undefined, to: toDate || undefined, limit: 200 });
        setSales(sales);
      } else if (activeTab === 'printshop') {
        const { sales } = await listPrintshopSales({ from: fromDate || undefined, to: toDate || undefined, limit: 200 });
        setPrintshopSales(sales);
      } else if (activeTab === 'purchases') {
        const { purchases } = await listPurchases({ from: fromDate || undefined, to: toDate || undefined, limit: 200 });
        setPurchases(purchases);
      } else if (activeTab === 'printshop_items') {
        const { items } = await listPrintshopItems({ from: fromDate || undefined, to: toDate || undefined, limit: 500 });
        setPrintshopItems(items);
      } else {
        const [invRes, salRes, psRes, purRes, expRes] = await Promise.all([
          listInventory({ from: fromDate || undefined, to: toDate || undefined, limit: 500 }),
          listSales({ from: fromDate || undefined, to: toDate || undefined, limit: 200 }),
          listPrintshopSales({ from: fromDate || undefined, to: toDate || undefined, limit: 200 }),
          listPurchases({ from: fromDate || undefined, to: toDate || undefined, limit: 200 }),
          listExpenses({ from: fromDate || undefined, to: toDate || undefined, limit: 500 }),
        ]);
        setInventory(invRes.items);
        setSales(salRes.sales);
        setPrintshopSales(psRes.sales);
        setPurchases(purRes.purchases);
        setExpenses(expRes.expenses);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcelFromTable = (tableId: string, filename: string) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    const html = table.outerHTML;
    const blob = new Blob([`<html><head><meta charset="UTF-8"></head><body>${html}</body></html>`], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const table = document.getElementById('report-table');
    if (!table) return;
    const tableHtml = table.outerHTML;
    const styles = `@page { size: A4; margin: 16mm; } body { font-family: Arial, sans-serif; color: #000; } h1 { font-size: 18px; margin: 0 0 12px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 6px; font-size: 12px; } thead th { background: #f0f0f0; } footer { margin-top: 10px; font-size: 10px; color: #555; }`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${reportTitle}</title><style>${styles}</style></head><body><h1>${reportTitle}</h1>${tableHtml}<footer>Generated on ${new Date().toLocaleString()}</footer></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.onload = () => { w.print(); w.close(); };
  };

  return (
    <div className="products-page">
      <h1>Reports</h1>
      <div className="products-panel" role="tabpanel">
        <div className="products-tabs" role="tablist" aria-label="Report types">
          <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory</button>
          <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Sales</button>
          <button className={`tab-btn ${activeTab === 'printshop' ? 'active' : ''}`} onClick={() => setActiveTab('printshop')}>Printshop Sales</button>
          <button className={`tab-btn ${activeTab === 'printshop_items' ? 'active' : ''}`} onClick={() => setActiveTab('printshop_items')}>Printshop Items</button>
          <button className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>Purchases</button>
        </div>
        <div className="panel-section" style={{ alignItems: 'flex-end' }}>
          <div className="products-filters">
            <div>
              <label>From</label>
              <DatePicker
                selected={fromDateObj}
                onChange={(d) => { setFromDateObj(d); setFromDate(formatDate(d)); }}
                placeholderText="From date"
                dateFormat="yyyy-MM-dd"
                isClearable
                className="react-datepicker-input"
              />
            </div>
            <div>
              <label>To</label>
              <DatePicker
                selected={toDateObj}
                onChange={(d) => { setToDateObj(d); setToDate(formatDate(d)); }}
                placeholderText="To date"
                dateFormat="yyyy-MM-dd"
                isClearable
                className="react-datepicker-input"
              />
            </div>
            <div className="inline-actions" style={{ gap: 8 }}>
              <button className="secondary-button" type="button" onClick={() => handlePreset('today')}>Daily</button>
              <button className="secondary-button" type="button" onClick={() => handlePreset('month')}>Monthly</button>
              <button className="secondary-button" type="button" onClick={() => handlePreset('range')}>Clear</button>
              <button className="primary-button" type="button" onClick={fetchData}>Generate</button>
            </div>
          </div>
          <div className="inline-actions" style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>{reportTitle}</div>
            <div style={{ gap: 8, display: 'flex' }}>
              <button className="secondary-button" type="button" onClick={() => downloadExcelFromTable('report-table', activeTab)}>Download Excel</button>
              <button className="secondary-button" type="button" onClick={printReport}>Download PDF</button>
              {activeTab === 'printshop_items' && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => downloadPrintshopItemsCSV({ from: fromDate || undefined, to: toDate || undefined, filename: 'printshop_items.csv' })}
                >
                  Download CSV
                </button>
              )}
            </div>
          </div>
          {loading && <div>Loading...</div>}
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          {!loading && !error && (
            <div className="products-table-wrap" style={{ marginTop: 12 }}>
              {activeTab === 'inventory' && (
                <table id="report-table" className="products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Unit</th>
                      <th>Selling Price</th>
                      <th>Stock</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(it => (
                      <tr key={it.inventory_id}>
                        <td>{it.inventory_id}</td>
                        <td>{it.product_name}</td>
                        <td>{it.brand || '-'}</td>
                        <td>{it.unit}</td>
                        <td>{it.selling_price ?? '-'}</td>
                        <td>{it.stock_quantity}</td>
                        <td>{new Date(it.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {inventory.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No inventory items</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {activeTab === 'sales' && (
                <table id="report-table" className="products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Remark</th>
                      <th>Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s => (
                      <tr key={s.sale_id}>
                        <td>{s.sale_id}</td>
                        <td>{s.invoice_no || '-'}</td>
                        <td>{s.sale_date}</td>
                        <td>{s.customer_name || '-'}</td>
                        <td>{s.customer_phone || '-'}</td>
                        <td>{s.customer_address || '-'}</td>
                        <td>{s.note || '-'}</td>
                        <td>{(s.items || []).length > 0 ? s.items.map(it => `${it.product_name}${it.brand ? ` (${it.brand})` : ''} x ${it.quantity} @ ${Number(it.unit_price).toFixed(2)}`).join('; ') : '-'}</td>
                        <td>{Number(s.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                    {sales.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No sales</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {activeTab === 'printshop' && (
                <table id="report-table" className="products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Remark</th>
                      <th>Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printshopSales.map(s => (
                      <tr key={s.printshop_sale_id}>
                        <td>{s.printshop_sale_id}</td>
                        <td>{s.invoice_no || '-'}</td>
                        <td>{s.sale_date}</td>
                        <td>{s.customer_name || '-'}</td>
                        <td>{s.customer_phone || '-'}</td>
                        <td>{s.customer_address || '-'}</td>
                        <td>{s.note || '-'}</td>
                        <td>{(s.items || []).length > 0 ? s.items.map(it => `${it.product_name}${it.brand ? ` (${it.brand})` : ''} x ${it.quantity} @ ${Number(it.unit_price).toFixed(2)}`).join('; ') : '-'}</td>
                        <td>{Number(s.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                    {printshopSales.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No printshop sales</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {activeTab === 'purchases' && (
                <table id="report-table" className="products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Vendor</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.purchase_id}>
                        <td>{p.purchase_id}</td>
                        <td>{p.invoice_no || '-'}</td>
                        <td>{p.purchase_date}</td>
                        <td>{p.vendor_name || '-'}</td>
                        <td>{Number(p.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No purchases</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {activeTab === 'summary' && (
                <table id="report-table" className="products-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Count</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Expenses</td>
                      <td>{expenses.length}</td>
                      <td>{expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Purchases</td>
                      <td>{purchases.length}</td>
                      <td>{purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Sales</td>
                      <td>{sales.length}</td>
                      <td>{sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              {activeTab === 'printshop_items' && (
                <table id="report-table" className="products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printshopItems.map(it => (
                      <tr key={it.item_id}>
                        <td>{it.item_id}</td>
                        <td>{it.product_name || '-'}</td>
                        <td>{it.brand || '-'}</td>
                        <td>{it.quantity}</td>
                        <td>{Number(it.unit_price).toFixed(2)}</td>
                        <td>{Number(it.total_amount).toFixed(2)}</td>
                        <td>{new Date(it.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {printshopItems.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No printshop items</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;