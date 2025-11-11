import React, { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import Products from './pages/Products';
import Vendors from './pages/Vendors';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Alert from './pages/Alert';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

// Top-right actions bar, hidden on Dashboard route
const TopActions: React.FC<{
  isLoggedIn: boolean;
  onLogout: () => void;
}> = ({ isLoggedIn, onLogout }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  if (!isLoggedIn || isDashboard) return null;
  return (
    <div className="app-actions" aria-label="Top actions">
      <Link to="/" className="primary-button" title="Go to Dashboard">Home</Link>
      <button className="primary-button" onClick={onLogout} title="Logout">Logout</button>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLoginSuccess = (user: { user_id: number; username: string }) => {
    setIsLoggedIn(true);
    setUsername(user.username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername(null);
  };

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {isLoggedIn ? (
            <>
              <Route path="/" element={<Dashboard onLogout={requestLogout} />} />
              <Route path="/products" element={<Products />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/purchases" element={<Purchases />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/alerts" element={<Alert />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginPage onLogin={handleLoginSuccess} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
        <TopActions isLoggedIn={isLoggedIn} onLogout={requestLogout} />

        {showLogoutConfirm && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <div className="modal-card">
              <h2 id="logout-title">Confirm Logout</h2>
              <p>Are you sure you want to log out?</p>
              <div className="inline-actions" style={{ marginTop: 12 }}>
                <button className="secondary-button" onClick={() => setShowLogoutConfirm(false)}>No</button>
                <button
                  className="primary-button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
