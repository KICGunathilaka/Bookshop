import React, { useEffect, useMemo, useState } from 'react';
import { listInventory } from '../services/inventory';
import { createSale, getNextInvoiceNo } from '../services/sales';
import type { SaleItemInput, SaleInput } from '../services/sales';
import { useNotify } from '../contexts/NotificationContext';
// Removed metrics summary; Sales page focuses on creating product sales only

type InventoryOption = {
  inventory_id: number;
  product_name: string;
  brand?: string | null;
  selling_price?: number | null;
  stock_quantity?: number;
};

export default function Sales() {
  const { notifySuccess, notifyError } = useNotify();
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);
  const [items, setItems] = useState<SaleItemInput[]>([
    { inventoryId: 0, quantity: 1, unitPrice: 0, brand: null },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load inventory options for item selection
    async function loadInventory() {
      try {
        const res = await listInventory({ limit: 500 });
        const opts = (res?.items ?? []).map((it: any) => ({
          inventory_id: it.inventory_id,
          product_name: it.product_name,
          brand: it.brand ?? null,
          selling_price: it.selling_price ?? null,
          stock_quantity: it.stock_quantity ?? null,
        }));
        setInventoryOptions(opts);
      } catch (e) {
        console.error('Failed to load inventory', e);
      }
    }
    loadInventory();
  }, []);

  // Auto-fill next invoice number on mount if empty
  useEffect(() => {
    async function autofillInvoice() {
      try {
        if (!invoiceNo.trim()) {
          const { nextInvoiceNo } = await getNextInvoiceNo();
          setInvoiceNo(nextInvoiceNo ?? '');
        }
      } catch (e) {
        // Silent fail; user can still type manually
      }
    }
    autofillInvoice();
    // Only run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
  }, [items]);

  function updateItem(idx: number, patch: Partial<SaleItemInput>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }

  function addRow() {
    setItems(prev => [...prev, { inventoryId: 0, quantity: 1, unitPrice: 0, brand: null }]);
  }

  function removeRow(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    // Basic validation
    if (items.length === 0) {
      setError('Add at least one sale item');
      return;
    }
    for (const [i, it] of items.entries()) {
      if (!it.inventoryId || Number(it.inventoryId) <= 0) {
        setError(`Row ${i + 1}: select an inventory item`);
        return;
      }
      if (!Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0) {
        setError(`Row ${i + 1}: quantity must be > 0`);
        return;
      }
      if (!Number.isFinite(Number(it.unitPrice)) || Number(it.unitPrice) <= 0) {
        setError(`Row ${i + 1}: unit price must be > 0`);
        return;
      }
    }

    const payload: SaleInput = {
      invoiceNo: invoiceNo || null,
      saleDate: saleDate || null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      customerAddress: customerAddress || null,
      note: note || null,
      items,
    };
    setSubmitting(true);
    try {
      await createSale(payload);
      setMessage('Sale created successfully');
      notifySuccess('Sale created successfully');
      // Reset form
      setInvoiceNo('');
      setSaleDate('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setNote('');
      setItems([{ inventoryId: 0, quantity: 1, unitPrice: 0, brand: null }]);
    } catch (err: any) {
      console.error('Create sale error:', err);
      setError(err?.message || 'Failed to create sale');
      notifyError(err?.message || 'Failed to create sale');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="products-page">
      <h1>Sales</h1>
      <div className="products-panel" role="tabpanel">
        {/* Sales page no longer displays combined summary; see Dashboard */}

        {/* Create Sale Form at bottom */}
        <div className="panel-section">
          <h3>Create Sale</h3>
          {message && <div className="success-text" style={{ marginBottom: 10 }}>{message}</div>}
          {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}</div>}
          <form onSubmit={onSubmit}>
            <div className="products-filters" style={{ alignItems: 'flex-end' }}>
              <div>
                <label>Invoice No</label>
                <input
                  className="text-input"
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  onFocus={async () => {
                    if (!invoiceNo.trim()) {
                      try {
                        const { nextInvoiceNo } = await getNextInvoiceNo();
                        setInvoiceNo(nextInvoiceNo ?? '');
                      } catch {}
                    }
                  }}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label>Sale Date</label>
                <input className="text-input" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
              </div>
              <div>
                <label>Customer Name</label>
                <input className="text-input" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label>Customer Phone</label>
                <input className="text-input" type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Optional" />
              </div>
              <div style={{ gridColumn: '1 / span 2' }}>
                <label>Customer Address</label>
                <input className="text-input" type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Optional" />
              </div>
              <div style={{ gridColumn: '1 / span 2' }}>
                <label>Note</label>
                <textarea className="text-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add any notes..."></textarea>
              </div>
            </div>

            <div className="table-wrapper" style={{ marginTop: 16 }}>
              <table className="table" style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
                <colgroup>
                  <col style={{ width: '36%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Item (Product / Brand)</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                    <th>Brand</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineTotal = Number(it.quantity || 0) * Number(it.unitPrice || 0);
                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            className="text-input"
                            value={it.inventoryId || 0}
                            onChange={(e) => updateItem(idx, { inventoryId: Number(e.target.value) })}
                            style={{ width: '100%', boxSizing: 'border-box', maxWidth: 'none' }}
                          >
                            <option value={0}>Select inventory item</option>
                            {inventoryOptions.map(opt => (
                              <option key={opt.inventory_id} value={opt.inventory_id}>
                                {opt.product_name}{opt.brand ? ` — ${opt.brand}` : ''}{typeof opt.selling_price === 'number' ? ` — ${opt.selling_price}` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="text-input"
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                            style={{ textAlign: 'right', width: '100%', boxSizing: 'border-box' }}
                          />
                        </td>
                        <td>
                          <input
                            className="text-input"
                            type="number"
                            step="0.01"
                            min={0}
                            value={it.unitPrice}
                            onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                            style={{ textAlign: 'right', width: '100%', boxSizing: 'border-box' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>{lineTotal.toFixed(2)}</td>
                        <td>
                          <input
                            className="text-input"
                            type="text"
                            value={it.brand ?? ''}
                            onChange={(e) => updateItem(idx, { brand: e.target.value || null })}
                            placeholder="Optional"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                          />
                        </td>
                        <td>
                          <button type="button" className="secondary-button" onClick={() => removeRow(idx)} disabled={items.length === 1}>Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <button type="button" className="secondary-button" onClick={addRow}>+ Add Item</button>
                <div><strong>Total:</strong> {totalAmount.toFixed(2)}</div>
              </div>
            </div>

            <div className="inline-actions" style={{ marginTop: 16 }}>
              <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Sale'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}