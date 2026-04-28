"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { cn, shortenAddress } from "@/lib/utils";

export function WalletButton() {
  const { connected, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-2",
        connected ? "min-w-[220px]" : "min-w-fit",
      )}
    >
      {mounted ? (
        <WalletMultiButton />
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-600 bg-zinc-800 px-5 text-sm font-semibold text-zinc-100"
        >
          Connect Wallet
        </button>
      )}
      {connected && publicKey ? (
        <p className="px-2 text-sm text-zinc-400">{shortenAddress(publicKey.toBase58())}</p>
      ) : null}
    </div>
  );
}
