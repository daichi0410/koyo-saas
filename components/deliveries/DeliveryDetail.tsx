"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Driver, DeliveryWithDriver, DeliveryStatus, OilType } from "@/lib/types";

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

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 編集用フォームデータ
  const [formData, setFormData] = useState({
    date: delivery.date,
    driver_id: delivery.driver_id || "",
    company_name: delivery.company_name,
    site_name: delivery.site_name || "",
    address: delivery.address || "",
    oil_type: delivery.oil_type,
    quantity: delivery.quantity?.toString() || "",
    vehicle_no: delivery.vehicle_no || "",
    time_spec: delivery.time_spec || "",
    tel: delivery.tel || "",
    contact_name: delivery.contact_name || "",
    notes: delivery.notes || "",
    tax_exempt_number: delivery.tax_exempt_number || "",
    unit_price: delivery.unit_price?.toString() || "",
    status: delivery.status,
  });

  const handleStatusChange = async (newStatus: DeliveryStatus) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({ status: newStatus })
        .eq("id", delivery.id);

      if (error) throw error;
      setFormData((prev) => ({ ...prev, status: newStatus }));
      router.refresh();
    } catch (error) {
      console.error("Status update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({
          date: formData.date,
          driver_id: formData.driver_id || null,
          company_name: formData.company_name,
          site_name: formData.site_name || null,
          address: formData.address || null,
          oil_type: formData.oil_type,
          quantity: formData.quantity ? parseFloat(formData.quantity) : null,
          vehicle_no: formData.vehicle_no || null,
          time_spec: formData.time_spec || null,
          tel: formData.tel || null,
          contact_name: formData.contact_name || null,
          notes: formData.notes || null,
          tax_exempt_number: formData.tax_exempt_number || null,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
          status: formData.status,
        })
        .eq("id", delivery.id);

      if (error) throw error;
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Update failed:", error);
      alert("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 元の値に戻す
    setFormData({
      date: delivery.date,
      driver_id: delivery.driver_id || "",
      company_name: delivery.company_name,
      site_name: delivery.site_name || "",
      address: delivery.address || "",
      oil_type: delivery.oil_type,
      quantity: delivery.quantity?.toString() || "",
      vehicle_no: delivery.vehicle_no || "",
      time_spec: delivery.time_spec || "",
      tel: delivery.tel || "",
      contact_name: delivery.contact_name || "",
      notes: delivery.notes || "",
      tax_exempt_number: delivery.tax_exempt_number || "",
      unit_price: delivery.unit_price?.toString() || "",
      status: delivery.status,
    });
    setIsEditing(false);
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

  // 編集モード
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-dark-text">配車記録を編集</h1>
        </div>

        <div className="bg-dark-panel border border-dark-border rounded-lg p-6 space-y-5">
          {/* 日付・ドライバー */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                日付
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                ドライバー
              </label>
              <select
                value={formData.driver_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, driver_id: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
              >
                <option value="">選択してください</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 会社名 */}
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
              会社名
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, company_name: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
            />
          </div>

          {/* 現場名 */}
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
              現場名
            </label>
            <input
              type="text"
              value={formData.site_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, site_name: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
            />
          </div>

          {/* 住所 */}
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
              住所
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
            />
          </div>

          {/* 油種 */}
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
              油種
            </label>
            <div className="flex gap-2">
              {(["軽油", "重油", "灯油"] as OilType[]).map((oil) => (
                <button
                  key={oil}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, oil_type: oil }))
                  }
                  className={`flex-1 py-2.5 text-sm font-medium rounded border transition-colors ${
                    formData.oil_type === oil
                      ? oil === "軽油"
                        ? "bg-oil-keiyu/20 border-oil-keiyu text-oil-keiyu"
                        : oil === "重油"
                          ? "bg-oil-juyu/20 border-oil-juyu text-oil-juyu"
                          : "bg-oil-touyu/20 border-oil-touyu text-oil-touyu"
                      : "bg-dark-panel2 border-dark-border text-dark-muted hover:border-dark-text"
                  }`}
                >
                  {oil}
                </button>
              ))}
            </div>
          </div>

          {/* 数量・車両 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                数量 (L)
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                車両番号
              </label>
              <input
                type="text"
                value={formData.vehicle_no}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, vehicle_no: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
              />
            </div>
          </div>

          {/* 販売単価・免税番号 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                販売単価 (円/L)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unit_price: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                免税番号
              </label>
              <input
                type="text"
                value={formData.tax_exempt_number}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tax_exempt_number: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
              />
            </div>
          </div>

          {/* 時間指定 */}
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
              時間指定
            </label>
            <input
              type="text"
              value={formData.time_spec}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, time_spec: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
            />
          </div>

          {/* 連絡先 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                担当者名
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contact_name: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
                電話番号
              </label>
              <input
                type="tel"
                value={formData.tel}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tel: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan"
              />
            </div>
          </div>

          {/* 備考 */}
          <div>
            <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
              備考
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text focus:outline-none focus:border-cyan resize-none"
            />
          </div>

          {/* ステータス */}
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
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: s }))}
                  className={`flex-1 py-2 text-sm font-medium rounded border transition-colors ${
                    formData.status === s
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
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-dark-muted border border-dark-border rounded hover:text-dark-text hover:border-dark-text transition-colors"
          >
            キャンセル
          </button>

          <div className="flex-1" />

          <button
            onClick={handleSave}
            disabled={loading || !formData.company_name}
            className="px-6 py-2 text-sm font-bold bg-cyan text-white rounded hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    );
  }

  // 表示モード
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
          <h1 className="text-xl font-bold text-dark-text">
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
              <span className="text-sm font-medium text-dark-text">
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
                  formData.status === s
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

          {delivery.unit_price && (
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
                販売単価
              </label>
              <div className="text-dark-text">{delivery.unit_price} 円/L</div>
            </div>
          )}

          {delivery.tax_exempt_number && (
            <div>
              <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-1">
                免税番号
              </label>
              <div className="text-dark-text">{delivery.tax_exempt_number}</div>
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

        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 text-sm font-bold bg-cyan text-white rounded hover:opacity-90 transition-colors"
        >
          編集
        </button>
      </div>

      {/* メタ情報 */}
      <div className="text-xs text-dark-muted">
        <div>作成: {new Date(delivery.created_at).toLocaleString("ja-JP")}</div>
        <div>更新: {new Date(delivery.updated_at).toLocaleString("ja-JP")}</div>
      </div>
    </div>
  );
}
