import { createClient } from "@/lib/supabase/server";
import { DeliveryForm } from "@/components/deliveries/DeliveryForm";
import type { Driver } from "@/lib/types";

interface SearchParams {
  date?: string;
  driver?: string;
}

export default async function NewDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // デフォルトは今日
  const defaultDate =
    params.date || new Date().toISOString().split("T")[0];

  // ドライバー一覧を取得
  const { data: driversData } = await supabase
    .from("drivers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const drivers = (driversData || []) as Driver[];

  // 過去の会社名を取得（オートコンプリート用）
  const { data: companiesRaw } = await supabase
    .from("deliveries")
    .select("company_name, address")
    .order("created_at", { ascending: false })
    .limit(500);

  const companiesData = (companiesRaw || []) as { company_name: string; address: string | null }[];

  // ユニークな会社名リストを作成
  const companyNames = Array.from(
    new Set(companiesData.map((c) => c.company_name))
  );

  // 会社名と住所のマッピング
  const companyAddresses = new Map<string, string>();
  companiesData.forEach((c) => {
    if (c.company_name && c.address && !companyAddresses.has(c.company_name)) {
      companyAddresses.set(c.company_name, c.address);
    }
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">新規配車入力</h1>
      <DeliveryForm
        drivers={drivers}
        defaultDate={defaultDate}
        defaultDriverId={params.driver}
        companyNames={companyNames}
        companyAddresses={Object.fromEntries(companyAddresses)}
      />
    </div>
  );
}
