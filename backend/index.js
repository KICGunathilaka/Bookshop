const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const vendorRoutes = require('./routes/vendors');
const purchaseRoutes = require('./routes/purchases');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');
const expensesRoutes = require('./routes/expenses');
const printshopSalesRoutes = require('./routes/printshopSales');
const printshopItemsRoutes = require('./routes/printshopItems');
const metricsRoutes = require('./routes/metrics');
const reportsRoutes = require('./routes/reports');
const seedAdmin = require('./seedAdmin');

// Load env vars
dotenv.config();
seedAdmin();

const app = express();

// Body parser
app.use(express.json());
app.use(cors());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/printshop-sales', printshopSalesRoutes);
app.use('/api/printshop-items', printshopItemsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/reports', reportsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));

