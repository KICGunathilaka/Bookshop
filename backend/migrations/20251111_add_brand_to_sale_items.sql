-- Add brand column to sale_items
ALTER TABLE sale_items
    ADD COLUMN IF NOT EXISTS brand VARCHAR(50);