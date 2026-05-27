"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Driver, DeliveryWithDriver, DeliveryStatus } from "@/lib/types";

interface DeliveryDetailProps {
  delivery: DeliveryWithDriver;
  drivers: Driver[];
}

const statusLabels: Record<DeliveryStatus, string> = {
  scheduled: "予定",
  in_progress: "進行中",
  completed: "完了",
  cancelled: "キャンセル",
};

export function DeliveryDetail({ delivery, drivers }: DeliveryDetailProps) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<DeliveryStatus>(delivery.status);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (newStatus: DeliveryStatus) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({ status: newStatus })
        .eq("id", delivery.id);

      if (error) throw error;
      setStatus(newStatus);
      router.refresh();
    } catch (error) {
      console.error("Status update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("この配車記録を削除しますか？")) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .delete()
        .eq("id", delivery.id);

      if (error) throw error;
      router.push(`/deliveries?date=${delivery.date}`);
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/deliveries?date=${delivery.date}`}
            className="text-xs text-dark-muted hover:text-cyan mb-2 inline-block"
          >
            ← 配車一覧に戻る
          </Link>
          <h1 className="text-xl font-bold text-white">
            {delivery.company_name}
          </h1>
          {delivery.site_name && (
            <p className="text-dark-muted text-sm mt-1">{delivery.site_name}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {delivery.driver && (
            <div className="flex items-center gap-2 bg-dark-panel border border-dark-border rounded px-3 py-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: delivery.driver.color }}
              />
              <span className="text-sm font-medium text-white">
                {delivery.driver.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* メイン情報 */}
      <div className="bg-dark-panel border border-dark-border rounded-lg p-6 space-y-5">
        {/* ステータス変更 */}
        <div>
          <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
            ステータス
          </label>
          <div className="flex gap-2">
            {(
              ["scheduled", "in_progress", "completed", "cancelled"] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={loading}
                className={`flex-1 py-2 text-sm font-medium rounded border transition-colors ${
                  status === s
                    ? s === "scheduled"
                      ? "bg-cyan/20 border-cyan text-cyan"
                      : s === "in_progress"
                        ? "bg-[#FF9F43]/20 border-[#FF9F43] text-[#FF9F43]"
                        : s === "completed"
                          ? "bg-[#A5D6A7]/20 border-[#A5D6A7] text-[#A5D6A7]"
                          : "bg-[#FF6B6B]/20 border-[#FF6B6B] text-[#FF6B6B]"
                    : "bg-dark-panel2 border-dark-border text-dark-muted hover:border-dark-text"
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
              日付
            </label>
            <div className="text-dark-text">{delivery.date}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
              油種
            </label>
            <span className={`oil-tag ${delivery.oil_type}`}>
              {delivery.oil_type}
            </span>
          </div>
        </div>

        {/* 住所 */}
        {delivery.address && (
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
              住所
            </label>
            <div className="text-dark-text">{delivery.address}</div>
            {delivery.lat && delivery.lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${delivery.lat},${delivery.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan hover:underline mt-1 inline-block"
              >
                Google Mapで開く →
              </a>
            )}
          </div>
        )}

        {/* その他の情報 */}
        <div className="grid grid-cols-2 gap-4">
          {delivery.quantity && (
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
                数量
              </label>
              <div className="text-dark-text">{delivery.quantity} L</div>
            </div>
          )}

          {delivery.vehicle_no && (
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
                車両番号
              </label>
              <div className="text-dark-text">{delivery.vehicle_no}号</div>
            </div>
          )}

          {delivery.time_spec && (
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
                時間指定
              </label>
              {delivery.time_spec !== "-" ? (
                <span className="time-tag">{delivery.time_spec}</span>
              ) : (
                <div className="text-dark-muted">指定なし</div>
              )}
            </div>
          )}
        </div>

        {/* 連絡先 */}
        {(delivery.contact_name || delivery.tel) && (
          <div className="grid grid-cols-2 gap-4">
            {delivery.contact_name && (
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
                  担当者
                </label>
                <div className="text-dark-text">{delivery.contact_name}</div>
              </div>
            )}

            {delivery.tel && (
              <div>
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
                  電話番号
                </label>
                <a href={`tel:${delivery.tel}`} className="text-cyan">
                  {delivery.tel}
                </a>
              </div>
            )}
          </div>
        )}

        {/* 備考 */}
        {delivery.notes && (
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
              備考
            </label>
            <div className="text-dark-text whitespace-pre-wrap">
              {delivery.notes}
            </div>
          </div>
        )}
      </div>

      {/* アクション */}
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 transition-colors disabled:opacity-50"
        >
          {deleting ? "削除中..." : "削除"}
        </button>

        <div className="flex-1" />

        <Link
          href={`/deliveries?date=${delivery.date}`}
          className="px-4 py-2 text-sm text-dark-muted border border-dark-border rounded hover:text-dark-text hover:border-dark-text transition-colors"
        >
          戻る
        </Link>
      </div>

      {/* メタ情報 */}
      <div className="text-xs text-dark-muted">
        <div>作成: {new Date(delivery.created_at).toLocaleString("ja-JP")}</div>
        <div>更新: {new Date(delivery.updated_at).toLocaleString("ja-JP")}</div>
        <div>ソース: {delivery.source}</div>
      </div>
    </div>
  );
}
