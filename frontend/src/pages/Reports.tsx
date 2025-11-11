import React, { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { listInventory, type InventoryItem } from '../services/inventory';
import { listSales, type SaleListItem } from '../services/sales';
import { listPurchases, type PurchaseListItem } from '../services/purchases';
import { listExpenses, type ExpenseListItem } from '../services/expenses';

type ReportTab = 'inventory' | 'sales' | 'purchases' | 'summary';

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
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
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
    const name = activeTab === 'summary' ? 'Summary Report' : activeTab === 'inventory' ? 'Inventory Report' : activeTab === 'sales' ? 'Sales Report' : 'Purchases Report';
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
      } else if (activeTab === 'purchases') {
        const { purchases } = await listPurchases({ from: fromDate || undefined, to: toDate || undefined, limit: 200 });
        setPurchases(purchases);
      } else {
        const [invRes, salRes, purRes, expRes] = await Promise.all([
          listInventory({ from: fromDate || undefined, to: toDate || undefined, limit: 500 }),
          listSales({ from: fromDate || undefined, to: toDate || undefined, limit: 200 }),
          listPurchases({ from: fromDate || undefined, to: toDate || undefined, limit: 200 }),
          listExpenses({ from: fromDate || undefined, to: toDate || undefined, limit: 500 }),
        ]);
        setInventory(invRes.items);
        setSales(salRes.sales);
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
    window.print();
  };

  return (
    <div className="products-page">
      <h1>Reports</h1>
      <div className="products-panel" role="tabpanel">
        <div className="products-tabs" role="tablist" aria-label="Report types">
          <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory</button>
          <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Sales</button>
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
                        <td>{Number(s.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                    {sales.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No sales</td></tr>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;