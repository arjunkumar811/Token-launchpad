import type { Connection, PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export const DEFAULT_SOLANA_NETWORK = "devnet";

export type CreateTokenStep =
  | "Uploading Image"
  | "Uploading Metadata"
  | "Creating Mint"
  | "Minting Tokens"
  | "Finalizing Metadata";

export type StepState = "idle" | "active" | "complete" | "error";

export type SocialLinks = {
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
};

export type AuthoritySettings = {
  revokeMintAuthority: boolean;
  revokeFreezeAuthority: boolean;
  revokeUpdateAuthority: boolean;
};

export type TokenFormValues = {
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  description: string;
  imageFile: File | null;
  socialLinksEnabled: boolean;
  socialLinks: SocialLinks;
  authoritySettings: AuthoritySettings;
};

export type TokenMetadataPayload = {
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  imageMimeType: string;
  socialLinks: SocialLinks;
};

export type CreateTokenParams = {
  authoritySettings: AuthoritySettings;
  connection: Connection;
  decimals: number;
  metadataUri: string;
  name: string;
  onStepChange?: (step: CreateTokenStep) => void;
  sendTransaction: WalletContextState["sendTransaction"];
  supply: string;
  symbol: string;
  walletPublicKey: PublicKey;
};

export type CreateTokenResult = {
  mintAddress: string;
  network: string;
  signature: string;
};

export type TokenCreationResult = CreateTokenResult & {
  explorerUrl: string;
  name: string;
  symbol: string;
};

export type ExplorerResult = {
  label: string;
  state: StepState;
};

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  website: "",
  twitter: "",
  telegram: "",
  discord: "",
};

export const DEFAULT_AUTHORITY_SETTINGS: AuthoritySettings = {
  revokeMintAuthority: false,
  revokeFreezeAuthority: false,
  revokeUpdateAuthority: false,
};
