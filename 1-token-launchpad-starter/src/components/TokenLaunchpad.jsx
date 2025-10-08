import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { MINT_SIZE, TOKEN_2022_PROGRAM_ID, createMintToInstruction, createAssociatedTokenAccountInstruction, getMintLen, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, TYPE_SIZE, LENGTH_SIZE, ExtensionType, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { useState } from "react";

export function TokenLaunchpad() {
    const wallet = useWallet();
    const { connection } = useConnection();
    
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        image: '',
        supply: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Token name is required';
        }
        
        if (!formData.symbol.trim()) {
            newErrors.symbol = 'Token symbol is required';
        }
        
        if (!formData.supply.trim()) {
            newErrors.supply = 'Initial supply is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

     // const name = document.getElementById('name').value;
        // const symbol = document.getElementById('symbol').value;
        // const image = document.getElementById('image').value;
        // const supply = document.getElementById('supply').value;  

    async function createToken() {
        if (!wallet.connected) {
            setErrors({ general: 'Please connect your wallet first' });
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const mintKeypair = Keypair.generate();
            
            const metadata = {
                mint: mintKeypair.publicKey,
                name: formData.name,
                symbol: formData.symbol.toUpperCase(),
                uri: formData.image,
                additionalMetadata: [],
            };

            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeMetadataPointerInstruction(
                    mintKeypair.publicKey, 
                    wallet.publicKey, 
                    mintKeypair.publicKey, 
                    TOKEN_2022_PROGRAM_ID
                ),
                createInitializeMintInstruction(
                    mintKeypair.publicKey, 
                    9, 
                    wallet.publicKey, 
                    null, 
                    TOKEN_2022_PROGRAM_ID
                ),
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mintKeypair.publicKey,
                    metadata: mintKeypair.publicKey,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                }),
            );
           
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.partialSign(mintKeypair);

            await wallet.sendTransaction(transaction, connection);
            
            console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);
            
            const associatedToken = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );
            
            console.log(`Associated token account: ${associatedToken.toBase58()}`);
            
            const transaction2 = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),
            );
            
            await wallet.sendTransaction(transaction2, connection);
            
            const supplyAmount = parseInt(formData.supply) * (10 ** 9);
            
            const transaction3 = new Transaction().add(
                createMintToInstruction(
                    mintKeypair.publicKey, 
                    associatedToken, 
                    wallet.publicKey, 
                    supplyAmount, 
                    [], 
                    TOKEN_2022_PROGRAM_ID
                )
            );
            
            await wallet.sendTransaction(transaction3, connection);
            
            console.log("Tokens minted successfully!");
            console.log(`Token Details:`, {
                name: formData.name,
                symbol: formData.symbol.toUpperCase(),
                image: formData.image,
                supply: formData.supply
            });
            
            setFormData({ name: '', symbol: '', image: '', supply: '' });
            alert(`Token created successfully!\nMint Address: ${mintKeypair.publicKey.toBase58()}`);
            
        } catch (error) {
            console.error('Error creating token:', error);
            setErrors({ 
                general: error.message || 'Failed to create token. Please try again.' 
            });
        } finally {
            setIsLoading(false);
        }
    }



    return <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
    }}>
        <h1>Solana Token Launchpad</h1>
        
        {errors.general && (
            <div style={{
                color: 'red',
                backgroundColor: '#ffebee',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
                border: '1px solid #ffcdd2'
            }}>
                {errors.general}
            </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
            <input 
                name="name"
                className='inputText' 
                type='text' 
                placeholder='Token Name' 
                value={formData.name}
                onChange={handleInputChange}
                style={{ borderColor: errors.name ? 'red' : '' }}
            />
            {errors.name && <div style={{ color: 'red', fontSize: '12px' }}>{errors.name}</div>}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
            <input 
                name="symbol"
                className='inputText' 
                type='text' 
                placeholder='Token Symbol (e.g., BTC)' 
                value={formData.symbol}
                onChange={handleInputChange}
                style={{ borderColor: errors.symbol ? 'red' : '' }}
            />
            {errors.symbol && <div style={{ color: 'red', fontSize: '12px' }}>{errors.symbol}</div>}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
            <input 
                name="image"
                className='inputText' 
                type='text' 
                placeholder='Image URL' 
                value={formData.image}
                onChange={handleInputChange}
                style={{ borderColor: errors.image ? 'red' : '' }}
            />
            {errors.image && <div style={{ color: 'red', fontSize: '12px' }}>{errors.image}</div>}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
            <input 
                name="supply"
                className='inputText' 
                type='number' 
                placeholder='Initial Supply' 
                value={formData.supply}
                onChange={handleInputChange}
                style={{ borderColor: errors.supply ? 'red' : '' }}
            />
            {errors.supply && <div style={{ color: 'red', fontSize: '12px' }}>{errors.supply}</div>}
        </div>
        
        <button 
            onClick={createToken} 
            className='btn'
            disabled={isLoading || !wallet.connected}
            style={{
                opacity: isLoading || !wallet.connected ? 0.6 : 1,
                cursor: isLoading || !wallet.connected ? 'not-allowed' : 'pointer'
            }}
        >
            {isLoading ? 'Creating Token...' : 'Create Token'}
        </button>
        
        {!wallet.connected && (
            <p style={{ color: '#666', marginTop: '10px' }}>
                Please connect your wallet to create a token
            </p>
        )}
    </div>
}

