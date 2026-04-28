import { TokenForm } from "@/components/TokenForm";
import { WalletButton } from "@/components/WalletButton";

export default function CreateTokenPage() {
  const pinataConfigured = Boolean(process.env.PINATA_JWT);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-end">
          <WalletButton />
        </div>

        <header className="mx-auto max-w-4xl py-8 text-center sm:py-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-cyan-50">
              Solana Token Creator
            </h1>
            <p className="text-lg text-zinc-300">
              Easily Create your own Solana SPL Token in just 7+1 steps without Coding.
            </p>
          </div>
        </header>

        <section className="py-8 sm:py-12">
          <TokenForm pinataConfigured={pinataConfigured} />
        </section>
      </div>
    </main>
  );
}
