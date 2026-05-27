-- 向陽 配車ノート — ドライバーマスタ初期データ
-- supabase/migrations/002_seed_drivers.sql

INSERT INTO drivers (name, vehicle_no, color) VALUES
('細田',   '38',    '#FF6B6B'),
('内藤',   '40',    '#4ECDC4'),
('平野',   '36/40', '#45B7D1'),
('盛田',   '41',    '#A8E6CF'),
('森谷',   '40/41', '#FFD93D'),
('橋本',   '37/43', '#C77DFF'),
('横溝',   '34',    '#00D2D3'),
('高橋',   '39/43', '#FF9F43'),
('高野',   '大型',  '#98D8C8')
ON CONFLICT DO NOTHING;
