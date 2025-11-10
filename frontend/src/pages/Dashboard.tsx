import React from 'react';
import { NavLink } from 'react-router-dom';

const Dashboard: React.FC = () => {
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
        </ul>
      </nav>
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <p>Welcome! You can build out this page later.</p>
      </div>
    </div>
  );
};

export default Dashboard;