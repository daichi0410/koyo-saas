"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Driver, DeliveryWithDriver, OilType } from "@/lib/types";
import { DeliveryKanban } from "./DeliveryKanban";

interface DeliveryListProps {
  deliveries: DeliveryWithDriver[];
  drivers: Driver[];
  selectedDate: string;
  viewMode: "day" | "week";
  displayMode: "table" | "board";
  selectedDriver?: string;
  selectedOil?: string;
  dateFrom: string;
  dateTo: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day}（${weekday}）`;
}

function formatDateForInput(dateStr: string): string {
  return dateStr;
}

export function DeliveryList({
  deliveries,
  drivers,
  selectedDate,
  viewMode,
  displayMode,
  selectedDriver,
  selectedOil,
  dateFrom,
  dateTo,
}: DeliveryListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/deliveries?${params.toString()}`);
  };

  const handleDateChange = (date: string) => {
    updateParams({ date });
  };

  const handleViewChange = (view: "day" | "week") => {
    updateParams({ view });
  };

  const handleDriverChange = (driverId: string) => {
    updateParams({ driver: driverId || undefined });
  };

  const handleOilChange = (oil: string) => {
    updateParams({ oil: oil || undefined });
  };

  const handleDisplayModeChange = (mode: "table" | "board") => {
    updateParams({ display: mode });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    const days = viewMode === "week" ? 7 : 1;
    if (direction === "prev") {
      date.setDate(date.getDate() - days);
    } else {
      date.setDate(date.getDate() + days);
    }
    updateParams({ date: date.toISOString().split("T")[0] });
  };

  const goToToday = () => {
    updateParams({ date: new Date().toISOString().split("T")[0] });
  };

  // 日付別にグループ化
  const deliveriesByDate = deliveries.reduce((acc, d) => {
    if (!acc[d.date]) {
      acc[d.date] = [];
    }
    acc[d.date].push(d);
    return acc;
  }, {} as Record<string, DeliveryWithDriver[]>);

  // CSVエクスポート
  const exportCSV = () => {
    const headers = [
      "日付",
      "ドライバー",
      "会社名",
      "住所",
      "油種",
      "数量",
      "時間指定",
      "車両",
      "連絡先",
      "備考",
      "ステータス",
    ];

    const rows = deliveries.map((d) => [
      d.date,
      d.driver?.name || "",
      d.company_name,
      d.address || "",
      d.oil_type,
      d.quantity?.toString() || "",
      d.time_spec || "",
      d.vehicle_no || "",
      d.tel || "",
      d.notes || "",
      d.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `配車記録_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* フィルターバー */}
      <div className="flex-shrink-0 p-4 bg-dark-panel border-b border-dark-border">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 日付ナビゲーション */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate("prev")}
              className="w-8 h-8 flex items-center justify-center bg-dark-panel2 border border-dark-border rounded hover:border-cyan transition-colors"
            >
              <svg
                className="w-4 h-4 text-dark-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <input
              type="date"
              value={formatDateForInput(selectedDate)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-1.5 bg-dark-panel2 border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-cyan"
            />

            <button
              onClick={() => navigateDate("next")}
              className="w-8 h-8 flex items-center justify-center bg-dark-panel2 border border-dark-border rounded hover:border-cyan transition-colors"
            >
              <svg
                className="w-4 h-4 text-dark-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs bg-dark-panel2 border border-dark-border rounded text-dark-muted hover:text-cyan hover:border-cyan transition-colors"
            >
              今日
            </button>
          </div>

          {/* 期間切り替え */}
          <div className="flex rounded overflow-hidden border border-dark-border">
            <button
              onClick={() => handleViewChange("day")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === "day"
                  ? "bg-cyan text-black font-bold"
                  : "bg-dark-panel2 text-dark-muted hover:text-dark-text"
              }`}
            >
              日次
            </button>
            <button
              onClick={() => handleViewChange("week")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                viewMode === "week"
                  ? "bg-cyan text-black font-bold"
                  : "bg-dark-panel2 text-dark-muted hover:text-dark-text"
              }`}
            >
              週次
            </button>
          </div>

          {/* 表示切り替え */}
          <div className="flex rounded overflow-hidden border border-dark-border">
            <button
              onClick={() => handleDisplayModeChange("table")}
              className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1 ${
                displayMode === "table"
                  ? "bg-cyan text-black font-bold"
                  : "bg-dark-panel2 text-dark-muted hover:text-dark-text"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              テーブル
            </button>
            <button
              onClick={() => handleDisplayModeChange("board")}
              className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1 ${
                displayMode === "board"
                  ? "bg-cyan text-black font-bold"
                  : "bg-dark-panel2 text-dark-muted hover:text-dark-text"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              ボード
            </button>
          </div>

          {/* ドライバーフィルタ */}
          <select
            value={selectedDriver || ""}
            onChange={(e) => handleDriverChange(e.target.value)}
            className="px-3 py-1.5 bg-dark-panel2 border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-cyan"
          >
            <option value="">全ドライバー</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>

          {/* 油種フィルタ */}
          <select
            value={selectedOil || ""}
            onChange={(e) => handleOilChange(e.target.value)}
            className="px-3 py-1.5 bg-dark-panel2 border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-cyan"
          >
            <option value="">全油種</option>
            <option value="軽油">軽油</option>
            <option value="重油">重油</option>
            <option value="灯油">灯油</option>
          </select>

          <div className="flex-1" />

          {/* 統計 */}
          <div className="text-sm text-dark-muted">
            <span className="text-white font-bold">{deliveries.length}</span> 件
          </div>

          {/* CSVエクスポート */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dark-panel2 border border-dark-border rounded text-dark-muted hover:text-cyan hover:border-cyan transition-colors"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            CSV
          </button>

          {/* 新規追加 */}
          <Link
            href={`/deliveries/new?date=${selectedDate}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan text-black text-xs font-bold rounded hover:bg-cyan/90 transition-colors"
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
            新規配車
          </Link>
        </div>

        {/* 期間表示 */}
        <div className="mt-2 text-xs text-dark-muted">
          {viewMode === "week" ? (
            <>
              {formatDate(dateFrom)} 〜 {formatDate(dateTo)}
            </>
          ) : (
            formatDate(selectedDate)
          )}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-auto">
        {displayMode === "board" ? (
          /* ボードビュー */
          <DeliveryKanban deliveries={deliveries} drivers={drivers} />
        ) : deliveries.length > 0 ? (
          /* テーブルビュー */
          <div className="min-w-[1000px]">
            {Object.entries(deliveriesByDate).map(([date, dayDeliveries]) => (
              <div key={date}>
                {/* 日付ヘッダー（週次ビューの場合） */}
                {viewMode === "week" && (
                  <div className="sticky top-0 px-4 py-2 bg-dark-panel2 border-b border-dark-border text-sm font-bold text-white z-10">
                    {formatDate(date)}
                    <span className="ml-2 text-dark-muted font-normal">
                      {dayDeliveries.length}件
                    </span>
                  </div>
                )}

                {/* テーブル */}
                <table className="w-full">
                  {viewMode === "day" && (
                    <thead className="sticky top-0 bg-dark-panel z-10">
                      <tr className="border-b border-dark-border">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide w-24">
                          ドライバー
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide">
                          会社名
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide">
                          住所
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide w-20">
                          油種
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide w-24">
                          時間指定
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide w-20">
                          車両
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide w-24">
                          ステータス
                        </th>
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-dark-border">
                    {dayDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className="hover:bg-dark-panel2 cursor-pointer"
                        onClick={() =>
                          router.push(`/deliveries/${delivery.id}`)
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  delivery.driver?.color || "#666",
                              }}
                            />
                            <span className="text-sm font-medium text-white">
                              {delivery.driver?.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white font-medium">
                            {delivery.company_name}
                          </div>
                          {delivery.site_name && (
                            <div className="text-xs text-dark-muted">
                              {delivery.site_name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-dark-muted">
                            {delivery.address || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`oil-tag ${delivery.oil_type}`}>
                            {delivery.oil_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {delivery.time_spec && delivery.time_spec !== "-" ? (
                            <span className="time-tag text-[10px]">
                              {delivery.time_spec}
                            </span>
                          ) : (
                            <span className="text-xs text-dark-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-dark-muted">
                            {delivery.vehicle_no
                              ? `${delivery.vehicle_no}号`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`status-badge ${delivery.status}`}>
                            {delivery.status === "scheduled" && "予定"}
                            {delivery.status === "in_progress" && "進行中"}
                            {delivery.status === "completed" && "完了"}
                            {delivery.status === "cancelled" && "キャンセル"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">&#128203;</div>
              <p className="text-dark-muted">配車データがありません</p>
              <Link
                href={`/deliveries/new?date=${selectedDate}`}
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
          </div>
        )}
      </div>
    </>
  );
}
