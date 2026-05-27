"use client";

import { PeriodSelector } from "./PeriodSelector";

interface AnalyticsPeriodSelectorProps {
  startDate: string;
  endDate: string;
}

export function AnalyticsPeriodSelector({
  startDate,
  endDate,
}: AnalyticsPeriodSelectorProps) {
  const handlePeriodChange = (start: string, end: string) => {
    // URLを更新してページをリロード
    const url = new URL(window.location.href);
    url.searchParams.set("from", start);
    url.searchParams.set("to", end);
    window.location.href = url.toString();
  };

  return (
    <PeriodSelector
      startDate={startDate}
      endDate={endDate}
      onPeriodChange={handlePeriodChange}
    />
  );
}
