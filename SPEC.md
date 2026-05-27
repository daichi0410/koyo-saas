# 向陽 配車ノート — アプリ開発仕様書

> **Claude Code への指示書**  
> このファイルをコンテキストに渡して「この仕様書通りにアプリを構築してください」と伝えること。

---

## 1. プロジェクト概要

燃料配送会社「向陽」のドライバー配車管理Webアプリ。  
現状はGoogleスプレッドシートで管理しているデータを、Next.js + Supabaseに完全移行する。

**ゴール：**
- ドライバーが現場で給油した記録を入力しやすいWeb UI
- 配車担当者が週次・日次・ドライバーごとに配車を管理できるUI
- ドライバーごとのエリアマップ（住所ベース）で稼働エリアを可視化
- Vercelにデプロイ、スプレッドシートからの完全脱却

---

## 2. 技術スタック

| レイヤー | 技術 |
|------|------|
| フロントエンド | Next.js 14 (App Router, TypeScript) |
| スタイリング | Tailwind CSS |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| 地図 | Leaflet.js + `react-leaflet` |
| ORM | Supabase JS Client (`@supabase/supabase-js`) |
| デプロイ | Vercel |
| 移行スクリプト | Node.js (TypeScript) / `scripts/` 以下 |

---

## 3. ディレクトリ構成

```
/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # 認証済みレイアウト
│   │   ├── dashboard/page.tsx      # 本日の配車一覧
│   │   ├── map/page.tsx            # エリアマップ (機能②)
│   │   ├── deliveries/
│   │   │   ├── page.tsx            # 配車記録一覧（週次・日次フィルタ）
│   │   │   ├── new/page.tsx        # 新規配車記録入力 (機能①)
│   │   │   └── [id]/page.tsx       # 配車記録詳細・編集
│   │   └── drivers/page.tsx        # ドライバー管理
│   └── api/
│       └── geocode/route.ts        # 住所→緯度経度変換 API
├── components/
│   ├── map/
│   │   ├── DriverMap.tsx           # メインマップコンポーネント
│   │   ├── DriverFilter.tsx        # ドライバー表示切替
│   │   └── DeliveryMarker.tsx      # マーカー
│   ├── deliveries/
│   │   ├── DeliveryForm.tsx        # 入力フォーム
│   │   ├── DeliveryTable.tsx       # 一覧テーブル
│   │   └── DeliveryCard.tsx        # カード表示
│   └── ui/                         # 共通UIパーツ
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # ブラウザ用クライアント
│   │   └── server.ts               # サーバー用クライアント
│   └── types.ts                    # 型定義
├── scripts/
│   └── migrate-csv.ts              # ★ CSVからSupabaseへの移行スクリプト（後述）
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # テーブル定義
```

---

## 4. Supabase テーブル設計

```sql
-- supabase/migrations/001_initial_schema.sql

-- ドライバーマスタ
CREATE TABLE drivers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,          -- 例: '細田', '森谷'
  vehicle_no  TEXT,                   -- 例: '38', '40/41'
  color       TEXT NOT NULL DEFAULT '#4FC3F7',  -- マップ表示色
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 会社マスタ（オートコンプリート用）
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  tel         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 配車記録（メインテーブル）
CREATE TABLE deliveries (
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
CREATE TABLE recurring_schedules (
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
CREATE INDEX idx_deliveries_date        ON deliveries(date);
CREATE INDEX idx_deliveries_driver_id   ON deliveries(driver_id);
CREATE INDEX idx_deliveries_date_driver ON deliveries(date, driver_id);

-- RLS (Row Level Security) は認証後に追加予定
```

---

## 5. 初期データ（ドライバーマスタ）

```sql
INSERT INTO drivers (name, vehicle_no, color) VALUES
  ('細田',   '38',    '#FF6B6B'),
  ('内藤',   '40',    '#4ECDC4'),
  ('平野',   '36/40', '#45B7D1'),
  ('盛田',   '41',    '#A8E6CF'),
  ('森谷',   '40/41', '#FFD93D'),
  ('橋本',   '37/43', '#C77DFF'),
  ('横溝',   '34',    '#00D2D3'),
  ('高橋',   '39/43', '#FF9F43'),
  ('高野',   '大型',  '#98D8C8');
```

---

## 6. CSV移行スクリプト仕様

### 対象ファイルの構造（重要）

スプレッドシートをCSV出力したもの。セル結合のフラット化により以下の構造になっている。

```
Row: "2026年4月6日(月)"    → 日付セクション開始
Row: "大型　高野"          → ドライバーセクション開始
Row: "　細田　内藤"        → ドライバーセクション開始（複数ドライバー同行）
Row: "No | 時間指定 | ..."  → ヘッダー行（スキップ）
Row: "1 | - | 軽油 | 38 | 昭立造園 | 昭島市緑町3-16 | ..."  → 配車データ
```

### スクリプト: `scripts/migrate-csv.ts`

```typescript
// scripts/migrate-csv.ts
// 使い方: npx ts-node scripts/migrate-csv.ts <csvfile> [--dry-run]

import fs from 'fs';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// 解析ロジック:
// 1. 全行をスキャン
// 2. /20\d{2}年\d+月\d+日/ にマッチする行 → 現在の日付を更新
// 3. /　[細田|内藤|平野|盛田|森谷|橋本|横溝|高野|高橋]/ パターン → 現在のドライバーを更新
// 4. 先頭が数字 + 軽油|重油|灯油 が含まれる行 → 配車データとして抽出
// 5. 住所カラム（col[7]あたり）をジオコーディング → lat/lng
// 6. Supabaseのdeliveriesテーブルにupsert

// ジオコーディング: 国土地理院API (無料・日本語住所対応)
// https://msearch.gsi.go.jp/address-search/AddressSearch?q=<address>
async function geocode(address: string): Promise<{lat: number, lng: number} | null> {
  const res = await fetch(
    `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`
  );
  const data = await res.json();
  if (data?.length > 0) {
    const [lng, lat] = data[0].geometry.coordinates;
    return { lat, lng };
  }
  return null;
}
```

**ジオコーディングAPI**: 国土地理院（無料、日本語住所対応、API Key不要）を使うこと。  
URL: `https://msearch.gsi.go.jp/address-search/AddressSearch?q=<住所>`

---

## 7. 画面仕様

### 7-1. ダッシュボード (`/dashboard`)

```
┌──────────────────────────────────────────────────────┐
│ 向陽 配車ノート    [今日: 2026/05/26 火]   [+ 新規追加] │
├────────────┬─────────────────────────────────────────┤
│ 今日の配車  │ 未完了: 38件 / 完了: 12件 / 合計: 50件  │
│            ├─────────────────────────────────────────┤
│ ドライバー  │ [細田 9件] [内藤 1件] [平野 6件] ...     │
│ 別集計     │                                          │
└────────────┴─────────────────────────────────────────┘
```

- 本日の配車記録一覧（ドライバー別タブ）
- ステータス更新ボタン（未完了→完了）
- 定期配車の自動生成（毎朝バッチ or ページロード時）

### 7-2. エリアマップ (`/map`) ★ 機能②

既存の `haicha-map.html` をNext.jsコンポーネントとして移植する。

**追加機能（過去データが溜まったら活用）:**

```typescript
// ヒートマップ表示（頻度の高いエリアを濃く表示）
// react-leaflet の HeatLayer を使用
// データ: SELECT address, lat, lng, COUNT(*) as visits
//         FROM deliveries
//         WHERE driver_id = $driverId
//         GROUP BY address, lat, lng
//         ORDER BY visits DESC
```

- ドライバーフィルタ（複数選択）
- 期間フィルタ（先週・先月・全期間）
- 訪問頻度ヒートマップ切替ボタン
- 油種フィルタ（軽油/重油/灯油）
- マーカークリック → 配車詳細スライドパネル

### 7-3. 新規配車入力 (`/deliveries/new`) ★ 機能①

**UI要件（入力のしやすさを最優先）:**

```
日付:      [2026/05/26 ▼]  ← 今日がデフォルト
ドライバー: [細田 ▼]
会社名:    [_______________] ← オートコンプリート（過去の会社名から）
現場名:    [_______________] ← 任意
住所:      [_______________] ← 入力時にジオコーディング実行
油種:      [軽油] [重油] [灯油] ← ボタン選択
数量:      [____] L
時間指定:  [_______________] ← 例: 8:00〜9:00 / 夕方 / -
車両:      [38 ▼]
担当者/TEL:[_______________]
備考:      [_______________]

          [保存] [保存して続けて入力]
```

- **会社名のオートコンプリート**: 過去の`deliveries`から`company_name`を検索
- **住所入力時の自動マップ確認**: 入力後に小さなマッププレビューを表示
- **「続けて入力」ボタン**: 同じドライバーで次の現場を連続入力できる（ドライバー・日付を保持）

### 7-4. 配車記録一覧 (`/deliveries`)

- 週次ビュー / 日次ビュー の切替
- ドライバーフィルタ
- 油種フィルタ
- エクスポートボタン（CSV出力）

---

## 8. 認証

- Supabase Auth（メール + パスワード）
- ログインページ: `/login`
- 全ページ認証必須（middleware.tsでリダイレクト）
- 将来: ドライバーが自分の記録のみ編集可能にするRLS追加

---

## 9. 環境変数

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx   # 移行スクリプト用のみ
```

---

## 10. 実装の優先順位

### Phase 1（まず動くものを）
1. Supabaseプロジェクト作成 + テーブル作成（`001_initial_schema.sql`）
2. Next.jsプロジェクト作成（`create-next-app`）
3. Supabase Auth 実装（ログインページ + middleware）
4. ドライバーマスタ初期データ投入
5. エリアマップページ（`/map`）移植 ← **既存HTMLから移植**
6. 配車記録一覧ページ（`/deliveries`）
7. 新規配車入力フォーム（`/deliveries/new`）

### Phase 2（データ移行）
8. CSVパーサー＋移行スクリプト作成（`scripts/migrate-csv.ts`）
9. 過去データの住所をジオコーディング（国土地理院API）
10. Supabaseに一括インポート
11. ヒートマップ機能追加

### Phase 3（仕上げ）
12. ダッシュボード（`/dashboard`）
13. 定期配車自動生成
14. Vercelデプロイ設定
15. ドメイン設定

---

## 11. Claude Code への最初の指示文（コピペ用）

```
この SPEC.md の内容に従って、向陽配車ノートアプリを構築してください。

まず Phase 1 の 1〜4（Supabase設定・Next.js初期セットアップ・認証・マスタデータ）から始めてください。

技術要件:
- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Supabase JS Client
- react-leaflet（地図）
- デザインは haicha-map.html のダークテーマ（#0c0e1a ベース）を踏襲

開始前に以下を確認してください:
1. Supabase プロジェクトのURLとAnonKeyを環境変数に設定済みか
2. supabase/migrations/001_initial_schema.sql を実行済みか
```

---

## 付記：既存マップHTML（参考実装）

`haicha-map.html` に以下が実装済み：
- Leafletマップ（CartoDB darkタイル）
- ドライバー別カラーマーカー（58件プロット）
- ドライバーフィルタ / 油種フィルタ
- マーカークリック → 詳細スライドパネル
- ヘッダー統計（件数・稼働ドライバー数）

このHTMLを `/app/(app)/map/page.tsx` に移植する際は、
`react-leaflet` の `MapContainer`, `TileLayer`, `CircleMarker`, `Tooltip` を使うこと。
SSR無効化（`'use client'` + `dynamic import with { ssr: false }`）が必要。
