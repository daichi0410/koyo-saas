/**
 * 向陽配車ノート CSVコンバーター
 *
 * 使い方:
 * node scripts/convert-csv.js <入力CSVファイル> [出力CSVファイル]
 *
 * 例:
 * node scripts/convert-csv.js ~/Downloads/配車ノート.csv ~/Downloads/import.csv
 */

const fs = require('fs');
const path = require('path');

// ドライバー名 → UUID マッピング
const DRIVER_UUID_MAP = {
  '横溝': '17c6bb20-0ba2-4a08-bc64-5a3b1c710dea',
  '森谷': '18490418-8407-4f4c-bca1-9f002b073356',
  '細田': '47817adc-0440-4b5c-b269-20dc71736c59',
  '代行': '86a4245d-b4fc-430f-92cb-fc9fbb9e4691',
  '橋本': 'b1041278-5b0d-4f5b-a41f-7784e42c218d',
  '山本': 'b876d82c-757d-40cc-8445-bf9ba0730f05',
  '高野': 'ba469467-226b-4db5-ba26-9bbe44177175',
  '高橋': 'bb37b2d8-e93e-48db-ac82-b8bc8a05e09f',
  '髙橋': 'bb37b2d8-e93e-48db-ac82-b8bc8a05e09f',
  '内藤': 'c9023013-2843-4e0e-8690-c65558c361e0',
  '盛田': 'd96871f4-c52a-470a-91d1-ca540ddf3765',
  '平野': 'fe41a298-38e1-4e47-b781-836fffe7e74b',
};

// 既知のドライバー名パターン
const DRIVER_NAMES = ['細田', '内藤', '平野', '盛田', '森谷', '橋本', '横溝', '高橋', '髙橋', '高野', '山本', '大型', '未割当', '代行'];

function parseDate(dateStr) {
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

function isDriverSection(cell) {
  if (!cell) return null;
  const trimmed = cell.trim().replace(/　/g, '');
  for (const name of DRIVER_NAMES) {
    if (trimmed === name) {
      return name;
    }
  }
  return null;
}

function normalizeOilType(oil) {
  if (!oil) return '';
  const trimmed = oil.trim();
  if (trimmed.includes('軽油')) return '軽油';
  if (trimmed.includes('重油')) return '重油';
  if (trimmed.includes('灯油')) return '灯油';
  return '';
}

function parseCSV(content) {
  const rows = [];
  let currentRow = [];
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

function convertCSV(inputPath) {
  const content = fs.readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(content);

  const records = [];
  let currentDate = '';
  let leftDriver = '';
  let rightDriver = '';
  let inLeftSection = false;
  let inRightSection = false;

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
    const col0 = (row[0] || '').trim().replace(/　/g, '');
    const col1 = (row[1] || '').trim().replace(/　/g, '');
    const col9 = (row[9] || '').trim().replace(/　/g, '');
    const col10 = (row[10] || '').trim().replace(/　/g, '');

    // 左側のドライバー
    const leftCheck = isDriverSection(col0) || isDriverSection(col1);
    if (leftCheck && leftCheck !== '未割当' && leftCheck !== '代行') {
      leftDriver = leftCheck;
    }

    // 右側のドライバー
    const rightCheck = isDriverSection(col9) || isDriverSection(col10);
    if (rightCheck && rightCheck !== '代行') {
      rightDriver = rightCheck;
    }

    // ヘッダー行をスキップ
    if (col0 === 'No' || col1 === '時間指定' || col1 === '担当') continue;
    if ((row[9] || '').includes('時間指定')) continue;

    // 車両状況行をスキップ
    if (col0.includes('車両状況')) continue;

    // データ行を処理
    if (!currentDate) continue;

    // 左側のデータ（列0-8）- 細田、平野、森谷、横溝など
    if (leftDriver && leftDriver !== '大型' && leftDriver !== '未割当') {
      const timeSpec = (row[1] || '').trim();
      const oilType = normalizeOilType(row[2] || '');
      const vehicleNo = (row[3] || '').trim();
      const companyName = (row[5] || '').trim();
      const siteName = (row[6] || '').trim();
      const address = (row[7] || '').trim();
      const notes = (row[8] || '').trim();

      // 会社名があれば有効なレコード
      if (companyName && companyName !== '-' && oilType) {
        records.push({
          date: currentDate,
          driver_id: DRIVER_UUID_MAP[leftDriver] || '',
          driver_name: leftDriver,
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

    // 右側のデータ（列9-17）- 内藤、盛田、橋本、高橋など
    if (rightDriver && rightDriver !== '大型' && rightDriver !== '代行') {
      const timeSpec = (row[9] || '').trim();
      const oilType = normalizeOilType(row[10] || '');
      const vehicleNo = (row[12] || '').trim();
      const companyName = (row[13] || '').trim();
      const siteName = (row[14] || '').trim();
      const address = (row[15] || '').trim();
      const notes = (row[16] || '').trim();

      // 会社名があれば有効なレコード
      if (companyName && companyName !== '-' && companyName !== '.' && oilType) {
        records.push({
          date: currentDate,
          driver_id: DRIVER_UUID_MAP[rightDriver] || '',
          driver_name: rightDriver,
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

function generateCSV(records) {
  const headers = [
    'date',
    'driver_id',
    'company_name',
    'site_name',
    'address',
    'oil_type',
    'vehicle_no',
    'time_spec',
    'notes',
    'status',
  ];

  const escapeCSV = (value) => {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [headers.join(',')];

  for (const record of records) {
    const values = [
      record.date,
      record.driver_id,
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
  console.log('使い方: node scripts/convert-csv.js <入力CSV> [出力CSV]');
  console.log('例: node scripts/convert-csv.js ~/Downloads/配車ノート.csv');
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

  // UUIDなしのドライバーを警告
  const noUuidRecords = records.filter(r => !r.driver_id);
  if (noUuidRecords.length > 0) {
    const noUuidDrivers = [...new Set(noUuidRecords.map(r => r.driver_name))];
    console.log(`\n⚠️  UUIDが見つからないドライバー: ${noUuidDrivers.join(', ')} (${noUuidRecords.length}件)`);
  }

  // 最初の10件を表示
  console.log('\n--- サンプル（最初の10件）---');
  records.slice(0, 10).forEach((r, i) => {
    const uuidStatus = r.driver_id ? '✓' : '✗';
    console.log(`${i + 1}. ${r.date} | ${r.driver_name}${uuidStatus} | ${r.company_name} | ${r.oil_type}`);
  });

} catch (error) {
  console.error('エラー:', error);
  process.exit(1);
}
