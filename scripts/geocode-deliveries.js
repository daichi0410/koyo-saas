/**
 * 既存の配車データにジオコーディングを実行するスクリプト
 *
 * 使用方法:
 * 1. .env.local から SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定
 * 2. node scripts/geocode-deliveries.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません。');
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を確認してください。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 国土地理院APIでジオコーディング
async function geocodeAddress(address) {
  try {
    const res = await fetch(
      `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`
    );

    if (!res.ok) {
      throw new Error('Geocoding API failed');
    }

    const data = await res.json();

    if (data && data.length > 0) {
      const [lng, lat] = data[0].geometry.coordinates;
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error(`  ジオコーディングエラー: ${error.message}`);
    return null;
  }
}

// メイン処理
async function main() {
  console.log('=== 配車データ ジオコーディング ===\n');

  // lat/lng が null のレコードを取得
  const { data: deliveries, error } = await supabase
    .from('deliveries')
    .select('id, company_name, address')
    .is('lat', null)
    .order('date', { ascending: true });

  if (error) {
    console.error('データ取得エラー:', error.message);
    process.exit(1);
  }

  console.log(`ジオコーディング対象: ${deliveries.length}件\n`);

  if (deliveries.length === 0) {
    console.log('ジオコーディングが必要なレコードはありません。');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < deliveries.length; i++) {
    const delivery = deliveries[i];
    const searchAddress = delivery.address || delivery.company_name;

    console.log(`[${i + 1}/${deliveries.length}] ${delivery.company_name}`);
    console.log(`  検索: ${searchAddress}`);

    // API制限を考慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 200));

    const coords = await geocodeAddress(searchAddress);

    if (coords) {
      // 座標を更新
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ lat: coords.lat, lng: coords.lng })
        .eq('id', delivery.id);

      if (updateError) {
        console.log(`  更新エラー: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`  → 成功 (${coords.lat}, ${coords.lng})`);
        successCount++;
      }
    } else {
      console.log(`  → 座標が見つかりません`);
      failCount++;
    }
  }

  console.log('\n=== 完了 ===');
  console.log(`成功: ${successCount}件`);
  console.log(`失敗: ${failCount}件`);
}

main().catch(console.error);
