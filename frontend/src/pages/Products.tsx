import React, { useEffect, useState } from 'react';
import { addProduct, getProducts } from '../services/products';

type TabKey = 'list' | 'add' | 'edit';

const Products: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ q: '', category: '', brand: '', min_price: '', max_price: '' });

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
        <button
          className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
          role="tab"
          aria-selected={activeTab === 'edit'}
        >
          Edit Product
        </button>
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
              <button className="primary-button" onClick={fetchList}>Apply Filters</button>
              <button className="secondary-button" onClick={() => { setFilters({ q: '', category: '', brand: '', min_price: '', max_price: '' }); fetchList(); }}>Reset</button>
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
          <form onSubmit={handleAddSubmit}>
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
        )}

        {activeTab === 'edit' && (
          <form onSubmit={handleEditSubmit}>
            <label>
              Product ID
              <input type="number" name="product_id" required />
            </label>
            <label>
              Name
              <input type="text" name="name" />
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
              Selling Price
              <input type="number" step="0.01" name="selling_price" />
            </label>
            <label>
              Stock Quantity
              <input type="number" name="stock_quantity" />
            </label>
            <button className="primary-button" type="submit">Update Product</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Products;