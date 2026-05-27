/**
 * 向陽配車ノート CSVコンバーター
 *
 * 使い方:
 * npx ts-node scripts/convert-csv.ts <入力CSVファイル> [出力CSVファイル]
 *
 * 例:
 * npx ts-node scripts/convert-csv.ts ~/Downloads/配車ノート.csv ~/Downloads/import.csv
 */

import * as fs from 'fs';
import * as path from 'path';

// ドライバー名のマッピング（名前 → Supabase UUID）
// 実際のUUIDはSupabaseで確認して更新してください
const DRIVER_MAP: Record<string, string> = {
  '細田': '',
  '内藤': '',
  '平野': '',
  '盛田': '',
  '森谷': '',
  '橋本': '',
  '横溝': '',
  '高橋': '',
  '高野': '',
  '山本': '',
  '大型': '',
};

// 既知のドライバー名パターン
const DRIVER_NAMES = ['細田', '内藤', '平野', '盛田', '森谷', '橋本', '横溝', '高橋', '高野', '山本', '大型', '未割当', '代行'];

interface DeliveryRecord {
  date: string;
  driver_name: string;
  driver_id: string;
  time_spec: string;
  oil_type: string;
  vehicle_no: string;
  company_name: string;
  site_name: string;
  address: string;
  notes: string;
  status: string;
}

function parseDate(dateStr: string): string | null {
  // "2026年4月6日(月)" → "2026-04-06"
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

function isDriverSection(cell: string): string | null {
  const trimmed = cell.trim().replace(/　/g, '');
  for (const name of DRIVER_NAMES) {
    if (trimmed === name || trimmed === `　${name}` || trimmed === `${name}　`) {
      return name;
    }
  }
  return null;
}

function normalizeOilType(oil: string): string {
  const trimmed = oil.trim();
  if (trimmed.includes('軽油')) return '軽油';
  if (trimmed.includes('重油')) return '重油';
  if (trimmed.includes('灯油')) return '灯油';
  return trimmed;
}

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else if (char === '\r') {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function convertCSV(inputPath: string): DeliveryRecord[] {
  const content = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(content);

  const records: DeliveryRecord[] = [];
  let currentDate = '';
  let leftDriver = '';
  let rightDriver = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // 日付行をチェック
    const dateMatch = parseDate(row[0] || '');
    if (dateMatch) {
      currentDate = dateMatch;
      leftDriver = '';
      rightDriver = '';
      continue;
    }

    // ドライバーセクションヘッダーをチェック
    // 左側のドライバー（列0または列1）
    const leftDriverCheck = isDriverSection(row[0] || '') || isDriverSection(row[1] || '');
    // 右側のドライバー（列9または列10）
    const rightDriverCheck = isDriverSection(row[9] || '') || isDriverSection(row[10] || '');

    if (leftDriverCheck && leftDriverCheck !== '未割当' && leftDriverCheck !== '代行') {
      leftDriver = leftDriverCheck;
    }
    if (rightDriverCheck && rightDriverCheck !== '未割当' && rightDriverCheck !== '代行') {
      rightDriver = rightDriverCheck;
    }

    // ヘッダー行をスキップ
    if (row[0] === 'No' || row[1] === '時間指定' || row[1] === '担当') continue;
    if (row[9] === '時間指定' || row[10] === '時間指定') continue;

    // 車両状況行をスキップ
    if ((row[0] || '').includes('車両状況')) continue;

    // データ行を処理
    if (!currentDate) continue;

    // 左側のデータ（列0-8）
    if (leftDriver && leftDriver !== '大型') {
      const no = (row[0] || '').trim();
      const timeSpec = (row[1] || '').trim();
      const oilType = normalizeOilType(row[2] || '');
      const vehicleNo = (row[3] || row[4] || '').trim();
      const companyName = (row[5] || '').trim();
      const siteName = (row[6] || '').trim();
      const address = (row[7] || '').trim();
      const notes = (row[8] || '').trim();

      // 数字のNoがあり、会社名があれば有効なレコード
      if (companyName && oilType && !['', '-'].includes(companyName)) {
        records.push({
          date: currentDate,
          driver_name: leftDriver,
          driver_id: DRIVER_MAP[leftDriver] || '',
          time_spec: timeSpec === '-' ? '' : timeSpec,
          oil_type: oilType,
          vehicle_no: vehicleNo.replace(/[^\d\/]/g, ''),
          company_name: companyName,
          site_name: siteName,
          address: address,
          notes: notes,
          status: 'completed',
        });
      }
    }

    // 右側のデータ（列9-17）
    if (rightDriver) {
      const timeSpec = (row[9] || '').trim();
      const oilType = normalizeOilType(row[10] || row[11] || '');
      const vehicleNo = (row[11] || row[12] || '').trim();
      const companyName = (row[13] || row[14] || '').trim();
      const siteName = (row[14] || row[15] || '').trim();
      const address = (row[15] || row[16] || '').trim();
      const notes = (row[16] || row[17] || '').trim();

      if (companyName && oilType && !['', '-', '.'].includes(companyName)) {
        records.push({
          date: currentDate,
          driver_name: rightDriver,
          driver_id: DRIVER_MAP[rightDriver] || '',
          time_spec: timeSpec === '-' ? '' : timeSpec,
          oil_type: oilType,
          vehicle_no: vehicleNo.replace(/[^\d\/]/g, ''),
          company_name: companyName,
          site_name: siteName,
          address: address,
          notes: notes,
          status: 'completed',
        });
      }
    }
  }

  return records;
}

function generateCSV(records: DeliveryRecord[]): string {
  const headers = [
    'date',
    'driver_name',
    'company_name',
    'site_name',
    'address',
    'oil_type',
    'vehicle_no',
    'time_spec',
    'notes',
    'status',
  ];

  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [headers.join(',')];

  for (const record of records) {
    const values = [
      record.date,
      record.driver_name,
      record.company_name,
      record.site_name,
      record.address,
      record.oil_type,
      record.vehicle_no,
      record.time_spec,
      record.notes,
      record.status,
    ];
    lines.push(values.map(escapeCSV).join(','));
  }

  return lines.join('\n');
}

// メイン処理
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('使い方: npx ts-node scripts/convert-csv.ts <入力CSV> [出力CSV]');
  console.log('例: npx ts-node scripts/convert-csv.ts ~/Downloads/配車ノート.csv');
  process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1] || inputPath.replace('.csv', '_converted.csv');

console.log(`入力ファイル: ${inputPath}`);
console.log(`出力ファイル: ${outputPath}`);

try {
  const records = convertCSV(inputPath);
  console.log(`\n変換完了: ${records.length}件の配車記録を抽出しました`);

  // サマリーを表示
  const dateSet = new Set(records.map(r => r.date));
  const driverSet = new Set(records.map(r => r.driver_name));
  console.log(`日付: ${Array.from(dateSet).sort().join(', ')}`);
  console.log(`ドライバー: ${Array.from(driverSet).join(', ')}`);

  // CSVを出力
  const csv = generateCSV(records);
  fs.writeFileSync(outputPath, csv, 'utf-8');
  console.log(`\nCSVファイルを保存しました: ${outputPath}`);

  // 最初の5件を表示
  console.log('\n--- サンプル（最初の5件）---');
  records.slice(0, 5).forEach((r, i) => {
    console.log(`${i + 1}. ${r.date} | ${r.driver_name} | ${r.company_name} | ${r.oil_type}`);
  });

} catch (error) {
  console.error('エラー:', error);
  process.exit(1);
}
