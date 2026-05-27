"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Driver, OilType } from "@/lib/types";

interface DeliveryFormProps {
  drivers: Driver[];
  defaultDate: string;
  defaultDriverId?: string;
  companyNames: string[];
  companyAddresses: Record<string, string>;
}

export function DeliveryForm({
  drivers,
  defaultDate,
  defaultDriverId,
  companyNames,
  companyAddresses,
}: DeliveryFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<string[]>([]);

  const companyInputRef = useRef<HTMLInputElement>(null);

  // フォームデータ
  const [formData, setFormData] = useState({
    date: defaultDate,
    driver_id: defaultDriverId || "",
    company_name: "",
    site_name: "",
    address: "",
    lat: null as number | null,
    lng: null as number | null,
    oil_type: "軽油" as OilType,
    quantity: "",
    vehicle_no: "",
    time_spec: "",
    tel: "",
    contact_name: "",
    notes: "",
  });

  // 会社名の入力でオートコンプリート
  const handleCompanyNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, company_name: value }));

    if (value.length > 0) {
      const filtered = companyNames.filter((name) =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCompanies(filtered.slice(0, 10));
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredCompanies([]);
      setShowSuggestions(false);
    }
  };

  // 会社名を選択
  const selectCompany = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      company_name: name,
      address: companyAddresses[name] || prev.address,
    }));
    setShowSuggestions(false);

    // 住所があればジオコーディング
    if (companyAddresses[name]) {
      geocodeAddress(companyAddresses[name]);
    }
  };

  // 住所をジオコーディング
  const geocodeAddress = async (address: string) => {
    if (!address) return;

    setGeocoding(true);
    try {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );
      const data = await res.json();

      if (data.lat && data.lng) {
        setFormData((prev) => ({
          ...prev,
          lat: data.lat,
          lng: data.lng,
        }));
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    } finally {
      setGeocoding(false);
    }
  };

  // 住所入力後にジオコーディング
  const handleAddressBlur = () => {
    if (formData.address && (!formData.lat || !formData.lng)) {
      geocodeAddress(formData.address);
    }
  };

  // フォーム送信
  const handleSubmit = async (continueInput: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from("deliveries").insert({
        date: formData.date,
        driver_id: formData.driver_id || null,
        company_name: formData.company_name,
        site_name: formData.site_name || null,
        address: formData.address || null,
        lat: formData.lat,
        lng: formData.lng,
        oil_type: formData.oil_type,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        vehicle_no: formData.vehicle_no || null,
        time_spec: formData.time_spec || null,
        tel: formData.tel || null,
        contact_name: formData.contact_name || null,
        notes: formData.notes || null,
        status: "scheduled",
        source: "manual",
      });

      if (error) throw error;

      if (continueInput) {
        // 続けて入力: ドライバー・日付を保持してフォームをリセット
        setFormData((prev) => ({
          ...prev,
          company_name: "",
          site_name: "",
          address: "",
          lat: null,
          lng: null,
          quantity: "",
          vehicle_no: "",
          time_spec: "",
          tel: "",
          contact_name: "",
          notes: "",
        }));
        companyInputRef.current?.focus();
      } else {
        // 配車一覧に戻る
        router.push(`/deliveries?date=${formData.date}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // クリックで候補を閉じる
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(false);
      }}
      className="bg-dark-panel border border-dark-border rounded-lg p-6 space-y-5"
    >
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

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
            required
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
      <div className="relative">
        <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
          会社名 <span className="text-red-400">*</span>
        </label>
        <input
          ref={companyInputRef}
          type="text"
          value={formData.company_name}
          onChange={(e) => handleCompanyNameChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          required
          placeholder="会社名を入力（過去の入力から候補表示）"
          className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan"
        />

        {/* オートコンプリート候補 */}
        {showSuggestions && filteredCompanies.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-dark-panel2 border border-dark-border rounded shadow-lg max-h-48 overflow-y-auto">
            {filteredCompanies.map((name) => (
              <div
                key={name}
                onClick={(e) => {
                  e.stopPropagation();
                  selectCompany(name);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-dark-panel text-sm text-dark-text"
              >
                {name}
                {companyAddresses[name] && (
                  <span className="text-xs text-dark-muted ml-2">
                    {companyAddresses[name]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 現場名 */}
      <div>
        <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
          現場名（会社と異なる場合）
        </label>
        <input
          type="text"
          value={formData.site_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, site_name: e.target.value }))
          }
          placeholder="例: 〇〇工場"
          className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan"
        />
      </div>

      {/* 住所 */}
      <div>
        <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
          住所
          {geocoding && (
            <span className="ml-2 text-cyan">位置情報を取得中...</span>
          )}
          {formData.lat && formData.lng && (
            <span className="ml-2 text-green-400">✓ 位置情報取得済み</span>
          )}
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, address: e.target.value }))
          }
          onBlur={handleAddressBlur}
          placeholder="例: 八王子市〇〇町1-2-3"
          className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan"
        />
      </div>

      {/* 油種 */}
      <div>
        <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wide mb-2">
          油種 <span className="text-red-400">*</span>
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
            placeholder="例: 500"
            className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan"
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
            placeholder="例: 38"
            className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan"
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
          placeholder="例: 8:00〜9:00 / 午前中 / 夕方"
          className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan"
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
            placeholder="例: 田中様"
            className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan"
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
            placeholder="例: 090-1234-5678"
            className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan"
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
          placeholder="その他の情報"
          className="w-full px-3 py-2.5 bg-dark-panel2 border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-cyan resize-none"
        />
      </div>

      {/* ボタン */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-sm text-dark-muted border border-dark-border rounded hover:text-dark-text hover:border-dark-text transition-colors"
        >
          キャンセル
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading || !formData.company_name}
          className="px-4 py-2.5 text-sm font-medium bg-dark-panel2 border border-cyan text-cyan rounded hover:bg-cyan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          保存して続けて入力
        </button>

        <button
          type="submit"
          disabled={loading || !formData.company_name}
          className="px-6 py-2.5 text-sm font-bold bg-cyan text-black rounded hover:bg-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
