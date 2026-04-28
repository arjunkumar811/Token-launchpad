import {
  AuthorityType,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { createMetadataAccountV3, findMetadataPda, updateV1 } from "@metaplex-foundation/mpl-token-metadata";
import { createNoopSigner, none, some } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fromWeb3JsPublicKey,
  toWeb3JsLegacyTransaction,
} from "@metaplex-foundation/umi-web3js-adapters";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { SendTransactionOptions } from "@solana/wallet-adapter-base";

import {
  CreateTokenParams,
  CreateTokenResult,
  DEFAULT_SOLANA_NETWORK,
} from "@/types/token";

export async function createToken({
  authoritySettings,
  connection,
  decimals,
  metadataUri,
  name,
  onStepChange,
  sendTransaction,
  supply,
  symbol,
  walletPublicKey,
}: CreateTokenParams): Promise<CreateTokenResult> {
  const mintKeypair = Keypair.generate();
  const associatedTokenAddress = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    walletPublicKey,
  );
  const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
  const amount = toBaseUnits(supply, decimals);

  onStepChange?.("Creating Mint");

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: walletPublicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintRent,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(
      mintKeypair.publicKey,
      decimals,
      walletPublicKey,
      authoritySettings.revokeFreezeAuthority ? null : walletPublicKey,
    ),
    createAssociatedTokenAccountInstruction(
      walletPublicKey,
      associatedTokenAddress,
      walletPublicKey,
      mintKeypair.publicKey,
    ),
  );

  onStepChange?.("Minting Tokens");
  transaction.add(
    createMintToInstruction(
      mintKeypair.publicKey,
      associatedTokenAddress,
      walletPublicKey,
      amount,
    ),
  );

  onStepChange?.("Finalizing Metadata");
  const metadataInstructions = await buildMetadataInstructions({
    connection,
    metadataUri,
    mint: mintKeypair.publicKey,
    name,
    revokeUpdateAuthority: authoritySettings.revokeUpdateAuthority,
    symbol,
    walletPublicKey,
  });
  metadataInstructions.forEach((instruction) => transaction.add(instruction));

  if (authoritySettings.revokeMintAuthority) {
    transaction.add(
      createSetAuthorityInstruction(
        mintKeypair.publicKey,
        walletPublicKey,
        AuthorityType.MintTokens,
        null,
      ),
    );
  }

  if (authoritySettings.revokeFreezeAuthority) {
    transaction.add(
      createSetAuthorityInstruction(
        mintKeypair.publicKey,
        walletPublicKey,
        AuthorityType.FreezeAccount,
        null,
      ),
    );
  }

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  transaction.feePayer = walletPublicKey;
  transaction.recentBlockhash = latestBlockhash.blockhash;

  const signature = await sendTransaction(
    transaction,
    connection,
    { signers: [mintKeypair] } as SendTransactionOptions,
  );

  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    network: DEFAULT_SOLANA_NETWORK,
    signature,
  };
}

async function buildMetadataInstructions({
  connection,
  metadataUri,
  mint,
  name,
  revokeUpdateAuthority,
  symbol,
  walletPublicKey,
}: {
  connection: Connection;
  metadataUri: string;
  mint: PublicKey;
  name: string;
  revokeUpdateAuthority: boolean;
  symbol: string;
  walletPublicKey: PublicKey;
}) {
  const umi = createUmi(connection);
  const walletSigner = createNoopSigner(fromWeb3JsPublicKey(walletPublicKey));
  umi.identity = walletSigner;
  umi.payer = walletSigner;

  const mintPublicKey = fromWeb3JsPublicKey(mint);
  const metadataPda = findMetadataPda(umi, { mint: mintPublicKey });

  const builder = createMetadataAccountV3(umi, {
    mint: mintPublicKey,
    mintAuthority: walletSigner,
    payer: walletSigner,
    updateAuthority: walletSigner,
    metadata: metadataPda,
    data: {
      name,
      symbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      creators: none(),
      collection: none(),
      uses: none(),
    },
    isMutable: !revokeUpdateAuthority,
    collectionDetails: none(),
  }).useLegacyVersion();

  if (revokeUpdateAuthority) {
    builder.add(
      updateV1(umi, {
        authority: walletSigner,
        mint: mintPublicKey,
        metadata: metadataPda,
        newUpdateAuthority: none(),
        data: none(),
        primarySaleHappened: none(),
        isMutable: some(false),
      }),
    );
  }

  const metadataTransaction = await builder.buildWithLatestBlockhash(umi);
  return toWeb3JsLegacyTransaction(metadataTransaction).instructions;
}

function toBaseUnits(value: string, decimals: number): bigint {
  const [wholePart, fractionalPart = ""] = value.split(".");

  if (fractionalPart.length > decimals) {
    throw new Error(`Supply supports up to ${decimals} decimal places.`);
  }

  const whole = BigInt(wholePart || "0");
  const paddedFraction = (fractionalPart + "0".repeat(decimals)).slice(0, decimals);
  const fraction = BigInt(paddedFraction || "0");

  return whole * BigInt(10) ** BigInt(decimals) + fraction;
}
