"use client";

import { useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Driver, DeliveryWithDriver, OilType } from "@/lib/types";
import { HeatmapLayer } from "./HeatmapLayer";
import { DriverAreaLayer } from "./DriverAreaLayer";

interface AnalyticsMapProps {
  deliveries: DeliveryWithDriver[];
  drivers: Driver[];
}

type ViewMode = "markers" | "heatmap" | "areas";

export function AnalyticsMap({ deliveries, drivers }: AnalyticsMapProps) {
  const [activeDrivers, setActiveDrivers] = useState<Set<string>>(
    new Set(drivers.map((d) => d.id))
  );
  const [activeOil, setActiveOil] = useState<OilType | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("markers");

  // ドライバーのカラーマップを作成
  const driverColorMap = useMemo(
    () => new Map(drivers.map((d) => [d.id, d.color])),
    [drivers]
  );

  // フィルタリングされた配車データ
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (!d.lat || !d.lng) return false;
      if (d.driver_id && !activeDrivers.has(d.driver_id)) return false;
      if (activeOil !== "all" && d.oil_type !== activeOil) return false;
      return true;
    });
  }, [deliveries, activeDrivers, activeOil]);

  // ヒートマップ用のポイントデータ
  const heatmapPoints = useMemo<[number, number, number][]>(() => {
    return filteredDeliveries.map((d) => [d.lat!, d.lng!, 0.5]);
  }, [filteredDeliveries]);

  // ドライバー別の件数を集計
  const driverCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredDeliveries.forEach((d) => {
      if (d.driver_id) {
        counts.set(d.driver_id, (counts.get(d.driver_id) || 0) + 1);
      }
    });
    return counts;
  }, [filteredDeliveries]);

  const toggleDriver = (driverId: string) => {
    setActiveDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) {
        next.delete(driverId);
      } else {
        next.add(driverId);
      }
      return next;
    });
  };

  const showAllDrivers = () => {
    setActiveDrivers(new Set(drivers.map((d) => d.id)));
  };

  const hideAllDrivers = () => {
    setActiveDrivers(new Set());
  };

  return (
    <div className="h-full flex">
      {/* サイドバー */}
      <aside className="w-[240px] flex-shrink-0 bg-dark-panel border-r border-dark-border flex flex-col overflow-hidden">
        {/* 表示モード切替 */}
        <div className="p-3 border-b border-dark-border">
          <div className="text-[9.5px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            表示モード
          </div>
          <div className="flex flex-col gap-1">
            {(
              [
                { key: "markers", label: "マーカー", icon: "●" },
                { key: "heatmap", label: "ヒートマップ", icon: "◐" },
                { key: "areas", label: "エリア分析", icon: "◯" },
              ] as const
            ).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`flex items-center gap-2 px-3 py-2 text-xs rounded border transition-colors ${
                  viewMode === key
                    ? "bg-cyan/20 border-cyan text-cyan"
                    : "bg-dark-panel2 border-dark-border text-dark-muted hover:border-cyan hover:text-cyan"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ドライバーフィルタ */}
        <div className="p-3 border-b border-dark-border">
          <div className="text-[9.5px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            ドライバー
          </div>
          <div className="flex gap-1">
            <button
              onClick={showAllDrivers}
              className="flex-1 px-2 py-1.5 text-[10.5px] bg-dark-panel2 border border-dark-border text-dark-muted rounded hover:border-cyan hover:text-cyan transition-colors"
            >
              全員表示
            </button>
            <button
              onClick={hideAllDrivers}
              className="flex-1 px-2 py-1.5 text-[10.5px] bg-dark-panel2 border border-dark-border text-dark-muted rounded hover:border-cyan hover:text-cyan transition-colors"
            >
              全員非表示
            </button>
          </div>
        </div>

        {/* ドライバーリスト */}
        <div className="flex-1 overflow-y-auto py-1">
          {drivers.map((driver) => {
            const isActive = activeDrivers.has(driver.id);
            const count = driverCounts.get(driver.id) || 0;

            return (
              <div
                key={driver.id}
                onClick={() => toggleDriver(driver.id)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-dark-panel2 ${
                  !isActive ? "opacity-35" : ""
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: driver.color }}
                />
                <span className="text-[13px] font-semibold text-white flex-1">
                  {driver.name}
                </span>
                <span className="text-[11px] text-dark-muted tabular-nums">
                  {count}件
                </span>
              </div>
            );
          })}
        </div>

        {/* 油種フィルタ */}
        <div className="p-3 border-t border-dark-border">
          <div className="text-[9.5px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            油種フィルタ
          </div>
          <div className="flex gap-1">
            {(["all", "軽油", "重油", "灯油"] as const).map((oil) => (
              <button
                key={oil}
                onClick={() => setActiveOil(oil)}
                className={`flex-1 px-2 py-1.5 text-[10.5px] border rounded transition-colors ${
                  activeOil === oil
                    ? "bg-cyan border-cyan text-black font-bold"
                    : "bg-transparent border-dark-border text-dark-muted hover:border-cyan hover:text-cyan"
                }`}
              >
                {oil === "all" ? "全て" : oil}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* マップエリア */}
      <div className="flex-1 relative">
        <MapContainer
          center={[35.685, 139.38]}
          zoom={11}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* マーカー表示 */}
          {viewMode === "markers" &&
            filteredDeliveries.map((delivery) => (
              <CircleMarker
                key={delivery.id}
                center={[delivery.lat!, delivery.lng!]}
                radius={6}
                pathOptions={{
                  color: "#fff",
                  weight: 2,
                  fillColor:
                    driverColorMap.get(delivery.driver_id || "") || "#666",
                  fillOpacity: 1,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <strong>{delivery.company_name}</strong>
                  <br />
                  <small>
                    {delivery.driver?.name} / {delivery.date}
                  </small>
                </Tooltip>
              </CircleMarker>
            ))}

          {/* ヒートマップ表示 */}
          {viewMode === "heatmap" && heatmapPoints.length > 0 && (
            <HeatmapLayer points={heatmapPoints} />
          )}

          {/* エリア分析表示 */}
          {viewMode === "areas" && (
            <DriverAreaLayer
              deliveries={filteredDeliveries}
              drivers={drivers}
              activeDrivers={activeDrivers}
            />
          )}
        </MapContainer>

        {/* 統計 */}
        <div className="absolute top-4 right-4 z-[1000] flex gap-4">
          <div className="bg-[rgba(13,15,26,0.88)] border border-dark-border rounded-lg px-4 py-2 backdrop-blur-sm text-right">
            <div className="text-[22px] font-extrabold text-white tabular-nums">
              {filteredDeliveries.length}
            </div>
            <div className="text-[9px] text-dark-muted tracking-wide">
              表示件数
            </div>
          </div>
          <div className="bg-[rgba(13,15,26,0.88)] border border-dark-border rounded-lg px-4 py-2 backdrop-blur-sm text-right">
            <div className="text-[22px] font-extrabold text-white tabular-nums">
              {new Set(filteredDeliveries.map((d) => d.driver_id).filter(Boolean)).size}
            </div>
            <div className="text-[9px] text-dark-muted tracking-wide">
              稼働ドライバー
            </div>
          </div>
        </div>

        {/* 凡例 */}
        <div className="absolute bottom-5 left-4 z-[1000] bg-[rgba(13,15,26,0.88)] border border-dark-border rounded-lg p-3 backdrop-blur-sm">
          <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            凡例
          </div>
          {drivers
            .filter((d) => activeDrivers.has(d.id) && driverCounts.get(d.id))
            .slice(0, 8)
            .map((driver) => (
              <div
                key={driver.id}
                className="flex items-center gap-2 mb-1 text-[11px]"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: driver.color }}
                />
                <span className="text-dark-text">{driver.name}</span>
                <span className="ml-auto text-dark-muted tabular-nums">
                  {driverCounts.get(driver.id) || 0}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
