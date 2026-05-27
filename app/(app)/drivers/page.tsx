import { createClient } from "@/lib/supabase/server";
import type { Driver } from "@/lib/types";

export default async function DriversPage() {
  const supabase = await createClient();

  const { data: driversData, error } = await supabase
    .from("drivers")
    .select("*")
    .order("name");

  const drivers = driversData as Driver[] | null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">ドライバー管理</h1>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            エラー: {error.message}
          </p>
          <p className="text-dark-muted text-xs mt-2">
            Supabaseの設定を確認してください
          </p>
        </div>
      ) : drivers && drivers.length > 0 ? (
        <div className="bg-dark-panel border border-dark-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide">
                  カラー
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide">
                  名前
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide">
                  車両番号
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wide">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-dark-panel2">
                  <td className="px-4 py-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: driver.color }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-white">
                      {driver.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-dark-muted">
                      {driver.vehicle_no ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        driver.is_active
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {driver.is_active ? "アクティブ" : "非アクティブ"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-dark-panel border border-dark-border rounded-lg p-8 text-center">
          <p className="text-dark-muted">
            ドライバーが登録されていません
          </p>
          <p className="text-dark-muted text-sm mt-2">
            Supabaseで002_seed_drivers.sqlを実行してください
          </p>
        </div>
      )}
    </div>
  );
}
