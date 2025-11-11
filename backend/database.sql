



-- ==========================================================
-- BOOK & PRINTING SHOP MANAGEMENT SYSTEM DATABASE
-- ==========================================================

-- Drop old tables if exist (for re-creation)
DROP TABLE IF EXISTS printshop_sale_items, printshop_sales, printshop_items,
  sale_items, sales, purchase_items, purchases, inventory_items,
  products, vendors, expenses CASCADE;

-- ==========================================================
-- Users
-- ==========================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
-- Products / Stock
-- ==========================================================
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    unit VARCHAR(20) DEFAULT 'pcs',
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

CREATE TABLE inventory_items (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    brand VARCHAR(50),
    purchase_price NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Purchase Items (Details)
-- ==========================================================
CREATE TABLE purchase_items (
    purchase_item_id SERIAL PRIMARY KEY,
    purchase_id INT REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    inventory_id INT REFERENCES inventory_items(inventory_id) ON DELETE CASCADE,
    brand VARCHAR(50),
    quantity INT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ==========================================================
-- Sales (Header)
-- ==========================================================
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(50),
    sale_date DATE DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) DEFAULT 0,
	customer_name VARCHAR(100),
	customer_phone VARCHAR(15),
	customer_address TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Sale Items (Details)
-- ==========================================================
CREATE TABLE sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(sale_id) ON DELETE CASCADE,
    inventory_id INT REFERENCES inventory_items(inventory_id) ON DELETE SET NULL,
    brand VARCHAR(50),
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
-- AFTER INSERT: Increase stock in inventory_items
-- ==========================================================
CREATE OR REPLACE FUNCTION increase_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE inventory_id = NEW.inventory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increase_stock_after_purchase
AFTER INSERT ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION increase_stock_after_purchase();

-- ==========================================================
-- AFTER INSERT: Decrease stock in inventory_items
-- ==========================================================
CREATE OR REPLACE FUNCTION decrease_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE inventory_id = NEW.inventory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrease_stock_after_sale
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock_after_sale();

-- ==========================================================
-- AFTER DELETE: Revert stock for purchase_items and sale_items
-- ==========================================================
CREATE OR REPLACE FUNCTION revert_stock_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'purchase_items' THEN
        UPDATE inventory_items
        SET stock_quantity = stock_quantity - OLD.quantity
        WHERE inventory_id = OLD.inventory_id;
    ELSIF TG_TABLE_NAME = 'sale_items' THEN
        UPDATE inventory_items
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE inventory_id = OLD.inventory_id;
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
-- BEFORE INSERT: Handle inventory creation and assign inventory_id
-- ==========================================================
CREATE OR REPLACE FUNCTION before_insert_purchase_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Controller provides inventory_id; no-op to avoid referencing non-existent NEW.product_id/vendor_id
    -- If future inserts omit inventory_id, consider computing it externally.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_before_insert_purchase_item
BEFORE INSERT ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION before_insert_purchase_item();

-- ==========================================================
-- Printshop Sales (Header)
-- ==========================================================
CREATE TABLE printshop_sales (
    printshop_sale_id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(50),
    sale_date DATE DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12,2) DEFAULT 0,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- Printshop Sale Items (Details)
-- ==========================================================
CREATE TABLE printshop_sale_items (
    printshop_sale_item_id SERIAL PRIMARY KEY,
    printshop_sale_id INT REFERENCES printshop_sales(printshop_sale_id) ON DELETE CASCADE,
    inventory_id INT REFERENCES inventory_items(inventory_id) ON DELETE CASCADE,
    brand VARCHAR(50),
    quantity INT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ==========================================================
-- Printshop Items (Direct Consumption Logs)
-- ==========================================================
CREATE TABLE printshop_items (
    printshop_item_id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES inventory_items(inventory_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id),
    brand VARCHAR(50),
    quantity INT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- PRINTSHOP: Stock Triggers for Sale Items
-- ==========================================================
CREATE OR REPLACE FUNCTION decrement_stock_on_insert_printshop()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE inventory_id = NEW.inventory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_stock_on_insert_printshop
AFTER INSERT ON printshop_sale_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_insert_printshop();

CREATE OR REPLACE FUNCTION revert_stock_on_delete_printshop()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET stock_quantity = stock_quantity + OLD.quantity
    WHERE inventory_id = OLD.inventory_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_revert_stock_on_delete_printshop
AFTER DELETE ON printshop_sale_items
FOR EACH ROW
EXECUTE FUNCTION revert_stock_on_delete_printshop();

-- ==========================================================
-- PRINTSHOP: Stock Triggers for Direct Consumption (printshop_items)
-- ==========================================================
CREATE OR REPLACE FUNCTION decrement_stock_on_insert_printshop_items()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE inventory_id = NEW.inventory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_stock_on_insert_printshop_items
AFTER INSERT ON printshop_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_insert_printshop_items();

CREATE OR REPLACE FUNCTION revert_stock_on_delete_printshop_items()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET stock_quantity = stock_quantity + OLD.quantity
    WHERE inventory_id = OLD.inventory_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_revert_stock_on_delete_printshop_items
AFTER DELETE ON printshop_items
FOR EACH ROW
EXECUTE FUNCTION revert_stock_on_delete_printshop_items();