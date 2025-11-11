import React, { useEffect, useMemo, useState } from 'react';
import { listInventory, type InventoryItem } from '../services/inventory';

type Severity = 'low' | 'critical';

const DISMISS_WINDOW_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const LS_KEY = 'dismissedAlerts';

const getDismissedMap = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const setDismissedAt = (id: string, ts: number) => {
  const map = getDismissedMap();
  map[id] = ts;
  localStorage.setItem(LS_KEY, JSON.stringify(map));
};

const isDismissed = (id: string): boolean => {
  const map = getDismissedMap();
  const ts = map[id];
  if (!ts) return false;
  return Date.now() - Number(ts) < DISMISS_WINDOW_MS;
};

const Alert: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch items with stock below 50 (maxStock=49)
        const res = await listInventory({ maxStock: 49, limit: 1000 });
        setItems(res.items || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const alerts = useMemo(() => {
    const filtered = items
      .map(it => {
        const severity: Severity = Number(it.stock_quantity) < 10 ? 'critical' : 'low';
        return { ...it, severity } as InventoryItem & { severity: Severity };
      })
      .filter(it => !isDismissed(String(it.inventory_id)));
    // Sort critical first
    return filtered.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
  }, [items]);

  const dismiss = (invId: number) => {
    setDismissedAt(String(invId), Date.now());
    // Optimistic update
    const remaining = alerts.filter(a => a.inventory_id !== invId);
    setItems(remaining);
  };

  return (
    <div className="products-page">
      <h1>Alerts</h1>
      <div className="products-panel" role="tabpanel">
        <div className="panel-section">
          <p>Low stock notifications. Dismissed alerts stay hidden for 5 days.</p>
        </div>
        <div className="panel-section">
          {loading && <div>Loading...</div>}
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          {!loading && !error && (
            <div className="products-table-wrap">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(it => {
                    const isCritical = it.severity === 'critical';
                    const markStyle: React.CSSProperties = {
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      color: isCritical ? '#842029' : '#664d03',
                      backgroundColor: isCritical ? '#f8d7da' : '#fff3cd',
                      border: `1px solid ${isCritical ? '#f5c2c7' : '#ffecb5'}`,
                    };
                    return (
                      <tr key={it.inventory_id}>
                        <td>{it.product_name}</td>
                        <td>{it.brand || '-'}</td>
                        <td>{it.stock_quantity}</td>
                        <td>
                          <span style={markStyle}>{isCritical ? 'Critical' : 'Low'}</span>
                        </td>
                        <td>
                          <button className="secondary-button" onClick={() => dismiss(it.inventory_id)}>Dismiss</button>
                        </td>
                      </tr>
                    );
                  })}
                  {alerts.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted-text)' }}>No alerts</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;