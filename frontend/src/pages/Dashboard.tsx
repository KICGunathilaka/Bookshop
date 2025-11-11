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