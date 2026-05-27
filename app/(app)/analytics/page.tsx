import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import type { Driver, DeliveryWithDriver } from "@/lib/types";

// SSR完全無効化でクライアントラッパーを読み込み
const AnalyticsClientWrapper = dynamic(
  () =>
    import("@/components/map/AnalyticsClientWrapper").then(
      (mod) => mod.AnalyticsClientWrapper
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 bg-dark-panel border-b border-dark-border px-4 py-3">
          <div className="h-8 bg-dark-panel2 rounded animate-pulse w-64" />
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center bg-dark-bg">
          <div className="text-dark-muted">読み込み中...</div>
        </div>
        <div className="bg-dark-panel border-t border-dark-border p-4">
          <div className="text-dark-muted text-sm">統計を読み込み中...</div>
        </div>
      </div>
    ),
  }
);

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

function getDefaultDates() {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);

  return {
    from: monthAgo.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const defaults = getDefaultDates();
  const startDate = params.from || defaults.from;
  const endDate = params.to || defaults.to;

  const supabase = await createClient();

  // 期間内の配車データを取得
  const { data: deliveriesData } = await supabase
    .from("deliveries")
    .select("*, driver:drivers(*)")
    .gte("date", startDate)
    .lte("date", endDate)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("date", { ascending: true });

  const deliveries = (deliveriesData || []) as DeliveryWithDriver[];

  // ドライバー一覧を取得
  const { data: driversData } = await supabase
    .from("drivers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const drivers = (driversData || []) as Driver[];

  return (
    <AnalyticsClientWrapper
      deliveries={deliveries}
      drivers={drivers}
      startDate={startDate}
      endDate={endDate}
    />
  );
}

