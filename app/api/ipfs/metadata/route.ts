import { NextResponse } from "next/server";

const PINATA_JSON_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export async function POST(request: Request) {
  const pinataJwt = process.env.PINATA_JWT;

  if (!pinataJwt) {
    return NextResponse.json(
      { error: "PINATA_JWT is not configured on the server." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const symbol = typeof body.symbol === "string" ? body.symbol.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";

  if (!name || !symbol || !description || !image) {
    return NextResponse.json(
      { error: "Metadata must include name, symbol, description, and image." },
      { status: 400 },
    );
  }

  const response = await fetch(PINATA_JSON_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: body,
      pinataMetadata: {
        name: `${name}-metadata`,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Pinata metadata upload failed", {
      status: response.status,
      statusText: response.statusText,
      errorBody,
      metadataName: name,
      metadataSymbol: symbol,
    });

    return NextResponse.json(
      { error: `Pinata metadata upload failed: ${errorBody}` },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as { IpfsHash: string };

  return NextResponse.json({
    ipfsHash: payload.IpfsHash,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${payload.IpfsHash}`,
  });
}
