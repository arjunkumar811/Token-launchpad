# Token Metadata Implementation Notes

To properly implement token metadata (to make tokens appear with correct names in wallets):

1. Install the Metaplex Token Metadata library:
```bash
npm install @metaplex-foundation/mpl-token-metadata
```

2. Import the necessary functions:
```javascript
import { 
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';
```

3. After creating the token mint, add a step to create the metadata:

```javascript
// Define the metadata program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Calculate the metadata account address (PDA - Program Derived Address)
const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
);

// Create a transaction with the metadata creation instruction
const metadataIx = createCreateMetadataAccountV3Instruction(
    {
        metadata: metadataAddress,
        mint: mintKeypair.publicKey,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        updateAuthority: wallet.publicKey,
    },
    {
        createMetadataAccountArgsV3: {
            data: {
                name: tokenName,
                symbol: tokenSymbol,
                uri: "", // Can be updated later with off-chain metadata
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
            },
            isMutable: true,
            collectionDetails: null
        }
    }
);

// Send the transaction to create metadata
const metadataTransaction = new Transaction().add(metadataIx);
// Sign and send the transaction...
```

Note: This approach requires the most recent version of the Metaplex Token Metadata library.

## Alternative Approach

For a more reliable approach, you can use the Metaplex JS SDK which abstracts the complexity:

```javascript
import { Metaplex } from "@metaplex-foundation/js";

// Create a Metaplex instance
const metaplex = Metaplex.make(connection);

// Create token with metadata in one go
const { token } = await metaplex.tokens().createToken({
  name: tokenName,
  symbol: tokenSymbol,
  decimals: tokenDecimals,
  initialSupply: tokenSupply
});
```

This requires installing `@metaplex-foundation/js` instead.