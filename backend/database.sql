-- ==========================================================
-- BOOK & PRINTING SHOP MANAGEMENT SYSTEM DATABASE
-- ==========================================================

-- Drop old tables if exist (for re-creation)
DROP TABLE IF EXISTS sale_items, sales, purchase_items, purchases, products, vendors, customers, expenses CASCADE;

-- ==========================================================
-- Vendors
-- ==========================================================
CREATE TABLE vendors (
    vendor_id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Customers
-- ==========================================================
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Products / Stock
-- ==========================================================
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    brand VARCHAR(50),
    unit VARCHAR(20) DEFAULT 'pcs',
    purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Purchases (Header)
-- ==========================================================
CREATE TABLE purchases (
    purchase_id SERIAL PRIMARY KEY,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    invoice_no VARCHAR(50),
    purchase_date DATE DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Purchase Items (Details)
-- ==========================================================
CREATE TABLE purchase_items (
    purchase_item_id SERIAL PRIMARY KEY,
    purchase_id INT REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ==========================================================
-- Sales (Header)
-- ==========================================================
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id) ON DELETE SET NULL,
    invoice_no VARCHAR(50),
    sale_date DATE DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Sale Items (Details)
-- ==========================================================
CREATE TABLE sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(sale_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ==========================================================
-- Expenses
-- ==========================================================
CREATE TABLE expenses (
    expense_id SERIAL PRIMARY KEY,
    expense_name VARCHAR(100) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
--  TRIGGERS FOR STOCK MANAGEMENT
-- ==========================================================

--Increase stock when purchase item is inserted
CREATE OR REPLACE FUNCTION increase_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increase_stock_after_purchase
AFTER INSERT ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION increase_stock_after_purchase();

--Decrease stock when sale item is inserted
CREATE OR REPLACE FUNCTION decrease_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrease_stock_after_sale
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock_after_sale();

--Revert stock if sale or purchase item deleted
CREATE OR REPLACE FUNCTION revert_stock_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'purchase_items' THEN
        UPDATE products
        SET stock_quantity = stock_quantity - OLD.quantity
        WHERE product_id = OLD.product_id;
    ELSIF TG_TABLE_NAME = 'sale_items' THEN
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE product_id = OLD.product_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_revert_stock_on_delete_purchase
AFTER DELETE ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION revert_stock_on_delete();

CREATE TRIGGER trg_revert_stock_on_delete_sale
AFTER DELETE ON sale_items
FOR EACH ROW
EXECUTE FUNCTION revert_stock_on_delete();


-- ==========================================================
-- ✅ PROFIT / LOSS QUERY EXAMPLE
-- ==========================================================
-- Monthly profit/loss summary
/*
SELECT
    TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM') AS month,
    COALESCE(SUM(si.total_price),0) AS total_sales,
    COALESCE(SUM(pi.total_price),0) AS total_purchases,
    COALESCE(SUM(e.amount),0) AS total_expenses,
    (COALESCE(SUM(si.total_price),0) - COALESCE(SUM(pi.total_price),0) - COALESCE(SUM(e.amount),0)) AS profit_or_loss
FROM sales s
LEFT JOIN sale_items si ON s.sale_id = si.sale_id
LEFT JOIN purchases p ON DATE_TRUNC('month', p.purchase_date) = DATE_TRUNC('month', s.sale_date)
LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
LEFT JOIN expenses e ON DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', s.sale_date)
GROUP BY DATE_TRUNC('month', s.sale_date)
ORDER BY month;
*/
