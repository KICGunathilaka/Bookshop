import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';

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
    <div className="App">
      <Dashboard />
      <div style={{ marginTop: '1rem' }}>
        <p>Logged in as: {username}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default App;
