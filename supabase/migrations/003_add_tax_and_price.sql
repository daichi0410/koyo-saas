-- 免税番号と販売単価のカラムを追加
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS tax_exempt_number TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);

-- コメント追加
COMMENT ON COLUMN deliveries.tax_exempt_number IS '免税番号';
COMMENT ON COLUMN deliveries.unit_price IS '販売単価（円/L）';
