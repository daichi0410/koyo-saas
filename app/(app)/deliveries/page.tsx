import { createClient } from "@/lib/supabase/server";
import { DeliveryList } from "@/components/deliveries/DeliveryList";
import type { Driver, DeliveryWithDriver } from "@/lib/types";

interface SearchParams {
  date?: string;
  view?: "day" | "week";
  driver?: string;
  oil?: string;
}

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // デフォルトは今日
  const today = new Date();
  const selectedDate = params.date || today.toISOString().split("T")[0];
  const viewMode = params.view || "day";

  // 日付範囲を計算
  let dateFrom: string;
  let dateTo: string;

  if (viewMode === "week") {
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    dateFrom = monday.toISOString().split("T")[0];
    dateTo = sunday.toISOString().split("T")[0];
  } else {
    dateFrom = selectedDate;
    dateTo = selectedDate;
  }

  // 配車データを取得（Supabaseのデフォルト1000件制限を解除）
  let query = supabase
    .from("deliveries")
    .select("*, driver:drivers(*)")
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(10000);

  // ドライバーフィルタ
  if (params.driver) {
    query = query.eq("driver_id", params.driver);
  }

  // 油種フィルタ
  if (params.oil && params.oil !== "all") {
    query = query.eq("oil_type", params.oil);
  }

  const { data: deliveriesData } = await query;
  const deliveries = (deliveriesData || []) as DeliveryWithDriver[];

  // ドライバー一覧を取得
  const { data: driversData } = await supabase
    .from("drivers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const drivers = (driversData || []) as Driver[];

  return (
    <div className="h-full flex flex-col">
      <DeliveryList
        deliveries={deliveries}
        drivers={drivers}
        selectedDate={selectedDate}
        viewMode={viewMode}
        selectedDriver={params.driver}
        selectedOil={params.oil}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
}
