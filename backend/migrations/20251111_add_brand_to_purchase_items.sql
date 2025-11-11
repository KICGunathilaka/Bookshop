-- Add brand column to purchase_items and ensure before-insert trigger is a no-op
ALTER TABLE purchase_items
    ADD COLUMN IF NOT EXISTS brand VARCHAR(50);

-- Replace the trigger function to avoid referencing non-existent NEW fields
CREATE OR REPLACE FUNCTION before_insert_purchase_item()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger binding (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_before_insert_purchase_item'
    ) THEN
        CREATE TRIGGER trg_before_insert_purchase_item
        BEFORE INSERT ON purchase_items
        FOR EACH ROW
        EXECUTE FUNCTION before_insert_purchase_item();
    END IF;
END;
$$;