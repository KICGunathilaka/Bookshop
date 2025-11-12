import React, { useEffect, useMemo, useState } from 'react';
import { listInventory, consumeInventory, type InventoryItem } from '../services/inventory';
import { createPrintshopSale, getNextInvoiceNo as getPsNextInvoiceNo } from '../services/printshopSales';
import type { SaleItemInput } from '../services/sales';
import { useNotify } from '../contexts/NotificationContext';

const PrintshopSales: React.FC = () => {
  const { notifySuccess, notifyError } = useNotify();
  const [query, setQuery] = useState('');
  const [loadingInv, setLoadingInv] = useState(false);
  const [invItems, setInvItems] = useState<InventoryItem[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [lineError, setLineError] = useState<string | null>(null);

  const [lines, setLines] = useState<SaleItemInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Printshop invoice fields
  const [psInvoiceNo, setPsInvoiceNo] = useState<string>('');
  const [psSaleDate, setPsSaleDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [psCustomerName, setPsCustomerName] = useState<string>('');
  const [psCustomerAddress, setPsCustomerAddress] = useState<string>('');
  const [psCustomerPhone, setPsCustomerPhone] = useState<string>('');
  const [psNote, setPsNote] = useState<string>('');
  const [creatingPs, setCreatingPs] = useState(false);
  const [psTotalAmount, setPsTotalAmount] = useState<number>(0);

  // Fetch inventory suggestions by query
  useEffect(() => {
    let cancelled = false;
    async function fetchInv() {
      setLoadingInv(true);
      try {
        const { items } = await listInventory({ q: query, limit: 20, minStock: 1 });
        if (!cancelled) setInvItems(items);
      } catch (e: any) {
        console.error('inventory fetch error', e);
      } finally {
        if (!cancelled) setLoadingInv(false);
      }
    }
    fetchInv();
    return () => { cancelled = true; };
  }, [query]);

  // When an inventory item is selected, set default price
  useEffect(() => {
    const inv = invItems.find(i => i.inventory_id === selectedInvId);
    if (inv) {
      const price = Number(inv.selling_price ?? inv.purchase_price ?? 0);
      setSelectedPrice(price > 0 ? price : 0);
      setLineError(null);
    }
  }, [selectedInvId, invItems]);

  const totalAmount = useMemo(() => lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0), [lines]);

  function addLine() {
    setLineError(null);
    const inv = invItems.find(i => i.inventory_id === selectedInvId);
    if (!inv) {
      setLineError('Select a product from inventory');
      return;
    }
    const qty = Number(selectedQty);
    const price = Number(selectedPrice);
    if (!Number.isFinite(qty) || qty <= 0) {
      setLineError('Quantity must be a positive number');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setLineError('Unit price must be a positive number');
      return;
    }
    // Merge if same inventoryId already exists
    setLines(prev => {
      const existingIdx = prev.findIndex(p => p.inventoryId === inv.inventory_id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: Number(copy[existingIdx].quantity) + qty,
          unitPrice: price, // latest price used
        };
        return copy;
      }
      return [...prev, { inventoryId: inv.inventory_id, quantity: qty, unitPrice: price, brand: inv.brand ?? null }];
    });
    setSelectedInvId(null);
    setSelectedQty(1);
    setSelectedPrice(0);
  }

  function removeLine(inventoryId: number) {
    setLines(prev => prev.filter(l => l.inventoryId !== inventoryId));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (lines.length === 0) {
      setError('Add at least one inventory item');
      return;
    }
    setSaving(true);
    try {
      // Reduce inventory and log to printshop_items with unit prices (no sale)
      await consumeInventory({
        items: lines.map(l => ({ inventoryId: l.inventoryId, quantity: l.quantity, unitPrice: l.unitPrice })),
        note: psNote || 'Printshop consumption',
      });
      setSuccess('Recorded. Inventory reduced and logged to printshop_items.');
      notifySuccess('Inventory reduced and logged to printshop_items');
      setLines([]);
      // Refresh inventory to reflect updated stock
      const { items } = await listInventory({ q: query, limit: 20, minStock: 1 });
      setInvItems(items);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  }

  // Fetch next invoice suggestion for printshop
  useEffect(() => {
    let cancelled = false;
    async function loadNext() {
      try {
        const { nextInvoiceNo } = await getPsNextInvoiceNo();
        if (!cancelled) setPsInvoiceNo(nextInvoiceNo);
      } catch (e) {
        // ignore
      }
    }
    loadNext();
    return () => { cancelled = true; };
  }, []);

  async function onCreatePrintshopSale(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCreatingPs(true);
    try {
      // If there are selected items, include them and create a printshop sale; otherwise require a valid totalAmount
      const payload: any = {
        invoiceNo: psInvoiceNo || null,
        saleDate: psSaleDate || null,
        customerName: psCustomerName || null,
        customerPhone: psCustomerPhone || null,
        customerAddress: psCustomerAddress || null,
        note: psNote || null,
      };
      if (lines.length > 0) {
        payload.items = lines.map(l => ({ inventoryId: l.inventoryId, quantity: l.quantity, unitPrice: l.unitPrice, brand: l.brand ?? null }));
      } else {
        if (!Number.isFinite(psTotalAmount) || psTotalAmount <= 0) {
          setError('Enter a valid total amount or add items from inventory');
          setCreatingPs(false);
          return;
        }
        payload.totalAmount = psTotalAmount;
      }

      await createPrintshopSale(payload);
      setSuccess(lines.length > 0 ? 'Printshop sale with items recorded.' : 'Printshop service sale recorded.');
      notifySuccess(lines.length > 0 ? 'Printshop sale with items recorded.' : 'Printshop service sale recorded.');
      if (lines.length > 0) {
        setLines([]);
        const { items } = await listInventory({ q: query, limit: 20, minStock: 1 });
        setInvItems(items);
      }
      const { nextInvoiceNo } = await getPsNextInvoiceNo();
      setPsInvoiceNo(nextInvoiceNo);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      notifyError(msg);
    } finally {
      setCreatingPs(false);
    }
  }

  return (
    <div className="products-page">
      <h1>Printshop & Sales</h1>
      <div className="products-panel" role="tabpanel">
        <div className="panel-section">
          <h3>Get Products from Inventory</h3>
          <form className="products-form compact" onSubmit={onSubmit}>
            <div className="products-filters" style={{ alignItems: 'flex-end' }}>
              <div>
                <label>Search Inventory</label>
                <input
                  className="text-input"
                  type="text"
                  placeholder="Type product or brand"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <div>
                <label>Select Item</label>
                <select
                  className="text-input"
                  value={selectedInvId ?? ''}
                  onChange={e => setSelectedInvId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">-- choose --</option>
                  {invItems.map(it => (
                    <option key={it.inventory_id} value={it.inventory_id}>
                      {it.product_name}{it.brand ? ` (${it.brand})` : ''} — stock {it.stock_quantity}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Quantity</label>
                <input
                  className="text-input"
                  type="number"
                  min={1}
                  value={selectedQty}
                  onChange={e => setSelectedQty(Number(e.target.value))}
                />
              </div>
              <div>
                <label>Unit Price</label>
                <input
                  className="text-input"
                  type="number"
                  min={0}
                  step={0.01}
                  value={selectedPrice}
                  onChange={e => setSelectedPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <button type="button" className="primary-button" onClick={addLine} disabled={loadingInv}>
                  Add Item
                </button>
              </div>
            </div>
            {lineError && <div className="error-text" style={{ marginTop: 8 }}>{lineError}</div>}

            {/* Selected lines table */}
            {lines.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(line => {
                      const inv = invItems.find(i => i.inventory_id === line.inventoryId);
                      const name = inv?.product_name ?? `#${line.inventoryId}`;
                      return (
                        <tr key={line.inventoryId}>
                          <td>{name}</td>
                          <td>{line.brand ?? '-'}</td>
                          <td>{line.quantity}</td>
                          <td>{line.unitPrice}</td>
                          <td>{(Number(line.quantity) * Number(line.unitPrice)).toFixed(2)}</td>
                          <td>
                            <button type="button" className="primary-button" onClick={() => removeLine(line.inventoryId)}>Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right' }}>Total</td>
                      <td colSpan={2}>{totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {error && <div className="error-text" style={{ marginTop: 8 }}>{error}</div>}
            {success && <div className="success-text" style={{ marginTop: 8 }}>{success}</div>}

            <div className="inline-actions" style={{ marginTop: 12 }}>
              <button type="submit" className="primary-button" disabled={saving || lines.length === 0}>
                {saving ? 'Recording…' : 'Record & Reduce Inventory'}
              </button>
            </div>
          </form>
        </div>
        <div className="panel-section" style={{ marginTop: 24 }}>
          <h3>Create Printshop Sale Invoice</h3>
          <form className="products-form compact" onSubmit={onCreatePrintshopSale}>
            <div className="products-filters" style={{ alignItems: 'flex-end' }}>
              <div>
                <label>Invoice No</label>
                <input
                  className="text-input"
                  type="text"
                  value={psInvoiceNo}
                  onChange={e => setPsInvoiceNo(e.target.value)}
                />
              </div>
              <div>
                <label>Date</label>
                <input
                  className="text-input"
                  type="date"
                  value={psSaleDate}
                  onChange={e => setPsSaleDate(e.target.value)}
                />
              </div>
              <div>
                <label>Customer Name</label>
                <input
                  className="text-input"
                  type="text"
                  placeholder="Optional"
                  value={psCustomerName}
                  onChange={e => setPsCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label>Address</label>
                <input
                  className="text-input"
                  type="text"
                  placeholder="Optional"
                  value={psCustomerAddress}
                  onChange={e => setPsCustomerAddress(e.target.value)}
                />
              </div>
              <div>
                <label>Phone</label>
                <input
                  className="text-input"
                  type="tel"
                  placeholder="Optional"
                  value={psCustomerPhone}
                  onChange={e => setPsCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <label>Note</label>
                <input
                  className="text-input"
                  type="text"
                  placeholder="Optional"
                  value={psNote}
                  onChange={e => setPsNote(e.target.value)}
                />
              </div>
              <div>
                <label>Total Amount</label>
                <input
                  className="text-input"
                  type="number"
                  min={0}
                  step={0.01}
                  value={Number.isFinite(psTotalAmount) ? psTotalAmount : 0}
                  onChange={e => setPsTotalAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="inline-actions" style={{ marginTop: 12 }}>
              <button type="submit" className="primary-button" disabled={creatingPs}>
                {creatingPs ? 'Creating Invoice…' : 'Create Printshop Invoice'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrintshopSales;