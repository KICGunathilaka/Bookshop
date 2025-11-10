import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addProduct, getProducts, updateProduct } from '../services/products';

type TabKey = 'list' | 'add' | 'edit';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ q: '', category: '', brand: '', min_price: '', max_price: '', from_date: '', to_date: '' });
  const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
  const [toDateObj, setToDateObj] = useState<Date | null>(null);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const payload = {
      product_name: String(data.get('product_name') || ''),
      category: (data.get('category') as string) || null,
      brand: (data.get('brand') as string) || null,
      unit: (data.get('unit') as string) || 'pcs',
      purchase_price: Number(data.get('purchase_price') || 0),
      selling_price: Number(data.get('selling_price') || 0),
      stock_quantity: Number(data.get('stock_quantity') || 0),
    };

    try {
      const res = await addProduct(payload);
      alert(`Product saved (ID: ${res.product.product_id})`);
      form.reset();
    } catch (err) {
      alert('Failed to save product');
      console.error(err);
    }
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire to backend API
    alert('Edit product submitted');
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.q) params.q = filters.q;
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.min_price) params.min_price = Number(filters.min_price);
      if (filters.max_price) params.max_price = Number(filters.max_price);
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      const res = await getProducts(params);
      setItems(res.items);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchList();
    }
  }, [activeTab]);

  const openEditModal = (product: any) => {
    setEditData(product);
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditData(null);
  };

  const [saving, setSaving] = useState(false);

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editData) return;
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get('product_name') || '').trim();
    const category = String(data.get('category') || '').trim();
    const brand = String(data.get('brand') || '').trim();
    const unit = String(data.get('unit') || '').trim();
    const purchaseStr = String(data.get('purchase_price') || '').trim();
    const sellingStr = String(data.get('selling_price') || '').trim();
    const stockStr = String(data.get('stock_quantity') || '').trim();

    const payload: any = {};
    if (name) payload.product_name = name;
    // Empty strings for category/brand mean clear to null
    if (category !== '') payload.category = category; else payload.category = null;
    if (brand !== '') payload.brand = brand; else payload.brand = null;
    if (unit) payload.unit = unit;
    if (purchaseStr !== '') payload.purchase_price = Number(purchaseStr);
    if (sellingStr !== '') payload.selling_price = Number(sellingStr);
    if (stockStr !== '') payload.stock_quantity = Number(stockStr);
    try {
      setSaving(true);
      const res = await updateProduct(editData.product_id, payload);
      // Update the item in local state
      setItems((prev) => prev.map((p) => (p.product_id === editData.product_id ? { ...p, ...res.product } : p)));
      closeEditModal();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to update product';
      alert(msg);
      console.error('Update error:', err?.response?.data || err);
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <div className="products-page">
      <h1>Products</h1>

      <div className="products-tabs" role="tablist" aria-label="Products actions">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
          role="tab"
          aria-selected={activeTab === 'list'}
        >
          Product List
        </button>
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
          role="tab"
          aria-selected={activeTab === 'add'}
        >
          Add Product
        </button>
        {/* Edit tab removed in favor of per-row edit actions */}
      </div>

      <div className="products-panel" role="tabpanel">
        {activeTab === 'list' && (
          <div>
            <div className="products-filters">
              <input
                type="text"
                placeholder="Search name/category/brand"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              />
              <input
                type="text"
                placeholder="Brand"
                value={filters.brand}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
              />
              <input
                type="number"
                placeholder="Min price"
                value={filters.min_price}
                onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
              />
              <input
                type="number"
                placeholder="Max price"
                value={filters.max_price}
                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
              />
              <div className="date-input">
                <DatePicker
                  selected={fromDateObj}
                  onChange={(date: Date | null) => {
                    setFromDateObj(date);
                    setFilters({ ...filters, from_date: date ? formatDate(date) : '' });
                  }}
                  placeholderText="From date"
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  className="react-datepicker-input"
                />
              </div>
              <div className="date-input">
                <DatePicker
                  selected={toDateObj}
                  onChange={(date: Date | null) => {
                    setToDateObj(date);
                    setFilters({ ...filters, to_date: date ? formatDate(date) : '' });
                  }}
                  placeholderText="To date"
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  className="react-datepicker-input"
                />
              </div>
              <button className="primary-button" onClick={fetchList}>Apply Filters</button>
              <button className="secondary-button" onClick={() => { setFromDateObj(null); setToDateObj(null); setFilters({ q: '', category: '', brand: '', min_price: '', max_price: '', from_date: '', to_date: '' }); fetchList(); }}>Reset</button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}

            {!loading && !error && (
              <div className="products-table-wrap">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Unit</th>
                      <th>Selling</th>
                      <th>Purchase</th>
                      <th>Stock</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.product_id}>
                        <td>{p.product_id}</td>
                        <td>{p.product_name}</td>
                        <td>{p.category || '-'}</td>
                        <td>{p.brand || '-'}</td>
                        <td>{p.unit}</td>
                        <td>{Number(p.selling_price).toFixed(2)}</td>
                        <td>{Number(p.purchase_price).toFixed(2)}</td>
                        <td>{p.stock_quantity}</td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="secondary-button" onClick={() => openEditModal(p)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No products found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="panel-section">
            <h2>Add Product</h2>
            <form onSubmit={handleAddSubmit} className="products-form compact">
              <label>
                Product Name
                <input type="text" name="product_name" required />
              </label>
              <label>
                Category
                <input type="text" name="category" />
              </label>
              <label>
                Brand
                <input type="text" name="brand" />
              </label>
              <label>
                Unit
                <select name="unit" defaultValue="pcs">
                  <option value="pcs">pcs</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                </select>
              </label>
              <label>
                Purchase Price
                <input type="number" step="0.01" min="0" name="purchase_price" />
              </label>
              <label>
                Selling Price
                <input type="number" step="0.01" min="0" name="selling_price" />
              </label>
              <label>
                Stock Quantity
                <input type="number" min="0" name="stock_quantity" />
              </label>
              <button className="primary-button" type="submit">Save Product</button>
            </form>
          </div>
        )}

        {/* Edit tab content removed; modal used instead */}
        {editOpen && editData && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <h2>Edit Product</h2>
              <form onSubmit={handleEditSave} className="products-form">
                <label>
                  Product Name
                  <input type="text" name="product_name" defaultValue={editData.product_name} required />
                </label>
                <label>
                  Category
                  <input type="text" name="category" defaultValue={editData.category || ''} />
                </label>
                <label>
                  Brand
                  <input type="text" name="brand" defaultValue={editData.brand || ''} />
                </label>
                <label>
                  Unit
                  <select name="unit" defaultValue={editData.unit || 'pcs'}>
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                  </select>
                </label>
                <label>
                  Purchase Price
                  <input type="number" step="0.01" min="0" name="purchase_price" defaultValue={editData.purchase_price} />
                </label>
                <label>
                  Selling Price
                  <input type="number" step="0.01" min="0" name="selling_price" defaultValue={editData.selling_price} />
                </label>
                <label>
                  Stock Quantity
                  <input type="number" min="0" name="stock_quantity" defaultValue={editData.stock_quantity} />
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="primary-button" type="submit">Save</button>
                  <button type="button" className="secondary-button" onClick={closeEditModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;