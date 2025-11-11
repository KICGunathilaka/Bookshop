import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { listInventory, type InventoryItem } from '../services/inventory';
import { getProducts } from '../services/products';
import { getVendors } from '../services/vendors';
import { listSales, type SaleListItem } from '../services/sales';
import { listPrintshopSales, type PrintshopSaleListItem } from '../services/printshopSales';
import { getSalesSummary } from '../services/metrics';
import { listExpenses } from '../services/expenses';
import { listPurchases } from '../services/purchases';

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

const isDismissed = (id: string): boolean => {
  const map = getDismissedMap();
  const ts = map[id];
  if (!ts) return false;
  return Date.now() - Number(ts) < DISMISS_WINDOW_MS;
};

const Dashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [alertCount, setAlertCount] = useState<number>(0);
  const [hasCritical, setHasCritical] = useState<boolean>(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [vendorCount, setVendorCount] = useState<number>(0);
  const [inventoryCount, setInventoryCount] = useState<number>(0);
  const [todaySales, setTodaySales] = useState<number>(0);
  const [monthRevenue, setMonthRevenue] = useState<number>(0);
  const [weeklySales, setWeeklySales] = useState<Array<{ date: string; bookshop: number; printshop: number }>>([]);
  const [topProduct, setTopProduct] = useState<{ name: string; brand: string | null; units: number } | null>(null);
  const [todayExpenses, setTodayExpenses] = useState<number>(0);
  const [todayPurchases, setTodayPurchases] = useState<number>(0);
  const [vendorPurchases, setVendorPurchases] = useState<Array<{ vendor: string; total: number }>>([]);

  useEffect(() => {
    const run = async () => {
      try {
        // Alerts (low stock) for badge
        const invLowRes = await listInventory({ maxStock: 49, limit: 1000 });
        const lowItems: InventoryItem[] = invLowRes.items || [];
        const notDismissed = lowItems.filter(it => !isDismissed(String(it.inventory_id)));
        setAlertCount(notDismissed.length);
        setHasCritical(notDismissed.some(it => Number(it.stock_quantity) < 10));

        // Counts for tiles
        const [prodRes, vendRes, invAllRes] = await Promise.all([
          getProducts({}),
          getVendors({}),
          listInventory({ limit: 1000 }),
        ]);
        setProductCount((prodRes.items ?? []).length);
        setVendorCount((vendRes.items ?? []).length);
        setInventoryCount((invAllRes.items ?? []).length);

        // Sales summary
        const today = new Date();
        const to = today.toISOString().slice(0, 10);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).toISOString().slice(0, 10);

        const salesForMonth = await listSales({ from: monthStart, to, limit: 1000 });
        const salesToday = await listSales({ from: to, to, limit: 1000 });
        const salesWeek = await listSales({ from: sevenDaysAgo, to, limit: 1000 });
        const psSalesWeek = await listPrintshopSales({ from: sevenDaysAgo, to, limit: 1000 });
        const expensesToday = await listExpenses({ from: to, to, limit: 1000 });
        const purchasesToday = await listPurchases({ from: to, to, limit: 1000 });
        const purchasesMonth = await listPurchases({ from: monthStart, to, limit: 1000 });

        const sum = (arr: SaleListItem[]) => arr.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
        // Initially set bookshop-only values
        setMonthRevenue(sum(salesForMonth.sales));
        setTodaySales(sum(salesToday.sales));
        setTodayExpenses((expensesToday.expenses || []).reduce((acc, e) => acc + Number(e.amount || 0), 0));
        setTodayPurchases((purchasesToday.purchases || []).reduce((acc, p) => acc + Number(p.total_amount || 0), 0));

        // Aggregate purchases by vendor for pie chart (month)
        const byVendor = new Map<string, number>();
        for (const p of (purchasesMonth.purchases || [])) {
          const name = p.vendor_name || 'Unknown';
          byVendor.set(name, (byVendor.get(name) || 0) + Number(p.total_amount || 0));
        }
        const pieArr = Array.from(byVendor.entries()).map(([vendor, total]) => ({ vendor, total }))
          .sort((a, b) => b.total - a.total);
        setVendorPurchases(pieArr);

        // Compute most moving product from month sales
        const totals = new Map<number, { name: string; brand: string | null; units: number }>();
        for (const s of salesForMonth.sales) {
          for (const it of (s.items || [])) {
            const prev = totals.get(it.product_id) || { name: it.product_name, brand: it.brand ?? null, units: 0 };
            prev.units += Number(it.quantity || 0);
            totals.set(it.product_id, prev);
          }
        }
        let best: { name: string; brand: string | null; units: number } | null = null;
        for (const v of totals.values()) {
          if (!best || v.units > best.units) best = v;
        }
        setTopProduct(best);

        // Aggregate by day for the week (bookshop)
        const byDayBook = new Map<string, number>();
        for (const s of salesWeek.sales) {
          const d = String(s.sale_date).slice(0, 10);
          byDayBook.set(d, (byDayBook.get(d) || 0) + Number(s.total_amount || 0));
        }
        // Aggregate by day for the week (printshop)
        const byDayPrint = new Map<string, number>();
        for (const s of psSalesWeek.sales) {
          const d = String(s.sale_date).slice(0, 10);
          byDayPrint.set(d, (byDayPrint.get(d) || 0) + Number(s.total_amount || 0));
        }
        // Ensure all 7 days present
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
          const ds = d.toISOString().slice(0, 10);
          dates.push(ds);
        }
        setWeeklySales(dates.map(ds => ({ date: ds, bookshop: byDayBook.get(ds) || 0, printshop: byDayPrint.get(ds) || 0 })));

        // Override tiles with combined Bookshop + Printshop totals
        try {
          const summary = await getSalesSummary();
          setTodaySales(Number(summary.today.total || 0));
          setMonthRevenue(Number(summary.month.total || 0));
        } catch {}
      } catch (e) {
        // Fail silently on dashboard; keep placeholders
      }
    };
    run();
  }, []);

  const weeklyMax = useMemo(() => Math.max(1, ...weeklySales.map(d => Math.max(d.bookshop, d.printshop))), [weeklySales]);
  const pieTotal = useMemo(() => vendorPurchases.reduce((acc, v) => acc + v.total, 0), [vendorPurchases]);
  const pieSegments = useMemo(() => {
    let startDeg = 0;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f472b6'];
    return vendorPurchases.map((v, i) => {
      const percent = pieTotal > 0 ? (v.total / pieTotal) * 100 : 0;
      const deg = (percent / 100) * 360;
      const seg = { label: v.vendor, total: v.total, percent, color: colors[i % colors.length], startDeg, endDeg: startDeg + deg };
      startDeg += deg;
      return seg;
    });
  }, [vendorPurchases, pieTotal]);
  const pieStyle: React.CSSProperties = useMemo(() => ({
    background: pieSegments.length > 0
      ? `conic-gradient(${pieSegments.map(s => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`).join(', ')})`
      : 'conic-gradient(#e5e7eb 0deg 360deg)'
  }), [pieSegments]);

  const badgeStyle: React.CSSProperties = alertCount > 0 ? {
    display: 'inline-block',
    minWidth: 20,
    padding: '0 6px',
    marginRight: 8,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: hasCritical ? '#842029' : '#664d03',
    backgroundColor: hasCritical ? '#f8d7da' : '#fff3cd',
    border: `1px solid ${hasCritical ? '#f5c2c7' : '#ffecb5'}`,
  } : {};

  return (
    <div className="dashboard-layout">
      <nav className="sidebar">
        <div className="sidebar-brand">Bookshop</div>
        <ul className="sidebar-menu">
          <li>
            <NavLink
              to="/products"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              Products
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/vendors"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              Vendors
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/purchases"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              Purchases
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/inventory"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              Inventory
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/sales"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              Sales
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/printshop-sales"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              Printshop & Sales
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/expenses"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              Daily Expenses
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reports"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              Reports
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/alerts"
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              {alertCount > 0 && <span style={badgeStyle}>{alertCount}</span>}
              Alert
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <div className="dashboard-summary" aria-label="Summary tiles">
          <div className="summary-grid">
            <div className="summary-tile primary">
              <div className="tile-header">
                <span className="tile-title">Today's Sales</span>
                <span className="tile-icon">💸</span>
              </div>
              <div className="tile-value">Rs {todaySales.toFixed(2)}</div>
              <div className="tile-sub">vs yesterday 0%</div>
            </div>

            <div className="summary-tile success">
              <div className="tile-header">
                <span className="tile-title">Monthly Revenue</span>
                <span className="tile-icon">📈</span>
              </div>
              <div className="tile-value">Rs {monthRevenue.toFixed(2)}</div>
              <div className="tile-sub">updated live</div>
            </div>

            <div className="summary-tile expense">
              <div className="tile-header">
                <span className="tile-title">Today's Expenses</span>
                <span className="tile-icon">🧾</span>
              </div>
              <div className="tile-value">Rs {todayExpenses.toFixed(2)}</div>
              <div className="tile-sub">operational spend</div>
            </div>

            <div className="summary-tile purchase">
              <div className="tile-header">
                <span className="tile-title">Today's Purchases</span>
                <span className="tile-icon">🛒</span>
              </div>
              <div className="tile-value">Rs {todayPurchases.toFixed(2)}</div>
              <div className="tile-sub">supplier payments</div>
            </div>

            <div className="summary-tile warning">
              <div className="tile-header">
                <span className="tile-title">Stock Alerts</span>
                <span className="tile-icon">⚠️</span>
              </div>
              <div className="tile-value">{alertCount}</div>
              <div className="tile-sub">{hasCritical ? 'critical under 10' : 'under 50 threshold'}</div>
            </div>

            <div className="summary-tile top-product">
              <div className="tile-header">
                <span className="tile-title">Most Moving Product</span>
                <span className="tile-icon">🔥</span>
              </div>
              <div className="tile-value">{topProduct ? topProduct.name : '-'}</div>
              <div className="tile-sub">{topProduct ? `${topProduct.units} units sold` : 'No recent sales'}</div>
            </div>
          </div>
        </div>
        {/* Details section with chart and more tiles */}
        <div className="dashboard-details" aria-label="Detailed insights" style={{ marginTop: 16 }}>
          <div className="details-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">Daily Sales (Last 7 Days)</div>
                <div className="chart-meta">Max Rs {weeklyMax.toFixed(2)}</div>
              </div>
              <div className="bar-chart">
                {weeklySales.map((d, idx) => {
                  const hBook = Math.round((d.bookshop / weeklyMax) * 120);
                  const hPrint = Math.round((d.printshop / weeklyMax) * 120);
                  const dayLabel = new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' });
                  return (
                    <div key={d.date + idx} className="bar-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 124 }}>
                        <div className="bar" style={{ height: hBook, width: 14, background: '#3b82f6' }} title={`Bookshop Rs ${d.bookshop.toFixed(2)}`}></div>
                        <div className="bar" style={{ height: hPrint, width: 14, background: '#10b981' }} title={`Printshop Rs ${d.printshop.toFixed(2)}`}></div>
                      </div>
                      <div className="bar-label" style={{ marginTop: 4 }}>{dayLabel}</div>
                    </div>
                  );
                })}
              </div>
              <div className="chart-legend" style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, backgroundColor: '#3b82f6', display: 'inline-block', borderRadius: 2 }}></span>
                  <span>Bookshop</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, backgroundColor: '#10b981', display: 'inline-block', borderRadius: 2 }}></span>
                  <span>Printshop</span>
                </div>
              </div>
            </div>

            <div className="chart-card pie-card">
              <div className="chart-header">
                <div className="chart-title">Purchases by Vendor</div>
                <div className="chart-meta">last 30 days</div>
              </div>
              {pieSegments.length > 0 ? (
                <div className="pie-wrap">
                  <div className="pie-chart" style={pieStyle} aria-label="Purchases distribution">
                    <div className="pie-center">Rs {pieTotal.toFixed(2)}</div>
                  </div>
                  <div className="pie-legend">
                    {pieSegments.map(s => (
                      <div className="legend-item" key={s.label} title={`Rs ${s.total.toFixed(2)}`}>
                        <span className="legend-dot" style={{ background: s.color }}></span>
                        <span className="legend-label">{s.label}</span>
                        <span className="legend-value">{s.percent.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="muted-text">No purchases in period</div>
              )}
            </div>

            {/* Most Moving Product tile moved to summary section */}
          </div>
        </div>
        <div className="dashboard-watermark" aria-label="Watermark">Powered by blommtech.lk</div>
      </div>
      {onLogout && (
        <div className="dashboard-bottom-left" aria-label="Dashboard actions">
          <div className="sidebar-ghost">
            <button className="navlink" onClick={onLogout} title="Logout">Logout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;