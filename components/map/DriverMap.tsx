"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Driver, DeliveryWithDriver, OilType } from "@/lib/types";

interface DriverMapProps {
  deliveries: DeliveryWithDriver[];
  drivers: Driver[];
}

// マップの中心を調整するコンポーネント
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.panTo(center, { animate: true, duration: 0.4 });
    }
  }, [center, map]);

  return null;
}

export function DriverMap({ deliveries, drivers }: DriverMapProps) {
  const [activeDrivers, setActiveDrivers] = useState<Set<string>>(
    new Set(drivers.map((d) => d.id))
  );
  const [activeOil, setActiveOil] = useState<OilType | "all">("all");
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryWithDriver | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // ドライバーのカラーマップを作成
  const driverColorMap = new Map(drivers.map((d) => [d.id, d.color]));

  // フィルタリングされた配車データ
  const filteredDeliveries = deliveries.filter((d) => {
    if (!d.lat || !d.lng) return false;
    if (d.driver_id && !activeDrivers.has(d.driver_id)) return false;
    if (activeOil !== "all" && d.oil_type !== activeOil) return false;
    return true;
  });

  // ドライバー別の件数を集計
  const driverCounts = new Map<string, number>();
  filteredDeliveries.forEach((d) => {
    if (d.driver_id) {
      driverCounts.set(d.driver_id, (driverCounts.get(d.driver_id) || 0) + 1);
    }
  });

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

  const handleMarkerClick = (delivery: DeliveryWithDriver) => {
    setSelectedDelivery(delivery);
    if (delivery.lat && delivery.lng) {
      setMapCenter([delivery.lat, delivery.lng]);
    }
  };

  const closeDetail = () => {
    setSelectedDelivery(null);
  };

  // 稼働ドライバー数
  const activeDriverCount = new Set(
    filteredDeliveries.map((d) => d.driver_id).filter(Boolean)
  ).size;

  return (
    <div className="h-full flex">
      {/* サイドバー */}
      <aside className="w-[240px] flex-shrink-0 bg-dark-panel border-r border-dark-border flex flex-col overflow-hidden">
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
                {driver.vehicle_no && (
                  <span className="text-[9.5px] text-dark-muted bg-dark-panel2 border border-dark-border rounded px-1.5 py-0.5">
                    {driver.vehicle_no}号
                  </span>
                )}
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
          zoom={12}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapController center={mapCenter} />

          {filteredDeliveries.map((delivery) => (
            <CircleMarker
              key={delivery.id}
              center={[delivery.lat!, delivery.lng!]}
              radius={6}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: driverColorMap.get(delivery.driver_id || "") || "#666",
                fillOpacity: 1,
              }}
              eventHandlers={{
                click: () => handleMarkerClick(delivery),
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                className="custom-tooltip"
              >
                <strong>{delivery.company_name}</strong>
                <br />
                <small>{delivery.address}</small>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* 凡例 */}
        <div className="absolute bottom-5 left-4 z-[1000] bg-[rgba(13,15,26,0.88)] border border-dark-border rounded-lg p-3 backdrop-blur-sm">
          <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            凡例
          </div>
          {drivers
            .filter((d) => activeDrivers.has(d.id))
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
              {activeDriverCount}
            </div>
            <div className="text-[9px] text-dark-muted tracking-wide">
              稼働ドライバー
            </div>
          </div>
        </div>

        {/* 詳細パネル */}
        <div
          className={`absolute right-0 top-0 w-[290px] h-full bg-dark-panel border-l border-dark-border z-[1000] flex flex-col transition-transform duration-300 ${
            selectedDelivery ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedDelivery && (
            <>
              <div className="p-4 border-b border-dark-border flex justify-between items-start">
                <div>
                  <div className="text-[15px] font-extrabold text-white leading-tight">
                    {selectedDelivery.company_name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          selectedDelivery.driver?.color || "#666",
                      }}
                    />
                    <span className="text-[11px] text-dark-muted">
                      {selectedDelivery.driver?.name || "-"} ドライバー
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeDetail}
                  className="w-6 h-6 flex items-center justify-center bg-dark-panel2 border border-dark-border rounded text-dark-muted hover:text-white hover:border-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
                <div>
                  <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-1">
                    住所
                  </div>
                  <div className="text-[12.5px] text-dark-text">
                    {selectedDelivery.address || "-"}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-1">
                    油種
                  </div>
                  <span className={`oil-tag ${selectedDelivery.oil_type}`}>
                    {selectedDelivery.oil_type}
                  </span>
                </div>

                <div>
                  <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-1">
                    時間指定
                  </div>
                  {selectedDelivery.time_spec &&
                  selectedDelivery.time_spec !== "-" ? (
                    <span className="time-tag">
                      ⏰ {selectedDelivery.time_spec}
                    </span>
                  ) : (
                    <span className="text-dark-muted text-[12.5px]">
                      指定なし
                    </span>
                  )}
                </div>

                {selectedDelivery.vehicle_no && (
                  <div>
                    <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-1">
                      車両 No.
                    </div>
                    <div className="text-[12.5px] text-dark-text">
                      {selectedDelivery.vehicle_no}号車
                    </div>
                  </div>
                )}

                {selectedDelivery.tel && (
                  <div>
                    <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-1">
                      電話番号
                    </div>
                    <a
                      href={`tel:${selectedDelivery.tel}`}
                      className="text-[12.5px] text-cyan"
                    >
                      {selectedDelivery.tel}
                    </a>
                  </div>
                )}

                {selectedDelivery.notes && (
                  <div>
                    <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-1">
                      備考
                    </div>
                    <div className="text-[12.5px] text-dark-text">
                      {selectedDelivery.notes}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
