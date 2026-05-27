"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import type { Driver, DeliveryWithDriver } from "@/lib/types";

interface StatsDashboardProps {
  deliveries: DeliveryWithDriver[];
  drivers: Driver[];
}

const OIL_COLORS = {
  軽油: "#45B7D1",
  重油: "#FF6B6B",
  灯油: "#FFD93D",
};

export function StatsDashboard({ deliveries, drivers }: StatsDashboardProps) {
  // ドライバー別件数
  const driverStats = drivers
    .map((driver) => ({
      name: driver.name,
      color: driver.color,
      count: deliveries.filter((d) => d.driver_id === driver.id).length,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);

  // 油種別件数
  const oilStats = Object.entries(
    deliveries.reduce(
      (acc, d) => {
        acc[d.oil_type] = (acc[d.oil_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([name, value]) => ({ name, value }));

  // 日別件数
  const dailyStats = Object.entries(
    deliveries.reduce(
      (acc, d) => {
        acc[d.date] = (acc[d.date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  )
    .map(([date, count]) => ({
      date: date.slice(5), // MM-DD形式
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 会社別ランキング
  const companyStats = Object.entries(
    deliveries.reduce(
      (acc, d) => {
        acc[d.company_name] = (acc[d.company_name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="bg-dark-panel border-t border-dark-border p-4">
      <div className="grid grid-cols-4 gap-4">
        {/* 総配送件数 */}
        <div className="bg-dark-panel2 border border-dark-border rounded-lg p-4">
          <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            総配送件数
          </div>
          <div className="text-3xl font-extrabold text-white tabular-nums">
            {deliveries.length}
          </div>
          <div className="text-xs text-dark-muted mt-1">
            稼働ドライバー: {driverStats.length}名
          </div>
        </div>

        {/* ドライバー別棒グラフ */}
        <div className="bg-dark-panel2 border border-dark-border rounded-lg p-4">
          <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            ドライバー別件数
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={driverStats.slice(0, 6)} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={40}
                tick={{ fontSize: 10, fill: "#8E95A9" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1d2e",
                  border: "1px solid #2d3348",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {driverStats.slice(0, 6).map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 油種別円グラフ */}
        <div className="bg-dark-panel2 border border-dark-border rounded-lg p-4">
          <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            油種別割合
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie
                  data={oilStats}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                >
                  {oilStats.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={OIL_COLORS[entry.name as keyof typeof OIL_COLORS] || "#666"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1">
              {oilStats.map((stat) => (
                <div key={stat.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        OIL_COLORS[stat.name as keyof typeof OIL_COLORS] || "#666",
                    }}
                  />
                  <span className="text-dark-muted">{stat.name}</span>
                  <span className="text-white font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 日別推移 */}
        <div className="bg-dark-panel2 border border-dark-border rounded-lg p-4">
          <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-2">
            日別推移
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#8E95A9" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1d2e",
                  border: "1px solid #2d3348",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00D1C1"
                strokeWidth={2}
                dot={{ fill: "#00D1C1", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 会社別ランキング */}
      <div className="mt-4 bg-dark-panel2 border border-dark-border rounded-lg p-4">
        <div className="text-[9px] font-bold tracking-widest text-dark-muted uppercase mb-3">
          よく行く会社 TOP10
        </div>
        <div className="grid grid-cols-5 gap-2">
          {companyStats.map((stat, index) => (
            <div
              key={stat.name}
              className="flex items-center gap-2 bg-dark-panel border border-dark-border rounded px-3 py-2"
            >
              <span className="text-xs font-bold text-cyan w-4">
                {index + 1}
              </span>
              <span className="text-xs text-dark-text truncate flex-1">
                {stat.name}
              </span>
              <span className="text-xs text-dark-muted tabular-nums">
                {stat.count}件
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
