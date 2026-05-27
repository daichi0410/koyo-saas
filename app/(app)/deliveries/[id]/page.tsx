import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DeliveryDetail } from "@/components/deliveries/DeliveryDetail";
import type { Driver, DeliveryWithDriver } from "@/lib/types";

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 配車データを取得
  const { data: deliveryData, error } = await supabase
    .from("deliveries")
    .select("*, driver:drivers(*)")
    .eq("id", id)
    .single();

  if (error || !deliveryData) {
    notFound();
  }

  const delivery = deliveryData as DeliveryWithDriver;

  // ドライバー一覧を取得
  const { data: driversData } = await supabase
    .from("drivers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const drivers = (driversData || []) as Driver[];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <DeliveryDetail delivery={delivery} drivers={drivers} />
    </div>
  );
}
