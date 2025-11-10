import React, { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import Products from './pages/Products';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
        </Routes>
        <div className="app-actions">
          <p className="app-user">Logged in as: {username}</p>
          <button className="primary-button" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
