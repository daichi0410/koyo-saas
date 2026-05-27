"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

function getWeekday(date: Date): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return weekdays[date.getDay()];
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function Header() {
  const pathname = usePathname();
  const today = new Date();

  const getPageTitle = () => {
    if (pathname.startsWith("/analytics")) return "アナリティクス";
    if (pathname.startsWith("/map")) return "エリアマップ";
    if (pathname.startsWith("/deliveries/new")) return "新規配車入力";
    if (pathname.startsWith("/deliveries")) return "配車記録";
    if (pathname.startsWith("/drivers")) return "ドライバー管理";
    return "ダッシュボード";
  };

  return (
    <header className="flex items-center gap-4 px-5 h-[52px] bg-dark-panel border-b border-dark-border flex-shrink-0 z-50">
      {/* ロゴ */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="text-[17px] font-extrabold tracking-tight text-dark-text">
          向陽 <span className="text-cyan">SaaS</span>
        </span>
      </Link>

      {/* 日付チップ */}
      <div className="bg-dark-panel2 border border-dark-border rounded px-3 py-1 text-[11.5px] text-dark-muted tabular-nums">
        {formatDate(today)}{" "}
        <span className="text-[#FF9F43] font-bold">（{getWeekday(today)}）</span>
      </div>

      {/* ページタイトル */}
      <div className="text-sm text-dark-muted font-medium">
        / {getPageTitle()}
      </div>

      {/* スペーサー */}
      <div className="flex-1" />

      {/* 新規追加ボタン */}
      <Link
        href="/deliveries/new"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan text-white text-xs font-bold rounded hover:opacity-90 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
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

      {/* テーマ切り替え */}
      <ThemeToggle />

      {/* ログアウト */}
      <LogoutButton />
    </header>
  );
}
