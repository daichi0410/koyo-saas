import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Delivery, Driver } from "@/lib/types";

interface DeliveryWithDriver extends Delivery {
  driver: Driver | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // 本日の配車データを取得
  const { data: deliveriesData } = await supabase
    .from("deliveries")
    .select("*, driver:drivers(*)")
    .eq("date", today)
    .order("created_at", { ascending: true });

  const deliveries = deliveriesData as DeliveryWithDriver[] | null;

  // ドライバー一覧を取得
  const { data: driversData } = await supabase
    .from("drivers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const drivers = driversData as Driver[] | null;

  // ステータス別の集計
  const stats = {
    total: deliveries?.length ?? 0,
    scheduled: deliveries?.filter((d) => d.status === "scheduled").length ?? 0,
    in_progress: deliveries?.filter((d) => d.status === "in_progress").length ?? 0,
    completed: deliveries?.filter((d) => d.status === "completed").length ?? 0,
  };

  // ドライバー別の集計
  const driverStats = drivers?.map((driver) => ({
    driver,
    count: deliveries?.filter((d) => d.driver_id === driver.id).length ?? 0,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-dark-panel border border-dark-border rounded-lg p-4">
          <div className="text-3xl font-extrabold text-white tabular-nums">
            {stats.total}
          </div>
          <div className="text-xs text-dark-muted mt-1">本日の配車件数</div>
        </div>
        <div className="bg-dark-panel border border-dark-border rounded-lg p-4">
          <div className="text-3xl font-extrabold text-cyan tabular-nums">
            {stats.scheduled}
          </div>
          <div className="text-xs text-dark-muted mt-1">予定</div>
        </div>
        <div className="bg-dark-panel border border-dark-border rounded-lg p-4">
          <div className="text-3xl font-extrabold text-[#FF9F43] tabular-nums">
            {stats.in_progress}
          </div>
          <div className="text-xs text-dark-muted mt-1">進行中</div>
        </div>
        <div className="bg-dark-panel border border-dark-border rounded-lg p-4">
          <div className="text-3xl font-extrabold text-[#A5D6A7] tabular-nums">
            {stats.completed}
          </div>
          <div className="text-xs text-dark-muted mt-1">完了</div>
        </div>
      </div>

      {/* ドライバー別集計 */}
      <div className="bg-dark-panel border border-dark-border rounded-lg">
        <div className="px-4 py-3 border-b border-dark-border">
          <h2 className="text-sm font-bold text-white">ドライバー別配車</h2>
        </div>
        <div className="p-4">
          {driverStats && driverStats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {driverStats.map(({ driver, count }) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-2 bg-dark-panel2 border border-dark-border rounded px-3 py-2"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: driver.color }}
                  />
                  <span className="text-sm font-medium text-white">
                    {driver.name}
                  </span>
                  <span className="text-sm text-dark-muted tabular-nums">
                    {count}件
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-muted text-sm">
              ドライバーが登録されていません
            </p>
          )}
        </div>
      </div>

      {/* 本日の配車一覧 */}
      <div className="bg-dark-panel border border-dark-border rounded-lg">
        <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">本日の配車一覧</h2>
          <Link
            href="/deliveries"
            className="text-xs text-cyan hover:underline"
          >
            すべて見る →
          </Link>
        </div>

        {deliveries && deliveries.length > 0 ? (
          <div className="divide-y divide-dark-border">
            {deliveries.slice(0, 10).map((delivery) => (
              <div
                key={delivery.id}
                className="px-4 py-3 flex items-center gap-4"
              >
                {/* ドライバー */}
                <div className="flex items-center gap-2 w-24">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: delivery.driver?.color ?? "#666",
                    }}
                  />
                  <span className="text-sm text-white font-medium">
                    {delivery.driver?.name ?? "-"}
                  </span>
                </div>

                {/* 会社名 */}
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">
                    {delivery.company_name}
                  </div>
                  <div className="text-xs text-dark-muted">
                    {delivery.address}
                  </div>
                </div>

                {/* 油種 */}
                <span className={`oil-tag ${delivery.oil_type}`}>
                  {delivery.oil_type}
                </span>

                {/* 時間指定 */}
                {delivery.time_spec && delivery.time_spec !== "-" && (
                  <span className="time-tag">{delivery.time_spec}</span>
                )}

                {/* ステータス */}
                <span className={`status-badge ${delivery.status}`}>
                  {delivery.status === "scheduled" && "予定"}
                  {delivery.status === "in_progress" && "進行中"}
                  {delivery.status === "completed" && "完了"}
                  {delivery.status === "cancelled" && "キャンセル"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-dark-muted">本日の配車データがありません</p>
            <Link
              href="/deliveries/new"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-cyan text-black text-sm font-bold rounded hover:bg-cyan/90 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              新規配車を追加
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
