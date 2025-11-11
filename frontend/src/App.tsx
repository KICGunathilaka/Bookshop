import React, { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import Products from './pages/Products';
import Vendors from './pages/Vendors';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const handleLoginSuccess = (user: { user_id: number; username: string }) => {
    setIsLoggedIn(true);
    setUsername(user.username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername(null);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {isLoggedIn ? (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/purchases" element={<Purchases />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/sales" element={<Sales />} />
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
        {isLoggedIn && (
          <div className="app-actions" aria-label="Top actions">
            <Link to="/" className="secondary-button" title="Go to Dashboard">Home</Link>
            <button className="primary-button" onClick={handleLogout} title="Logout">Logout</button>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
