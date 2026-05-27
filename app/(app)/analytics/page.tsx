import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import type { Driver, DeliveryWithDriver } from "@/lib/types";
import { AnalyticsPeriodSelector } from "@/components/map/AnalyticsPeriodSelector";

// SSR無効化でMapコンポーネントを読み込み
const AnalyticsMap = dynamic(
  () =>
    import("@/components/map/AnalyticsMap").then((mod) => mod.AnalyticsMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-dark-bg">
        <div className="text-dark-muted">マップを読み込み中...</div>
      </div>
    ),
  }
);

// SSR無効化で統計ダッシュボードを読み込み（Rechartsを使用するため）
const StatsDashboard = dynamic(
  () =>
    import("@/components/map/StatsDashboard").then((mod) => mod.StatsDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="bg-dark-panel border-t border-dark-border p-4">
        <div className="text-dark-muted text-sm">統計を読み込み中...</div>
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
    <div className="h-full flex flex-col">
      {/* 期間選択ヘッダー */}
      <div className="flex-shrink-0 bg-dark-panel border-b border-dark-border px-4 py-3">
        <AnalyticsPeriodSelector startDate={startDate} endDate={endDate} />
      </div>

      {/* マップエリア */}
      <div className="flex-1 min-h-0">
        <AnalyticsMap deliveries={deliveries} drivers={drivers} />
      </div>

      {/* 統計ダッシュボード */}
      <StatsDashboard deliveries={deliveries} drivers={drivers} />
    </div>
  );
}

