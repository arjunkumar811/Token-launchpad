# Token Launchpad

A Next.js Solana token creator that lets you upload token metadata to IPFS and create an SPL token on Solana devnet.

## Requirements

- Node.js 18+
- A Solana wallet such as Phantom, Solflare, or Backpack
- A Pinata JWT for IPFS uploads

## Environment setup

Create a `.env.local` file in the project root:

```env
PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_SOLANA_RPC_URL=
```

Notes:

- `PINATA_JWT` is required. Without it, image and metadata uploads will fail.
- `NEXT_PUBLIC_SOLANA_RPC_URL` is optional. If empty, the app uses Solana devnet's default RPC endpoint.

## Get a Pinata JWT

1. Sign in to Pinata.
2. Create a new API key or JWT with pinning access.
3. Copy the JWT value into `.env.local` as `PINATA_JWT`.
4. Restart the dev server after saving the file.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## What the app does

- Connects a Solana wallet
- Uploads token image to IPFS through a server route
- Uploads token metadata JSON to IPFS
- Creates a new SPL mint on Solana devnet
- Mints the initial supply to the connected wallet
- Optionally revokes mint, freeze, and update authorities

## Troubleshooting

### `PINATA_JWT is not configured on the server`

This means `.env.local` is missing or the dev server was not restarted after adding the variable.

Fix:

1. Create or update `.env.local`
2. Add `PINATA_JWT=your_real_pinata_jwt`
3. Stop the dev server
4. Run `npm run dev` again

### Wallet connects but token creation does not start

Make sure:

- your wallet is connected
- you are on Solana devnet
- `PINATA_JWT` is configured

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
