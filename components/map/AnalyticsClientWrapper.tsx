"use client";

import { useState, useEffect } from "react";
import type { Driver, DeliveryWithDriver } from "@/lib/types";

interface AnalyticsClientWrapperProps {
  deliveries: DeliveryWithDriver[];
  drivers: Driver[];
  startDate: string;
  endDate: string;
}

export function AnalyticsClientWrapper({
  deliveries,
  drivers,
  startDate,
  endDate,
}: AnalyticsClientWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [AnalyticsMap, setAnalyticsMap] = useState<React.ComponentType<{
    deliveries: DeliveryWithDriver[];
    drivers: Driver[];
  }> | null>(null);
  const [StatsDashboard, setStatsDashboard] = useState<React.ComponentType<{
    deliveries: DeliveryWithDriver[];
    drivers: Driver[];
  }> | null>(null);
  const [PeriodSelector, setPeriodSelector] = useState<React.ComponentType<{
    startDate: string;
    endDate: string;
    onPeriodChange: (start: string, end: string) => void;
  }> | null>(null);

  useEffect(() => {
    setMounted(true);

    // クライアントサイドでのみインポート
    Promise.all([
      import("./AnalyticsMap").then((mod) => setAnalyticsMap(() => mod.AnalyticsMap)),
      import("./StatsDashboard").then((mod) => setStatsDashboard(() => mod.StatsDashboard)),
      import("./PeriodSelector").then((mod) => setPeriodSelector(() => mod.PeriodSelector)),
    ]);
  }, []);

  const handlePeriodChange = (start: string, end: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("from", start);
    url.searchParams.set("to", end);
    window.location.href = url.toString();
  };

  if (!mounted) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 bg-dark-panel border-b border-dark-border px-4 py-3">
          <div className="h-8 bg-dark-panel2 rounded animate-pulse w-64" />
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center bg-dark-bg">
          <div className="text-dark-muted">マップを読み込み中...</div>
        </div>
        <div className="bg-dark-panel border-t border-dark-border p-4">
          <div className="text-dark-muted text-sm">統計を読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 期間選択ヘッダー */}
      <div className="flex-shrink-0 bg-dark-panel border-b border-dark-border px-4 py-3">
        {PeriodSelector ? (
          <PeriodSelector
            startDate={startDate}
            endDate={endDate}
            onPeriodChange={handlePeriodChange}
          />
        ) : (
          <div className="h-8 bg-dark-panel2 rounded animate-pulse w-64" />
        )}
      </div>

      {/* マップエリア */}
      <div className="flex-1 min-h-0">
        {AnalyticsMap ? (
          <AnalyticsMap deliveries={deliveries} drivers={drivers} />
        ) : (
          <div className="h-full flex items-center justify-center bg-dark-bg">
            <div className="text-dark-muted">マップを読み込み中...</div>
          </div>
        )}
      </div>

      {/* 統計ダッシュボード */}
      {StatsDashboard ? (
        <StatsDashboard deliveries={deliveries} drivers={drivers} />
      ) : (
        <div className="bg-dark-panel border-t border-dark-border p-4">
          <div className="text-dark-muted text-sm">統計を読み込み中...</div>
        </div>
      )}
    </div>
  );
}
