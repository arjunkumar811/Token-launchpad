import { Keypair, SystemProgram, Transaction, clusterApiUrl, PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { 
  createInitializeMint2Instruction, 
  getMinimumBalanceForRentExemptMint, 
  TOKEN_PROGRAM_ID, 
  createAssociatedTokenAccountInstruction, 
  getAssociatedTokenAddress, 
  createMintToInstruction 
} from "@solana/spl-token";
import { useState } from "react";

import { TokenForm } from "./TokenForm";
import { TokenSettings } from "./TokenSettings";
import { TokenDisplay } from "./TokenDisplay";
import { TokenActions } from "./TokenActions";
import { NetworkSelector } from "./NetworkSelector";
import { TokenHistory } from "./TokenHistory";

export function TokenLaunchpad() {
    const wallet = useWallet();
    const { connection } = useConnection();
    
    const [selectedNetwork, setSelectedNetwork] = useState({
        id: "devnet",
        name: "Devnet",
        endpoint: clusterApiUrl("devnet")
    });
    
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        image: '',
        description: '',
        supply: '',
        decimals: '9',
        website: ''
    });
    
    const [tokenSettings, setTokenSettings] = useState({
        maxSupply: '',
        disableMinting: false,
        mintAuthority: '',
        freezeAuthority: ''
    });
    
    const [createdToken, setCreatedToken] = useState(null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState('create');
    const [createProgress, setCreateProgress] = useState(0);

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
        
        if (!formData.decimals.trim() || 
            isNaN(parseInt(formData.decimals)) || 
            parseInt(formData.decimals) < 0 || 
            parseInt(formData.decimals) > 9) {
            newErrors.decimals = 'Decimals must be a number between 0 and 9';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Function for handling successful token actions
    const handleActionSuccess = () => {};
    
    const resetForm = () => {
        setFormData({
            name: '',
            symbol: '',
            image: '',
            description: '',
            supply: '',
            decimals: '9',
            website: ''
        });
        setTokenSettings({
            maxSupply: '',
            disableMinting: false,
            mintAuthority: '',
            freezeAuthority: ''
        });
        setErrors({});
    };

    const [createStep, setCreateStep] = useState(0);
    
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
        setCreateStep(1);

        try {
            const mintKeypair = Keypair.generate();
            
            const lamports = await getMinimumBalanceForRentExemptMint(connection);
            
            const decimals = parseInt(formData.decimals) || 9;
            
            setCreateProgress(25);
            
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: 82,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMint2Instruction(
                    mintKeypair.publicKey,
                    decimals,
                    wallet.publicKey,
                    null,
                    TOKEN_PROGRAM_ID
                )
            );
            
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = blockhash;
            
            transaction.partialSign(mintKeypair);
            
            const signature = await wallet.sendTransaction(transaction, connection, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });
            
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');
            
            if (confirmation.value.err) {
                throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
            }
            
            console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);
            
            setCreateProgress(35);
            console.log("Proceeding without on-chain metadata - we'll set the token name for display in our UI");
            
            const metadataAddress = mintKeypair.publicKey.toString();
            
            setCreateStep(2);
            setCreateProgress(50);
            
            const associatedTokenAddress = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_PROGRAM_ID
            );
            
            const transaction2 = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedTokenAddress,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_PROGRAM_ID
                )
            );
            const { blockhash: blockhash2, lastValidBlockHeight: lastValidBlockHeight2 } = 
                await connection.getLatestBlockhash('confirmed');
            transaction2.feePayer = wallet.publicKey;
            transaction2.recentBlockhash = blockhash2;
            
            const signature2 = await wallet.sendTransaction(transaction2, connection, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });
            const confirmation2 = await connection.confirmTransaction({
                signature: signature2,
                blockhash: blockhash2,
                lastValidBlockHeight: lastValidBlockHeight2
            }, 'confirmed');
            
            if (confirmation2.value.err) {
                throw new Error('Transaction failed: ' + JSON.stringify(confirmation2.value.err));
            }
            
            console.log(`Associated token account created: ${associatedTokenAddress.toString()}`);
            
            setCreateStep(3);
            setCreateProgress(75);
            
            const decimalMultiplier = Math.pow(10, decimals);
            let supplyAmount;
            try {
                supplyAmount = BigInt(Math.floor(parseFloat(formData.supply) * decimalMultiplier));
            } catch (e) {
                supplyAmount = BigInt(1000000000);
            }
            
            const transaction3 = new Transaction().add(
                createMintToInstruction(
                    mintKeypair.publicKey,
                    associatedTokenAddress,
                    wallet.publicKey,
                    supplyAmount,
                    [],
                    TOKEN_PROGRAM_ID
                )
            );
            const { blockhash: blockhash3, lastValidBlockHeight: lastValidBlockHeight3 } = 
                await connection.getLatestBlockhash('confirmed');
            transaction3.feePayer = wallet.publicKey;
            transaction3.recentBlockhash = blockhash3;
            
            const signature3 = await wallet.sendTransaction(transaction3, connection, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });
            const confirmation3 = await connection.confirmTransaction({
                signature: signature3,
                blockhash: blockhash3,
                lastValidBlockHeight: lastValidBlockHeight3
            }, 'confirmed');
            
            if (confirmation3.value.err) {
                throw new Error('Transaction failed: ' + JSON.stringify(confirmation3.value.err));
            }
            
            console.log("Tokens minted successfully!");
            

            const tokenData = {
                mintAddress: mintKeypair.publicKey.toBase58(),
                associatedToken: associatedTokenAddress.toString(),
                name: formData.name,
                symbol: formData.symbol.toUpperCase(),
                decimals: decimals,
                supply: formData.supply,
                description: formData.description,
                image: formData.image,
                website: formData.website,
                timestamp: new Date().toISOString(),
                displayName: formData.name,
                displaySymbol: formData.symbol.toUpperCase()
            };
            
            setCreatedToken(tokenData);
            setCurrentStep('manage');
            setCreateStep(0);
            setCreateProgress(100);
            alert(`Congratulations! Token "${formData.name}" created successfully!\n\nToken Details:\n- Name: ${formData.name}\n- Symbol: ${formData.symbol.toUpperCase()}\n- Decimals: ${decimals}\n- Supply: ${formData.supply}\n- Mint Address: ${mintKeypair.publicKey.toString()}\n\nNote: Your token may display as "Unknown Token" in some wallets. This is normal for tokens without on-chain metadata. You can now manage your token in the "Manage Your Token" section.`);
            
            try {
                const savedTokens = JSON.parse(localStorage.getItem('createdTokens') || '[]');
                savedTokens.push(tokenData);
                localStorage.setItem('createdTokens', JSON.stringify(savedTokens));
            } catch (e) {
                console.error('Error saving to localStorage:', e);
            }
            
            resetForm();
            
        } catch (error) {
            console.error('Error creating token:', error);
            
            let errorMessage = 'Failed to create token. ';
            
            switch(createStep) {
                case 1:
                    errorMessage += 'Error during mint creation (Step 1/3). ';
                    break;
                case 2:
                    errorMessage += 'Error during token account creation (Step 2/3). ';
                    break;
                case 3:
                    errorMessage += 'Error during initial token supply minting (Step 3/3). ';
                    break;
            }
            
            errorMessage += error.message || 'Please try again.';
            
            setErrors({ general: errorMessage });
            

            alert(`Error: ${errorMessage}\n\nPlease try again. If the error persists, try refreshing the page or using a different network.`);
        } finally {
            setIsLoading(false);
            setCreateStep(0);
        }
    }



    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexDirection: 'column',
            maxWidth: '900px',
            margin: '0 auto',
            padding: '24px'
        }}>
            <div style={{
                width: '100%',
                marginBottom: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '10px'
                }}>
                    <div style={{
                        backgroundColor: '#5865f2',
                        color: 'white',
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"/>
                            <path d="M8.5 2.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm0 11a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm-5-5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm10 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm-5.5-4.5a.5.5 0 1 0 1 1 .5.5 0 0 0-1-1zm1 9a.5.5 0 1 0-1 1 .5.5 0 0 0 1-1zm-4-4.5a.5.5 0 1 0 1 1 .5.5 0 0 0-1-1zm8 0a.5.5 0 1 0 1 1 .5.5 0 0 0-1-1z"/>
                        </svg>
                    </div>
                    <h1 style={{ 
                        fontSize: '32px', 
                        margin: '0',
                        color: '#333',
                        fontWeight: '700'
                    }}>
                        Solana Token Launchpad
                    </h1>
                </div>
                <p style={{ 
                    color: '#666', 
                    maxWidth: '600px',
                    textAlign: 'center',
                    margin: '0 0 20px 0',
                    fontSize: '16px',
                    lineHeight: '1.5'
                }}>
                    Create, mint, and manage your own SPL tokens on the Solana blockchain with this easy-to-use launchpad.
                </p>
            </div>
            
            <NetworkSelector 
                selectedNetwork={selectedNetwork}
                setSelectedNetwork={setSelectedNetwork}
            />
            
            {currentStep === 'create' ? (
                <>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ margin: 0 }}>Create New Token</h2>
                        
                        {createdToken && (
                            <button
                                onClick={() => setCurrentStep('manage')}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#f0f0f0',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Manage Your Token
                            </button>
                        )}
                    </div>
                    
                    <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%'
                    }}>
                        <TokenForm 
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            handleSubmit={createToken}
                            isLoading={isLoading}
                            walletConnected={wallet.connected}
                        />
                        
                        {/* Token Creation Progress Indicator */}
                        {isLoading && (
                            <div style={{ 
                                marginTop: '25px',
                                marginBottom: '25px',
                                padding: '20px',
                                backgroundColor: '#f5f9ff',
                                borderRadius: '8px',
                                border: '1px solid #d0e1ff',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                            }}>
                                <h4 style={{ 
                                    margin: '0 0 15px 0', 
                                    color: '#1565c0', 
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                                    </svg>
                                    Creating Your Token
                                </h4>
                                
                                <div style={{ marginBottom: '20px', position: 'relative' }}>
                                    <div style={{ 
                                        width: '100%',
                                        height: '12px',
                                        backgroundColor: '#e3f2fd',
                                        borderRadius: '6px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ 
                                            width: `${createProgress}%`,
                                            height: '100%',
                                            backgroundColor: '#2196f3',
                                            borderRadius: '6px',
                                            transition: 'width 0.4s ease'
                                        }}></div>
                                    </div>
                                    <div style={{ 
                                        position: 'absolute',
                                        right: '0',
                                        top: '20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#1976d2'
                                    }}>
                                        {createProgress}%
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '25px' }}>
                                    <div style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '15px',
                                        opacity: createStep >= 1 ? 1 : 0.4
                                    }}>
                                        <div style={{ 
                                            width: '30px',
                                            height: '30px',
                                            borderRadius: '50%',
                                            backgroundColor: createStep >= 1 ? '#2196f3' : '#e0e0e0',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '600',
                                            marginRight: '15px'
                                        }}>
                                            {createStep > 1 ? '✓' : '1'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: createStep >= 1 ? '#424242' : '#9e9e9e' }}>Creating Token Mint</div>
                                            {createStep === 1 && <div style={{ fontSize: '13px', color: '#757575', marginTop: '3px' }}>Please confirm the transaction in your wallet...</div>}
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '15px',
                                        opacity: createStep >= 2 ? 1 : 0.4
                                    }}>
                                        <div style={{ 
                                            width: '30px',
                                            height: '30px',
                                            borderRadius: '50%',
                                            backgroundColor: createStep >= 2 ? '#2196f3' : '#e0e0e0',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '600',
                                            marginRight: '15px'
                                        }}>
                                            {createStep > 2 ? '✓' : '2'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: createStep >= 2 ? '#424242' : '#9e9e9e' }}>Creating Token Account</div>
                                            {createStep === 2 && <div style={{ fontSize: '13px', color: '#757575', marginTop: '3px' }}>Please confirm the transaction in your wallet...</div>}
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: createStep >= 3 ? 1 : 0.4
                                    }}>
                                        <div style={{ 
                                            width: '30px',
                                            height: '30px',
                                            borderRadius: '50%',
                                            backgroundColor: createStep >= 3 ? '#2196f3' : '#e0e0e0',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '600',
                                            marginRight: '15px'
                                        }}>
                                            {createStep > 3 ? '✓' : '3'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: createStep >= 3 ? '#424242' : '#9e9e9e' }}>Minting Initial Supply</div>
                                            {createStep === 3 && <div style={{ fontSize: '13px', color: '#757575', marginTop: '3px' }}>Please confirm the final transaction...</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <TokenSettings 
                            settings={tokenSettings}
                            setSettings={setTokenSettings}
                            walletPublicKey={wallet.publicKey}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        marginBottom: '25px',
                        borderBottom: '2px solid #f0f4fa',
                        paddingBottom: '15px'
                    }}>
                        <h2 style={{ 
                            margin: 0, 
                            fontSize: '24px',
                            color: '#1565c0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                                <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1z"/>
                            </svg>
                            Token Manager
                        </h2>
                        
                        <button
                            onClick={() => setCurrentStep('create')}
                            style={{
                                padding: '10px 18px',
                                backgroundColor: '#e3f2fd',
                                border: '1px solid #bbdefb',
                                color: '#1565c0',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#bbdefb'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                            </svg>
                            Create New Token
                        </button>
                    </div>
                    
                    {createdToken ? (
                        <div style={{ width: '100%' }}>
                            <TokenDisplay tokenData={createdToken} />
                            
                            <TokenActions 
                                tokenData={createdToken} 
                                onActionSuccess={handleActionSuccess}
                            />
                            
                            <TokenHistory 
                                tokenData={createdToken}
                                network={selectedNetwork}
                            />
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            width: '100%',
                            border: '1px solid #e0e0e0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#9e9e9e" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                                </svg>
                            </div>
                            <h3 style={{ color: '#424242', marginBottom: '15px', fontWeight: '500' }}>No Tokens Found</h3>
                            <p style={{ color: '#757575', marginBottom: '25px', maxWidth: '500px', margin: '0 auto 25px auto' }}>
                                You haven't created any tokens yet. Click the "Create New Token" button above to get started.
                            </p>
                            <button
                                onClick={() => setCurrentStep('create')}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#1976d2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '16px'
                                }}
                            >
                                Create Your First Token
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

