import { TokenMetadataPayload } from "@/types/token";

type UploadResponse = {
  gatewayUrl: string;
  ipfsHash: string;
};

export async function uploadTokenImage(file: File): Promise<UploadResponse> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/ipfs/upload", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "Image upload failed.");
  }

  return (await response.json()) as UploadResponse;
}

export async function uploadTokenMetadata(
  payload: TokenMetadataPayload,
): Promise<UploadResponse> {
  const metadata = {
    name: payload.name,
    symbol: payload.symbol,
    description: payload.description,
    image: payload.imageUri,
    external_url: payload.socialLinks.website || undefined,
    properties: {
      files: [
        {
          uri: payload.imageUri,
          type: payload.imageMimeType,
        },
      ],
    },
    extensions: {
      twitter: payload.socialLinks.twitter || undefined,
      telegram: payload.socialLinks.telegram || undefined,
      discord: payload.socialLinks.discord || undefined,
    },
  };

  const response = await fetch("/api/ipfs/metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Metadata upload failed.");
  }

  return (await response.json()) as UploadResponse;
}
