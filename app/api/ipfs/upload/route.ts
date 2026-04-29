import { NextResponse } from "next/server";

const PINATA_FILE_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

export async function POST(request: Request) {
  const pinataJwt = process.env.PINATA_JWT;

  if (!pinataJwt) {
    return NextResponse.json(
      { error: "PINATA_JWT is not configured on the server." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A valid file is required." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Invalid image type. Only PNG, JPG, or JPEG are allowed." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be 2MB or smaller." }, { status: 400 });
  }

  const uploadData = new FormData();
  uploadData.append("file", file, file.name);
  uploadData.append(
    "pinataMetadata",
    JSON.stringify({
      name: file.name,
    }),
  );

  const response = await fetch(PINATA_FILE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: uploadData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Pinata image upload failed", {
      status: response.status,
      statusText: response.statusText,
      errorBody,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    return NextResponse.json(
      { error: `Pinata upload failed: ${errorBody}` },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as { IpfsHash: string };

  return NextResponse.json({
    ipfsHash: payload.IpfsHash,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${payload.IpfsHash}`,
  });
}
