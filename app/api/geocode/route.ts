import { NextRequest, NextResponse } from "next/server";

// 国土地理院APIを使用してジオコーディング
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "address parameter is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`
    );

    if (!res.ok) {
      throw new Error("Geocoding API failed");
    }

    const data = await res.json();

    if (data && data.length > 0) {
      const [lng, lat] = data[0].geometry.coordinates;
      return NextResponse.json({
        lat,
        lng,
        address: data[0].properties.title,
      });
    }

    return NextResponse.json({ lat: null, lng: null, address: null });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: 500 }
    );
  }
}
