import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// サービスロールキーがある場合はそれを使用（RLSをバイパス）
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return null;
}

// 国土地理院APIでジオコーディング
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`
    );

    if (!res.ok) {
      throw new Error("Geocoding API failed");
    }

    const data = await res.json();

    if (data && data.length > 0) {
      const [lng, lat] = data[0].geometry.coordinates;
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error(`Geocoding error for ${address}:`, error);
    return null;
  }
}

// 既存データをジオコーディング
export async function POST() {
  // サービスロールキーがあればそれを使用、なければ通常のクライアント
  const adminClient = getSupabaseAdmin();
  const supabase = adminClient || await createServerClient();

  // lat/lng が null のレコードを取得
  const { data: deliveries, error } = await supabase
    .from("deliveries")
    .select("id, company_name, address")
    .is("lat", null)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`Geocoding ${deliveries?.length || 0} deliveries...`);

  const results = {
    total: deliveries?.length || 0,
    success: 0,
    failed: 0,
    details: [] as { company: string; status: string }[],
  };

  if (!deliveries || deliveries.length === 0) {
    return NextResponse.json({
      message: "ジオコーディングが必要なレコードはありません",
      results,
    });
  }

  for (const delivery of deliveries) {
    const searchAddress = delivery.address || delivery.company_name;

    // API制限を考慮して少し待機
    await new Promise((resolve) => setTimeout(resolve, 200));

    const coords = await geocodeAddress(searchAddress);

    if (coords) {
      const { error: updateError } = await supabase
        .from("deliveries")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", delivery.id);

      if (updateError) {
        results.failed++;
        results.details.push({
          company: delivery.company_name,
          status: `更新エラー: ${updateError.message}`,
        });
      } else {
        results.success++;
        results.details.push({
          company: delivery.company_name,
          status: `成功 (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        });
      }
    } else {
      results.failed++;
      results.details.push({
        company: delivery.company_name,
        status: "座標が見つかりません",
      });
    }
  }

  console.log(`Geocoding complete: ${results.success} success, ${results.failed} failed`);

  return NextResponse.json({
    message: "ジオコーディング完了",
    results,
  });
}

// 現在の状況を確認
export async function GET() {
  const adminClient = getSupabaseAdmin();
  const supabase = adminClient || await createServerClient();

  const { count: totalCount } = await supabase
    .from("deliveries")
    .select("*", { count: "exact", head: true });

  const { count: geocodedCount } = await supabase
    .from("deliveries")
    .select("*", { count: "exact", head: true })
    .not("lat", "is", null);

  const { count: pendingCount } = await supabase
    .from("deliveries")
    .select("*", { count: "exact", head: true })
    .is("lat", null);

  return NextResponse.json({
    total: totalCount || 0,
    geocoded: geocodedCount || 0,
    pending: pendingCount || 0,
  });
}
