import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addProduct, getProducts } from '../services/products';
import { useNotify } from '../contexts/NotificationContext';

type TabKey = 'list' | 'add' | 'edit';

const Products: React.FC = () => {
  const { notifySuccess, notifyError } = useNotify();
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ q: '', category: '', unit: '', from_date: '', to_date: '' });
  const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
  const [toDateObj, setToDateObj] = useState<Date | null>(null);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  // Edit functionality removed for simplified schema

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const payload = {
      product_name: String(data.get('product_name') || ''),
      category: (data.get('category') as string) || null,
      unit: (data.get('unit') as string) || 'pcs',
    };

    try {
      const res = await addProduct(payload);
      notifySuccess('Product saved');
      form.reset();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.message || 'Failed to save product';
      notifyError(serverMsg);
      console.error(err);
    }
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire to backend API
    notifySuccess('Edit product submitted');
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.q) params.q = filters.q;
      if (filters.category) params.category = filters.category;
      if (filters.unit) params.unit = filters.unit;
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

  // Edit modal removed

  // const [saving, setSaving] = useState(false);

  // Edit save removed

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
                placeholder="Search name/category/unit"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              />
              <select
                value={filters.unit}
                onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
              >
                <option value="">Any unit</option>
                <option value="pcs">pcs</option>
                <option value="box">box</option>
                <option value="pack">pack</option>
              </select>
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
              <button className="secondary-button" onClick={() => { setFromDateObj(null); setToDateObj(null); setFilters({ q: '', category: '', unit: '', from_date: '', to_date: '' }); fetchList(); }}>Reset</button>
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
                      <th>Unit</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.product_id}>
                        <td>{p.product_id}</td>
                        <td>{p.product_name}</td>
                        <td>{p.category || '-'}</td>
                        <td>{p.unit}</td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No products found</td>
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
                Unit
                <select name="unit" defaultValue="pcs">
                  <option value="pcs">pcs</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                </select>
              </label>
              <button className="primary-button" type="submit">Save Product</button>
            </form>
          </div>
        )}
        {/* Edit functionality removed for simplified schema */}
      </div>
    </div>
  );
};

export default Products;