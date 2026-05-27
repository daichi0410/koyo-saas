"use client";

import { useState } from "react";

type PeriodPreset = "today" | "week" | "month" | "30days" | "90days" | "custom";

interface PeriodSelectorProps {
  startDate: string;
  endDate: string;
  onPeriodChange: (start: string, end: string) => void;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getPresetDates(preset: PeriodPreset): { start: string; end: string } {
  const today = new Date();
  const end = formatDate(today);

  switch (preset) {
    case "today":
      return { start: end, end };
    case "week": {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return { start: formatDate(weekAgo), end };
    }
    case "month": {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return { start: formatDate(monthAgo), end };
    }
    case "30days": {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return { start: formatDate(thirtyDaysAgo), end };
    }
    case "90days": {
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);
      return { start: formatDate(ninetyDaysAgo), end };
    }
    default:
      return { start: end, end };
  }
}

export function PeriodSelector({
  startDate,
  endDate,
  onPeriodChange,
}: PeriodSelectorProps) {
  const [activePreset, setActivePreset] = useState<PeriodPreset>("month");
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetClick = (preset: PeriodPreset) => {
    if (preset === "custom") {
      setShowCustom(true);
      setActivePreset("custom");
    } else {
      setShowCustom(false);
      setActivePreset(preset);
      const { start, end } = getPresetDates(preset);
      onPeriodChange(start, end);
    }
  };

  const handleCustomChange = () => {
    onPeriodChange(startDate, endDate);
  };

  const presets: { key: PeriodPreset; label: string }[] = [
    { key: "today", label: "今日" },
    { key: "week", label: "1週間" },
    { key: "month", label: "1ヶ月" },
    { key: "30days", label: "30日" },
    { key: "90days", label: "90日" },
    { key: "custom", label: "カスタム" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* プリセットボタン */}
      <div className="flex gap-1">
        {presets.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePresetClick(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
              activePreset === key
                ? "bg-cyan border-cyan text-black"
                : "bg-dark-panel2 border-dark-border text-dark-muted hover:border-cyan hover:text-cyan"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* カスタム日付入力 */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onPeriodChange(e.target.value, endDate)}
            className="px-2 py-1 text-xs bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
          />
          <span className="text-dark-muted text-xs">〜</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onPeriodChange(startDate, e.target.value)}
            className="px-2 py-1 text-xs bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
          />
        </div>
      )}

      {/* 選択期間表示 */}
      <div className="text-xs text-dark-muted ml-2">
        {startDate} 〜 {endDate}
      </div>
    </div>
  );
}
