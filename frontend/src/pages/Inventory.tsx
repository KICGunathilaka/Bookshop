import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { searchVendors, type Vendor } from '../services/vendors';
import { listInventory, type InventoryItem } from '../services/inventory';

const Inventory: React.FC = () => {
  const [q, setQ] = useState('');
  const [vendorQuery, setVendorQuery] = useState('');
  const [vendorSuggestions, setVendorSuggestions] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [brand, setBrand] = useState('');
  const [minStock, setMinStock] = useState<string>('');
  const [maxStock, setMaxStock] = useState<string>('');
  const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
  const [toDateObj, setToDateObj] = useState<Date | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Debounced vendor search
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (vendorQuery.trim().length === 0) {
        setVendorSuggestions([]);
        setVendorId(null);
        return;
      }
      try {
        const items = await searchVendors(vendorQuery.trim());
        setVendorSuggestions(items);
        const match = items.find(v => v.vendor_name.toLowerCase() === vendorQuery.trim().toLowerCase());
        setVendorId(match ? match.vendor_id : null);
      } catch {}
    }, 250);
    return () => clearTimeout(handle);
  }, [vendorQuery]);

  // Fetch inventory when filters change
  useEffect(() => {
    const fetchInv = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listInventory({
          q: q || undefined,
          vendorId: vendorId || undefined,
          brand: brand || undefined,
          minStock: minStock ? Number(minStock) : undefined,
          maxStock: maxStock ? Number(maxStock) : undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          limit: 200,
        });
        setItems(res.items);
      } catch (e: any) {
        setError(e?.message || 'Failed to load inventory');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInv();
  }, [q, vendorId, brand, minStock, maxStock, fromDate, toDate]);

  const totalStockValue = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.stock_quantity) * Number(it.purchase_price || 0), 0),
    [items]
  );

  return (
    <div className="products-page">
      <h1>Inventory</h1>
      <div className="products-panel" role="tabpanel">
        <div className="products-filters" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>Search</label>
            <input
              type="text"
              placeholder="Product or brand"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="text-input"
            />
          </div>
          <div>
            <label>Vendor</label>
            <div className="input-with-suggestions">
              <input
                type="text"
                placeholder="Type vendor name"
                value={vendorQuery}
                onChange={e => setVendorQuery(e.target.value)}
                className="text-input"
              />
              {vendorSuggestions.length > 0 && (
                <div className="suggestions">
                  {vendorSuggestions.map(v => (
                    <div
                      key={v.vendor_id}
                      className="suggestion-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setVendorQuery(v.vendor_name);
                        setVendorId(v.vendor_id);
                      }}
                    >
                      <div className="suggestion-title">{v.vendor_name}</div>
                      <div className="suggestion-meta">{v.email || v.contact_number || ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label>Brand</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="text-input" />
          </div>
          <div>
            <label>Min Stock</label>
            <input type="number" min={0} value={minStock} onChange={e => setMinStock(e.target.value)} className="text-input" />
          </div>
          <div>
            <label>Max Stock</label>
            <input type="number" min={0} value={maxStock} onChange={e => setMaxStock(e.target.value)} className="text-input" />
          </div>
          <div>
            <label>From</label>
            <DatePicker
              selected={fromDateObj}
              onChange={(date) => {
                const d = (date as Date | null) || null;
                setFromDateObj(d);
                setFromDate(formatDate(d));
              }}
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
              onChange={(date) => {
                const d = (date as Date | null) || null;
                setToDateObj(d);
                setToDate(formatDate(d));
              }}
              placeholderText="To date"
              dateFormat="yyyy-MM-dd"
              isClearable
              className="react-datepicker-input"
            />
          </div>
        </div>

        {loading ? (
          <div>Loading inventory...</div>
        ) : error ? (
          <div style={{ color: 'var(--danger)' }}>{error}</div>
        ) : (
          <div className="products-table-wrap" style={{ marginTop: 12 }}>
            <table className="products-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Product</th>
                  <th style={{ width: '18%' }}>Brand</th>
                  <th style={{ width: '22%' }}>Vendor</th>
                  <th style={{ width: '12%' }}>Stock</th>
                  <th style={{ width: '10%' }}>Buy Price</th>
                  <th style={{ width: '10%' }}>Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6}>No inventory items found.</td></tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.inventory_id}>
                      <td>{it.product_name}</td>
                      <td>{it.brand || ''}</td>
                      <td>{it.vendor_name || ''}</td>
                      <td>{it.stock_quantity}</td>
                      <td>{Number(it.purchase_price || 0).toFixed(2)}</td>
                      <td>{(Number(it.stock_quantity) * Number(it.purchase_price || 0)).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="inline-actions" style={{ justifyContent: 'space-between', marginTop: 8 }}>
              <div className="suggestion-meta">Showing {items.length} items</div>
              <div style={{ fontWeight: 600 }}>Total Stock Value: {totalStockValue.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;