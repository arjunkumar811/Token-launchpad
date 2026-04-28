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

  const response = await fetch(PINATA_JSON_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: body,
      pinataMetadata: {
        name: typeof body.name === "string" ? `${body.name}-metadata` : "token-metadata",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

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
