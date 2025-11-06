const express = require('express');
const dotenv = require('dotenv');
const books = require('./routes/books');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Mount routers
app.use('/api/books', books);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));