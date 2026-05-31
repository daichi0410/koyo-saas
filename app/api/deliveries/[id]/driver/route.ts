import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RequestBody {
  driver_id: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: RequestBody = await request.json();
    const { driver_id } = body;

    const supabase = await createClient();

    // ドライバーIDの更新
    const { data, error } = await supabase
      .from("deliveries")
      .update({ driver_id })
      .eq("id", id)
      .select("*, driver:drivers(*)")
      .single();

    if (error) {
      console.error("Error updating driver:", error);
      return NextResponse.json(
        { error: "Failed to update driver" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/deliveries/[id]/driver:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
