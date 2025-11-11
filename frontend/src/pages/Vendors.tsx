import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addVendor, getVendors } from '../services/vendors';
import { useNotify } from '../contexts/NotificationContext';

type TabKey = 'list' | 'add';

const Vendors: React.FC = () => {
  const { notifySuccess, notifyError } = useNotify();
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ q: '', from_date: '', to_date: '' });
  const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
  const [toDateObj, setToDateObj] = useState<Date | null>(null);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.q) params.q = filters.q;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      const res = await getVendors(params);
      setItems(res.items);
    } catch (err) {
      setError('Failed to fetch vendors');
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

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const payload = {
      vendor_name: String(data.get('vendor_name') || ''),
      contact_number: (data.get('contact_number') as string) || null,
      email: (data.get('email') as string) || null,
      address: (data.get('address') as string) || null,
    };

    try {
      const res = await addVendor(payload);
      notifySuccess('Vendor saved');
      form.reset();
      setActiveTab('list');
      fetchList();
    } catch (err) {
      notifyError('Failed to save vendor');
      console.error(err);
    }
  };

  return (
    <div className="products-page">
      <h1>Vendors</h1>

      <div className="products-tabs" role="tablist">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
          role="tab"
          aria-selected={activeTab === 'list'}
        >
          Vendor List
        </button>
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
          role="tab"
          aria-selected={activeTab === 'add'}
        >
          Add Vendor
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="products-panel">
          <div className="products-filters">
            <input
              type="text"
              placeholder="Search name/contact/email"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
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
            <button className="secondary-button" onClick={() => { setFromDateObj(null); setToDateObj(null); setFilters({ q: '', from_date: '', to_date: '' }); fetchList(); }}>Reset</button>
          </div>
          <div className="products-table-wrap">
            {loading && <p>Loading...</p>}
            {error && <p className="error-text">{error}</p>}
            {!loading && !error && (
              <table className="products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>No vendors found</td>
                    </tr>
                  ) : (
                    items.map((v) => (
                      <tr key={v.vendor_id}>
                        <td>{v.vendor_id}</td>
                        <td>{v.vendor_name}</td>
                        <td>{v.contact_number || '-'}</td>
                        <td>{v.email || '-'}</td>
                        <td>{v.address || '-'}</td>
                        <td>{new Date(v.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="products-panel">
          <div className="panel-section">
            <h2>Add Vendor</h2>
            <form className="products-form compact" onSubmit={handleAddSubmit}>
              <label>
                <span>Vendor Name</span>
                <input type="text" name="vendor_name" placeholder="Acme Corp" required />
              </label>
              <label>
                <span>Contact Number</span>
                <input type="text" name="contact_number" placeholder="+94 71 234 5678" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" name="email" placeholder="vendor@example.com" />
              </label>
              <label className="grid-col-span-2">
                <span>Address</span>
                <input type="text" name="address" placeholder="Street, City" />
              </label>
              <button type="submit" className="primary-button">Save Vendor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;