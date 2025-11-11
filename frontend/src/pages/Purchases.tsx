import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchVendors, type Vendor } from '../services/vendors';
import { searchProducts } from '../services/products';
import { createPurchase, type PurchaseItemInput, getNextInvoiceNo, listPurchases, type PurchaseListItem } from '../services/purchases';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Purchases: React.FC = () => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(true);

  const [vendorQuery, setVendorQuery] = useState('');
  const [vendorSuggestions, setVendorSuggestions] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);

  type Row = {
    productQuery: string;
    productId: number | null;
    productSuggestions: { product_id: number; product_name: string }[];
    showProductSuggestions?: boolean;
    brand: string;
    quantity: number;
    unitPrice: number;
  };
  const [rows, setRows] = useState<Row[]>([
    { productQuery: '', productId: null, productSuggestions: [], showProductSuggestions: false, brand: '', quantity: 1, unitPrice: 0 },
  ]);

  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseDateObj, setPurchaseDateObj] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // View Purchases filters and data
  const [viewInvoiceQuery, setViewInvoiceQuery] = useState('');
  const [viewVendorQuery, setViewVendorQuery] = useState('');
  const [viewVendorSuggestions, setViewVendorSuggestions] = useState<Vendor[]>([]);
  const [viewVendorId, setViewVendorId] = useState<number | null>(null);
  const [viewFromDateObj, setViewFromDateObj] = useState<Date | null>(null);
  const [viewToDateObj, setViewToDateObj] = useState<Date | null>(null);
  const [viewFromDate, setViewFromDate] = useState('');
  const [viewToDate, setViewToDate] = useState('');
  const [viewPurchases, setViewPurchases] = useState<PurchaseListItem[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  // Debounced vendor search
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (vendorQuery.trim().length === 0) {
        setVendorSuggestions([]);
        return;
      }
      try {
        const items = await searchVendors(vendorQuery.trim());
        setVendorSuggestions(items);
        setShowVendorSuggestions(items.length > 0);
        // try exact match to set id
        const match = items.find(v => v.vendor_name.toLowerCase() === vendorQuery.trim().toLowerCase());
        setVendorId(match ? match.vendor_id : null);
      } catch (e) {
        // ignore
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [vendorQuery]);

  // Product search per row
  const updateRowProductQuery = (idx: number, value: string) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], productQuery: value };
      return copy;
    });
  };

  useEffect(() => {
    const handle = setTimeout(async () => {
      // search products for each row independently
      setRows(prev => {
        return prev.map(r => ({ ...r }));
      });
      for (let i = 0; i < rows.length; i++) {
        const q = rows[i].productQuery.trim();
        if (q.length === 0) {
          setRows(prev => {
            const copy = [...prev];
            copy[i] = { ...copy[i], productSuggestions: [], productId: null };
            return copy;
          });
          continue;
        }
        try {
          const items = await searchProducts(q);
          setRows(prev => {
            const copy = [...prev];
            copy[i] = { ...copy[i], productSuggestions: items.map(p => ({ product_id: p.product_id, product_name: p.product_name })), showProductSuggestions: items.length > 0 };
            // exact match sets productId
            const match = items.find(p => p.product_name.toLowerCase() === q.toLowerCase());
            copy[i].productId = match ? match.product_id : null;
            return copy;
          });
        } catch (e) {
          // ignore
        }
      }
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map(r => r.productQuery).join('|')]);

  const addRow = () => {
    setRows(prev => [...prev, { productQuery: '', productId: null, productSuggestions: [], showProductSuggestions: false, brand: '', quantity: 1, unitPrice: 0 }]);
  };
  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };
  const updateRow = (idx: number, patch: Partial<Row>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const totalAmount = useMemo(() => rows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0), 0), [rows]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Vendor suggestions for View filters
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (viewVendorQuery.trim().length === 0) {
        setViewVendorSuggestions([]);
        setViewVendorId(null);
        return;
      }
      try {
        const items = await searchVendors(viewVendorQuery.trim());
        setViewVendorSuggestions(items);
        const match = items.find(v => v.vendor_name.toLowerCase() === viewVendorQuery.trim().toLowerCase());
        setViewVendorId(match ? match.vendor_id : null);
      } catch {}
    }, 250);
    return () => clearTimeout(handle);
  }, [viewVendorQuery]);

  // Fetch purchases when filters change
  useEffect(() => {
    const fetchPurchases = async () => {
      if (showCreate) return;
      setViewLoading(true);
      setViewError(null);
      try {
        const { purchases } = await listPurchases({
          q: viewInvoiceQuery || undefined,
          vendorId: viewVendorId || undefined,
          from: viewFromDate || undefined,
          to: viewToDate || undefined,
          limit: 100,
        });
        setViewPurchases(purchases);
      } catch (e: any) {
        setViewError(e?.message || 'Failed to load purchases');
        setViewPurchases([]);
      } finally {
        setViewLoading(false);
      }
    };
    fetchPurchases();
  }, [showCreate, viewInvoiceQuery, viewVendorId, viewFromDate, viewToDate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    // basic validation
    if (rows.length === 0) {
      setError('Add at least one item');
      return;
    }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.productId) {
        setError(`Select a product for item ${i + 1}`);
        return;
      }
      if (!Number.isFinite(Number(r.quantity)) || Number(r.quantity) <= 0) {
        setError(`Enter a valid quantity for item ${i + 1}`);
        return;
      }
      if (!Number.isFinite(Number(r.unitPrice)) || Number(r.unitPrice) <= 0) {
        setError(`Enter a valid unit price for item ${i + 1}`);
        return;
      }
    }
    const payload = {
      vendorId,
      invoiceNo: invoiceNo || null,
      purchaseDate: purchaseDate || null,
      note: note || null,
      items: rows.map<PurchaseItemInput>(r => ({ productId: r.productId!, quantity: Number(r.quantity), unitPrice: Number(r.unitPrice), brand: r.brand || null })),
    };
    setSaving(true);
    try {
      await createPurchase(payload);
      setSuccess('Purchase saved');
      // reset
      setVendorQuery('');
      setVendorId(null);
      setInvoiceNo('');
      setPurchaseDate('');
      setPurchaseDateObj(null);
      setNote('');
      setRows([{ productQuery: '', productId: null, productSuggestions: [], showProductSuggestions: false, brand: '', quantity: 1, unitPrice: 0 }]);
    } catch (err: any) {
      setError(err?.message || 'Failed to save purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="products-page">
      <h1>Purchases</h1>
      <div className="products-panel" role="tabpanel">
        <div className="panel-section">
          <div className="inline-actions" style={{ gap: 10 }}>
            <button className={`primary-button${showCreate ? ' active' : ''}`} onClick={() => setShowCreate(true)}>Create Purchase</button>
            <button className={`primary-button${!showCreate ? ' active' : ''}`} onClick={() => setShowCreate(false)}>View Purchases</button>
          </div>
        </div>
        {showCreate && (
          <div className="panel-section">
            <form onSubmit={onSubmit}>
              <div className="products-filters" style={{ alignItems: 'flex-end' }}>
                <div>
                  <label>Vendor</label>
                  <div className="input-with-suggestions">
                    <input
                      type="text"
                      placeholder="Type vendor name"
                      value={vendorQuery}
                      onChange={(e) => setVendorQuery(e.target.value)}
                      onFocus={() => setShowVendorSuggestions(vendorSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowVendorSuggestions(false), 150)}
                      className="text-input"
                    />
                    {showVendorSuggestions && vendorSuggestions.length > 0 && (
                      <div className="suggestions">
                        {vendorSuggestions.map(v => (
                          <div
                            key={v.vendor_id}
                            className="suggestion-item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setVendorQuery(v.vendor_name);
                              setVendorId(v.vendor_id);
                              setShowVendorSuggestions(false);
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
                  <label>Invoice No</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    onFocus={async () => {
                      if (!invoiceNo.trim()) {
                        try {
                          const { nextInvoiceNo } = await getNextInvoiceNo();
                          setInvoiceNo(nextInvoiceNo ?? '');
                        } catch {}
                      }
                    }}
                    className="text-input"
                  />
                </div>
                <div>
                  <label>Date</label>
                  <DatePicker
                    selected={purchaseDateObj}
                    onChange={(date) => {
                      const d = (date as Date | null) || null;
                      setPurchaseDateObj(d);
                      setPurchaseDate(formatDate(d));
                    }}
                    placeholderText="Select purchase date"
                    dateFormat="yyyy-MM-dd"
                    isClearable
                    className="react-datepicker-input"
                  />
                </div>
              </div>

              <div className="products-table-wrap" style={{ marginTop: 12 }}>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th style={{ width: '34%' }}>Product</th>
                      <th style={{ width: '16%' }}>Brand</th>
                      <th style={{ width: '12%' }}>Quantity</th>
                      <th style={{ width: '18%' }}>Unit Price</th>
                      <th style={{ width: '10%' }}>Total</th>
                      <th style={{ width: '10%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="input-with-suggestions">
                            <input
                              type="text"
                              placeholder="Type product name"
                              value={r.productQuery}
                              onChange={e => updateRowProductQuery(idx, e.target.value)}
                              onFocus={() => updateRow(idx, { showProductSuggestions: (r.productSuggestions?.length ?? 0) > 0 })}
                              onBlur={() => setTimeout(() => updateRow(idx, { showProductSuggestions: false }), 150)}
                              className="text-input"
                            />
                            {r.showProductSuggestions && r.productSuggestions.length > 0 && (
                              <div className="suggestions">
                                {r.productSuggestions.map(p => (
                                  <div
                                    key={p.product_id}
                                    className="suggestion-item"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      updateRow(idx, { productQuery: p.product_name, productId: p.product_id, showProductSuggestions: false });
                                    }}
                                  >
                                    <div className="suggestion-title">{p.product_name}</div>
                                    <div className="suggestion-meta">ID: {p.product_id}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <input type="text" value={r.brand}
                            onChange={e => updateRow(idx, { brand: e.target.value })}
                            placeholder="Brand (optional)"
                            className="text-input" />
                        </td>
                        <td>
                          <input type="number" min={1} value={r.quantity}
                            onChange={e => updateRow(idx, { quantity: Number(e.target.value) })}
                            className="text-input" />
                        </td>
                        <td>
                          <input type="number" min={0} step="0.01" value={r.unitPrice}
                            onChange={e => updateRow(idx, { unitPrice: Number(e.target.value) })}
                            className="text-input" />
                        </td>
                        <td>{((Number(r.quantity) || 0) * (Number(r.unitPrice) || 0)).toFixed(2)}</td>
                        <td>
                          <button type="button" className="secondary-button" onClick={() => removeRow(idx)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                  <button type="button" className="secondary-button" onClick={addRow}>Add Item</button>
                  <div style={{ fontWeight: 600 }}>Total: {totalAmount.toFixed(2)}</div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Note</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add any notes (optional)"
                  rows={4}
                />
              </div>

              {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
              {success && <div style={{ color: 'var(--success)', marginTop: 8 }}>{success}</div>}

              <div className="inline-actions" style={{ marginTop: 12 }}>
                <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save Purchase'}</button>
              </div>
            </form>
          </div>
        )}
        {!showCreate && (
          <div className="panel-section">
            <div className="products-filters" style={{ alignItems: 'flex-end' }}>
              <div>
                <label>Vendor</label>
                <div className="input-with-suggestions">
                  <input
                    type="text"
                    placeholder="Type vendor name"
                    value={viewVendorQuery}
                    onChange={(e) => setViewVendorQuery(e.target.value)}
                    className="text-input"
                  />
                  {viewVendorSuggestions.length > 0 && (
                    <div className="suggestions">
                      {viewVendorSuggestions.map(v => (
                        <div
                          key={v.vendor_id}
                          className="suggestion-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setViewVendorQuery(v.vendor_name);
                            setViewVendorId(v.vendor_id);
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
                <label>Invoice No</label>
                <input type="text" value={viewInvoiceQuery} onChange={e => setViewInvoiceQuery(e.target.value)} className="text-input" />
              </div>
              <div>
                <label>From</label>
                <DatePicker
                  selected={viewFromDateObj}
                  onChange={(date) => {
                    const d = (date as Date | null) || null;
                    setViewFromDateObj(d);
                    setViewFromDate(formatDate(d));
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
                  selected={viewToDateObj}
                  onChange={(date) => {
                    const d = (date as Date | null) || null;
                    setViewToDateObj(d);
                    setViewToDate(formatDate(d));
                  }}
                  placeholderText="To date"
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  className="react-datepicker-input"
                />
              </div>
            </div>

            {viewLoading ? (
              <div>Loading purchases...</div>
            ) : viewError ? (
              <div style={{ color: 'var(--danger)' }}>{viewError}</div>
            ) : (
              <div style={{ marginTop: 12 }}>
                {viewPurchases.length === 0 ? (
                  <div>No purchases found.</div>
                ) : (
                  viewPurchases.map(p => (
                    <div key={p.purchase_id} className="panel-section" style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.invoice_no || '(no invoice)'}</div>
                          <div className="suggestion-meta">{p.vendor_name || '(no vendor)'} • {p.purchase_date}</div>
                        </div>
                        <div style={{ fontWeight: 600 }}>Total: {Number(p.total_amount).toFixed(2)}</div>
                      </div>
                      {p.items && p.items.length > 0 && (
                        <div className="products-table-wrap" style={{ marginTop: 8 }}>
                          <table className="products-table">
                            <thead>
                              <tr>
                                <th style={{ width: '40%' }}>Product</th>
                                <th style={{ width: '20%' }}>Brand</th>
                                <th style={{ width: '20%' }}>Quantity</th>
                                <th style={{ width: '20%' }}>Unit Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.items.map((it, idx) => (
                                <tr key={idx}>
                                  <td>{it.product_name}</td>
                                  <td>{it.brand || ''}</td>
                                  <td>{it.quantity}</td>
                                  <td>{Number(it.unit_price).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        {/* Removed additional Create Purchase button in View mode */}
      </div>
    </div>
  );
};

export default Purchases;