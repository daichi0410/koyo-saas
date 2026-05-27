"use client";

import { Circle, Tooltip } from "react-leaflet";
import type { Driver, DeliveryWithDriver } from "@/lib/types";

interface DriverAreaLayerProps {
  deliveries: DeliveryWithDriver[];
  drivers: Driver[];
  activeDrivers: Set<string>;
}

interface DriverArea {
  driver: Driver;
  center: [number, number];
  radius: number;
  count: number;
}

// ドライバーごとの配送エリア（中心点と半径）を計算
function calculateDriverAreas(
  deliveries: DeliveryWithDriver[],
  drivers: Driver[],
  activeDrivers: Set<string>
): DriverArea[] {
  const areas: DriverArea[] = [];

  for (const driver of drivers) {
    if (!activeDrivers.has(driver.id)) continue;

    const driverDeliveries = deliveries.filter(
      (d) => d.driver_id === driver.id && d.lat && d.lng
    );

    if (driverDeliveries.length === 0) continue;

    // 中心点を計算（平均値）
    const sumLat = driverDeliveries.reduce((sum, d) => sum + d.lat!, 0);
    const sumLng = driverDeliveries.reduce((sum, d) => sum + d.lng!, 0);
    const centerLat = sumLat / driverDeliveries.length;
    const centerLng = sumLng / driverDeliveries.length;

    // 半径を計算（中心点から最も遠い配送先までの距離）
    let maxDistance = 0;
    for (const d of driverDeliveries) {
      const distance = calculateDistance(centerLat, centerLng, d.lat!, d.lng!);
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }

    // 最小半径を設定（1km）
    const radius = Math.max(maxDistance * 1.1, 1000);

    areas.push({
      driver,
      center: [centerLat, centerLng],
      radius,
      count: driverDeliveries.length,
    });
  }

  return areas;
}

// 2点間の距離を計算（メートル単位）
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function DriverAreaLayer({
  deliveries,
  drivers,
  activeDrivers,
}: DriverAreaLayerProps) {
  const areas = calculateDriverAreas(deliveries, drivers, activeDrivers);

  return (
    <>
      {areas.map((area) => (
        <Circle
          key={area.driver.id}
          center={area.center}
          radius={area.radius}
          pathOptions={{
            color: area.driver.color,
            weight: 2,
            fillColor: area.driver.color,
            fillOpacity: 0.15,
            dashArray: "5, 5",
          }}
        >
          <Tooltip direction="center" permanent className="driver-area-label">
            <div className="text-center">
              <div className="font-bold">{area.driver.name}</div>
              <div className="text-xs opacity-75">{area.count}件</div>
            </div>
          </Tooltip>
        </Circle>
      ))}
    </>
  );
}
