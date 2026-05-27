import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import type { Driver, DeliveryWithDriver } from "@/lib/types";

// SSR無効化でMapコンポーネントを読み込み
const DriverMap = dynamic(
  () => import("@/components/map/DriverMap").then((mod) => mod.DriverMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-dark-bg">
        <div className="text-dark-muted">マップを読み込み中...</div>
      </div>
    ),
  }
);

export default async function MapPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // 本日の配車データを取得（緯度経度があるもののみ）
  const { data: deliveriesData } = await supabase
    .from("deliveries")
    .select("*, driver:drivers(*)")
    .eq("date", today)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("created_at", { ascending: true });

  const deliveries = (deliveriesData || []) as DeliveryWithDriver[];

  // ドライバー一覧を取得
  const { data: driversData } = await supabase
    .from("drivers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const drivers = (driversData || []) as Driver[];

  return (
    <div className="h-full">
      <DriverMap deliveries={deliveries} drivers={drivers} />
    </div>
  );
}
