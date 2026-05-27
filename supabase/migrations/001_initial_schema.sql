-- 向陽 配車ノート — 初期スキーマ
-- supabase/migrations/001_initial_schema.sql

-- ドライバーマスタ
CREATE TABLE IF NOT EXISTS drivers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,          -- 例: '細田', '森谷'
  vehicle_no  TEXT,                   -- 例: '38', '40/41'
  color       TEXT NOT NULL DEFAULT '#4FC3F7',  -- マップ表示色
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 会社マスタ（オートコンプリート用）
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  tel         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 配車記録（メインテーブル）
CREATE TABLE IF NOT EXISTS deliveries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  driver_id    UUID REFERENCES drivers(id),
  company_id   UUID REFERENCES companies(id),  -- NULL可（新規現場）
  company_name TEXT NOT NULL,      -- 非正規化（検索用）
  site_name    TEXT,               -- 現場名（会社と異なる場合）
  address      TEXT,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  oil_type     TEXT NOT NULL CHECK (oil_type IN ('軽油', '重油', '灯油')),
  quantity     NUMERIC,            -- 数量(L)
  vehicle_no   TEXT,               -- 車両番号（その日の担当車）
  time_spec    TEXT,               -- 時間指定（例: '8:00~9:00', '夕方', '-'）
  tel          TEXT,               -- 連絡先
  contact_name TEXT,               -- 担当者名
  notes        TEXT,               -- 備考
  status       TEXT NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  source       TEXT DEFAULT 'manual',  -- 'manual' | 'csv_import'
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 定期配車マスタ（毎週〇曜など）
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id    UUID REFERENCES drivers(id),
  company_name TEXT NOT NULL,
  address      TEXT,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  oil_type     TEXT NOT NULL,
  days_of_week INTEGER[],  -- 0=日, 1=月, ..., 6=土
  time_spec    TEXT,
  tel          TEXT,
  notes        TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_deliveries_date        ON deliveries(date);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id   ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_date_driver ON deliveries(date, driver_id);
CREATE INDEX IF NOT EXISTS idx_drivers_is_active      ON drivers(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_name         ON companies(name);

-- updated_at自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- deliveriesテーブルにトリガーを設定
DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) ポリシー
-- 注意: RLSを有効にする前に、認証済みユーザーのみアクセス可能にする

-- driversテーブル
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーはdrivers閲覧可能" ON drivers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "認証済みユーザーはdrivers追加可能" ON drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "認証済みユーザーはdrivers更新可能" ON drivers
  FOR UPDATE
  TO authenticated
  USING (true);

-- companiesテーブル
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーはcompanies閲覧可能" ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "認証済みユーザーはcompanies追加可能" ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "認証済みユーザーはcompanies更新可能" ON companies
  FOR UPDATE
  TO authenticated
  USING (true);

-- deliveriesテーブル
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーはdeliveries閲覧可能" ON deliveries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "認証済みユーザーはdeliveries追加可能" ON deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "認証済みユーザーはdeliveries更新可能" ON deliveries
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "認証済みユーザーはdeliveries削除可能" ON deliveries
  FOR DELETE
  TO authenticated
  USING (true);

-- recurring_schedulesテーブル
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーはrecurring_schedules閲覧可能" ON recurring_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "認証済みユーザーはrecurring_schedules追加可能" ON recurring_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "認証済みユーザーはrecurring_schedules更新可能" ON recurring_schedules
  FOR UPDATE
  TO authenticated
  USING (true);
