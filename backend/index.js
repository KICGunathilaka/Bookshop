const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));

