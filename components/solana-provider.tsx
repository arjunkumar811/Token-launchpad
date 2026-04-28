"use client";

import { ComponentType, PropsWithChildren, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

import { DEFAULT_SOLANA_NETWORK } from "@/types/token";

const SafeConnectionProvider = ConnectionProvider as ComponentType<{
  children?: React.ReactNode;
  endpoint: string;
}>;

const SafeWalletProvider = WalletProvider as ComponentType<{
  autoConnect?: boolean;
  children?: React.ReactNode;
  wallets: ReturnType<typeof createWalletAdapters>;
}>;

const SafeWalletModalProvider = WalletModalProvider as ComponentType<{
  children?: React.ReactNode;
}>;

function getEndpoint() {
  const configured = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

  if (configured) {
    return configured;
  }

  return clusterApiUrl(DEFAULT_SOLANA_NETWORK);
}

function createWalletAdapters() {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
  ];
}

export function SolanaProvider({ children }: PropsWithChildren) {
  const endpoint = useMemo(() => getEndpoint(), []);
  const wallets = useMemo(() => createWalletAdapters(), []);

  return (
    <SafeConnectionProvider endpoint={endpoint}>
      <SafeWalletProvider wallets={wallets} autoConnect>
        <SafeWalletModalProvider>{children}</SafeWalletModalProvider>
      </SafeWalletProvider>
    </SafeConnectionProvider>
  );
}
