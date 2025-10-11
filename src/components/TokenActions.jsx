import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createBurnInstruction, createMintToInstruction, createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const Toast = {
    show(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `token-toast ${type}`;
        toast.innerHTML = message;
        
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
            const style = document.createElement('style');
            style.textContent = `
                #toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                }
                .token-toast {
                    min-width: 300px;
                    margin-bottom: 10px;
                    padding: 15px 20px;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: toast-slide-in 0.3s ease forwards;
                    font-weight: 500;
                    font-size: 14px;
                    z-index: 10000;
                }
                .token-toast.success {
                    background-color: #4caf50;
                    color: white;
                }
                .token-toast.error {
                    background-color: #f44336;
                    color: white;
                }
                .token-toast.info {
                    background-color: #2196f3;
                    color: white;
                }
                @keyframes toast-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
};

export function TokenActions({ tokenData, onActionSuccess }) {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [activeAction, setActiveAction] = useState("transfer");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [txId, setTxId] = useState("");
    const [isProcessingTx, setIsProcessingTx] = useState(false);
    const [isMounted, setIsMounted] = useState(true);
    
    useEffect(() => {
        return () => {
            setIsMounted(false);
        };
    }, []);
    
    async function handleAction() {
        if (isProcessingTx) {
            setError("Transaction already in progress, please wait");
            return;
        }
        
        if (!wallet.connected || !tokenData || !tokenData.mintAddress) {
            setError("Wallet not connected or invalid token data");
            return;
        }

        if (activeAction !== "mint" && (!amount || parseFloat(amount) <= 0)) {
            setError("Please enter a valid amount");
            return;
        }

        if (activeAction === "transfer" && !isValidPublicKey(recipient)) {
            setError("Please enter a valid recipient address");
            return;
        }
        
        const maxTransactionTimeout = setTimeout(() => {
            if (isMounted) {
                setIsLoading(false);
                setIsProcessingTx(false);
                setError("Transaction taking too long. Please try again.");
                Toast.show("Transaction timeout. Your balance will update if the transaction still went through.", "error");
            }
        }, 4000);

        setIsLoading(true);
        setError("");
        setTxId("");
        setIsProcessingTx(true);
        
        // Show toast notification that transaction is being submitted
        Toast.show("Submitting transaction to blockchain...", 'info');

        try {
            const mintPubkey = new PublicKey(tokenData.mintAddress);
            const sourceAccount = new PublicKey(tokenData.associatedToken);
            const decimalMultiplier = Math.pow(10, tokenData.decimals || 9);
            const tokenAmount = parseFloat(amount) * decimalMultiplier;

            let transaction = new Transaction();

            switch (activeAction) {
                case "transfer":
                    try {
                        const recipientPubkey = new PublicKey(recipient);
                        
                        let recipientTokenAccount;
                        try {
                            recipientTokenAccount = await connection.getParsedTokenAccountsByOwner(
                                recipientPubkey,
                                { mint: mintPubkey }
                            );
                            if (recipientTokenAccount.value.length === 0) {
                                const ataAddress = await getOrCreateAssociatedTokenAccount(
                                    connection,
                                    wallet.publicKey,
                                    mintPubkey,
                                    recipientPubkey,
                                    true,
                                    'processed',
                                    { skipPreflight: true },
                                    TOKEN_PROGRAM_ID
                                );
                                
                                transaction.add(
                                    createTransferInstruction(
                                        sourceAccount,
                                        ataAddress.address,
                                        wallet.publicKey,
                                        BigInt(Math.floor(tokenAmount)),
                                        [],
                                        TOKEN_PROGRAM_ID
                                    )
                                );
                            } else {
                                const recipientTokenAccountAddress = recipientTokenAccount.value[0].pubkey;
                                transaction.add(
                                    createTransferInstruction(
                                        sourceAccount,
                                        recipientTokenAccountAddress,
                                        wallet.publicKey,
                                        BigInt(Math.floor(tokenAmount)),
                                        [],
                                        TOKEN_PROGRAM_ID
                                    )
                                );
                            }
                        } catch (err) {
                            console.log("Error checking recipient token account, falling back to getOrCreateAssociatedTokenAccount");
                            const ataInfo = await getOrCreateAssociatedTokenAccount(
                                connection,
                                wallet.publicKey,
                                mintPubkey,
                                recipientPubkey,
                                true,
                                'confirmed',
                                { skipPreflight: false },
                                TOKEN_PROGRAM_ID
                            );
                            
                            transaction.add(
                                createTransferInstruction(
                                    sourceAccount,
                                    ataInfo.address,
                                    wallet.publicKey,
                                    BigInt(Math.floor(tokenAmount)),
                                    [],
                                    TOKEN_PROGRAM_ID
                                )
                            );
                        }
                    } catch (err) {
                        throw new Error(`Failed to prepare transfer: ${err.message}`);
                    }
                    break;

                case "burn":
                    transaction.add(
                        createBurnInstruction(
                            sourceAccount,
                            mintPubkey,
                            wallet.publicKey,
                            BigInt(Math.floor(tokenAmount)),
                            [],
                            TOKEN_PROGRAM_ID
                        )
                    );
                    break;

                case "mint":
                    transaction.add(
                        createMintToInstruction(
                            mintPubkey,
                            sourceAccount,
                            wallet.publicKey,
                            BigInt(Math.floor(tokenAmount)),
                            [],
                            TOKEN_PROGRAM_ID
                        )
                    );
                    break;
            }

            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('processed');
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = blockhash;
            
            Toast.show(`Submitting ${activeAction} transaction...`, 'info');
            
            const signature = await wallet.sendTransaction(transaction, connection, {
                skipPreflight: true,
                preflightCommitment: 'processed',
                maxRetries: 2
            });
            
            console.log(`Transaction sent: ${signature}`);
            
            if (isMounted) {
                // Set transaction ID
                setTxId(signature);
                
                let actionText = "";
                switch(activeAction) {
                    case "transfer":
                        actionText = `Transferred ${amount} ${tokenData.symbol}`;
                        break;
                    case "burn":
                        actionText = `Burned ${amount} ${tokenData.symbol}`;
                        break;
                    case "mint":
                        actionText = `Minted ${amount} ${tokenData.symbol}`;
                        break;
                    default:
                        actionText = "Transaction sent";
                }
                
                Toast.show(`${actionText} successfully!`, 'success');
                
                if (signature) {
                    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
                    console.log(`Transaction submitted: ${explorerUrl}`);
                }
                
                setIsLoading(false);
                setIsProcessingTx(false);
                
                if (typeof onActionSuccess === 'function') {
                    onActionSuccess(activeAction, amount);
                }
                
                setTimeout(() => {
                    if (isMounted) {
                        if (navigator.vibrate) {
                            navigator.vibrate(100);
                        }
                    }
                }, 100);
                connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight
                }, 'processed').then(() => {
                    if (isMounted) {
                        Toast.show(`Transaction confirmed on blockchain! <a href="https://explorer.solana.com/tx/${signature}?cluster=devnet" target="_blank" style="color:white;text-decoration:underline;">View on Explorer</a>`, 'info');
                        setTxId(signature);
                        
                        if (typeof onActionSuccess === 'function') {
                            onActionSuccess(activeAction, amount);
                        }
                    }
                }).catch(error => {
                    console.log("Confirmation error:", error.message);
                    if (isMounted) {
                        Toast.show(`Warning: Transaction may not have been confirmed. Check explorer.`, 'error');
                    }
                });
            }
            
        } catch (error) {
            console.error(`Error during ${activeAction} operation:`, error);
            if (isMounted) {
                const errorMsg = error.message || `Failed to ${activeAction} tokens`;
                setError(errorMsg);
                Toast.show(`Error: ${errorMsg}`, 'error');
            }
        } finally {
            clearTimeout(maxTransactionTimeout);
            
            if (isMounted) {
                setIsLoading(false);
                setIsProcessingTx(false);
            }
        }
    }

    function isValidPublicKey(address) {
        try {
            new PublicKey(address);
            return true;
        } catch (error) {
            return false;
        }
    }

    if (!tokenData || !tokenData.mintAddress) {
        return null;
    }

    return (
        <div style={{ 
            marginTop: '30px',
            padding: '28px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '3px solid #2196f3',
            boxShadow: '0 6px 16px rgba(33, 150, 243, 0.25)'
        }}>
            <h3 style={{ 
                margin: '0 0 24px 0', 
                color: '#000000', 
                fontSize: '24px',
                fontWeight: '700',
                borderLeft: '4px solid #4caf50', 
                paddingLeft: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                </svg>
                Token Actions
            </h3>
            
            <div style={{ 
                display: 'flex', 
                marginBottom: '20px',
                backgroundColor: '#e3f2fd',
                padding: '8px',
                borderRadius: '10px',
                border: '2px solid #2196f3'
            }}>
                <button 
                    onClick={() => setActiveAction("transfer")} 
                    style={{
                        flex: 1,
                        padding: '16px 10px',
                        backgroundColor: activeAction === "transfer" ? '#4caf50' : '#ffffff',
                        color: activeAction === "transfer" ? 'white' : '#000000',
                        border: 'none',
                        borderRadius: '8px',
                        margin: '4px',
                        cursor: 'pointer',
                        fontWeight: activeAction === "transfer" ? '700' : '600',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                        boxShadow: activeAction === "transfer" ? '0 4px 8px rgba(76, 175, 80, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5z"/>
                        </svg>
                        Transfer
                    </div>
                </button>
                <button 
                    onClick={() => setActiveAction("burn")} 
                    style={{
                        flex: 1,
                        padding: '16px 10px',
                        backgroundColor: activeAction === "burn" ? '#e53935' : '#ffffff',
                        color: activeAction === "burn" ? 'white' : '#000000',
                        border: 'none',
                        borderRadius: '8px',
                        margin: '4px',
                        cursor: 'pointer',
                        fontWeight: activeAction === "burn" ? '700' : '600',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                        boxShadow: activeAction === "burn" ? '0 4px 8px rgba(229, 57, 53, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M7.022 11.732a.5.5 0 0 1 .98.01l.209 2.095a.5.5 0 0 1-.994.1l-.213-2.134a.5.5 0 0 1 .018-.07zm1.189-4.201h.002l1.02 7.634a.5.5 0 0 1-1 0l-1.02-7.634a.5.5 0 0 1 1.001-.01z"/>
                            <path d="M5.18 13.798a.5.5 0 0 1-.998-.067L5.344 6.13a.5.5 0 0 1 1.004.007l-1.168 7.66zM8.834 4.134c.1-.507-.08-.997-.382-1.33-.324-.314-.8-.508-1.398-.508-.684 0-1.244.239-1.651.653a.5.5 0 1 1-.72-.694c.56-.56 1.308-.891 2.237-.885.873.005 1.603.3 2.124.82.531.518.777 1.261.633 2.003a2.98 2.98 0 0 1-.93 1.834c-.487.462-1.016.816-1.599 1.079a.5.5 0 1 1-.38-.926c.504-.23.956-.53 1.32-.904.38-.372.655-.801.77-1.293z"/>
                        </svg>
                        Burn
                    </div>
                </button>
                {tokenData.mintAuthority === wallet?.publicKey?.toString() && (
                    <button 
                        onClick={() => setActiveAction("mint")} 
                        style={{
                            flex: 1,
                            padding: '16px 10px',
                            backgroundColor: activeAction === "mint" ? '#3a6ea5' : '#ffffff',
                            color: activeAction === "mint" ? 'white' : '#000000',
                            border: 'none',
                            borderRadius: '8px',
                            margin: '4px',
                            cursor: 'pointer',
                            fontWeight: activeAction === "mint" ? '700' : '600',
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            boxShadow: activeAction === "mint" ? '0 4px 8px rgba(58, 110, 165, 0.4)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                            </svg>
                            Mint
                        </div>
                    </button>
                )}
            </div>
            
            <div style={{ 
                marginTop: '20px', 
                padding: '25px',
                backgroundColor: 'white',
                borderRadius: '10px',
                border: '2px solid #2196f3',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
            }}>
                {activeAction === "transfer" && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '10px', 
                            color: '#000000',
                            fontWeight: '600',
                            fontSize: '16px'
                        }}>Recipient Address:</label>
                        <input 
                            type="text"
                            placeholder="Enter recipient wallet address"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '6px',
                                border: '2px solid #2196f3',
                                fontSize: '16px',
                                fontWeight: '500',
                                boxSizing: 'border-box',
                                backgroundColor: '#ffffff'
                            }}
                        />
                    </div>
                )}
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '8px',
                        color: '#000000',
                        fontWeight: '600',
                        fontSize: '16px'
                    }}>
                        {activeAction === "transfer" ? "Amount to Transfer:" :
                         activeAction === "burn" ? "Amount to Burn:" :
                         "Amount to Mint:"}
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="number"
                            placeholder={`Enter token amount`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.000000001"
                            min="0"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '4px',
                                border: '2px solid #2196f3',
                                fontSize: '16px',
                                fontWeight: '500',
                                boxSizing: 'border-box',
                                backgroundColor: '#ffffff'
                            }}
                        />
                        <span style={{ 
                            position: 'absolute',
                            right: '12px',
                            top: '12px',
                            color: '#000000',
                            fontSize: '16px',
                            fontWeight: '600',
                            backgroundColor: '#e3f2fd',
                            padding: '0 8px',
                            borderRadius: '4px'
                        }}>
                            {tokenData.symbol}
                        </span>
                    </div>
                </div>
                
                {error && (
                    <div style={{ 
                        color: '#d32f2f',
                        backgroundColor: '#ffebee',
                        padding: '15px 20px',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        border: '2px solid #ef5350',
                        fontSize: '16px',
                        fontWeight: '500'
                    }}>
                        <strong>Error: </strong>{error}
                    </div>
                )}
                
                {txId && !isLoading && (
                    <div style={{ 
                        color: '#2e7d32',
                        backgroundColor: '#e8f5e9',
                        padding: '18px 20px',
                        borderRadius: '8px',
                        marginBottom: '25px',
                        border: '2px solid #66bb6a',
                        wordBreak: 'break-all',
                        boxShadow: '0 4px 12px rgba(102, 187, 106, 0.15)',
                        animation: 'fadeIn 0.3s ease-in'
                    }}>
                        <div style={{ 
                            fontWeight: 'bold', 
                            marginBottom: '10px', 
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                            </svg>
                            {activeAction === "burn" ? "Tokens Burned Successfully!" : 
                             activeAction === "transfer" ? "Tokens Transferred Successfully!" :
                             "Transaction Successful!"}
                        </div>
                        <div style={{ fontSize: '16px', backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '10px', borderRadius: '6px' }}>
                            <strong>Transaction ID: </strong>{txId}
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <a 
                                href={`https://explorer.solana.com/tx/${txId}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#1976d2',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    backgroundColor: 'white',
                                    padding: '10px 15px',
                                    borderRadius: '6px',
                                    border: '1px solid #bbdefb'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                                    <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                                </svg>
                                View in Explorer
                            </a>
                        </div>
                    </div>
                )}
                
                <button
                    onClick={handleAction}
                    disabled={isLoading || !wallet.connected}
                    className="action-button"
                    style={{
                        width: '100%',
                        padding: '18px',
                        backgroundColor: activeAction === "transfer" ? '#4caf50' : 
                                        activeAction === "burn" ? '#e53935' : '#3a6ea5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: '700',
                        cursor: isLoading || !wallet.connected ? 'not-allowed' : 'pointer',
                        opacity: isLoading || !wallet.connected ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {isLoading ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ animation: 'spin 0.8s linear infinite' }}>
                                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                            </svg>
                            {txId ? "Success!" : "Sending..."}
                        </>
                    ) : (
                        activeAction === "transfer" ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5z"/>
                                </svg>
                                Transfer Tokens
                            </>
                        ) : activeAction === "burn" ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M7.022 11.732a.5.5 0 0 1 .98.01l.209 2.095a.5.5 0 0 1-.994.1l-.213-2.134a.5.5 0 0 1 .018-.07zm1.189-4.201h.002l1.02 7.634a.5.5 0 0 1-1 0l-1.02-7.634a.5.5 0 0 1 1.001-.01z"/>
                                    <path d="M5.18 13.798a.5.5 0 0 1-.998-.067L5.344 6.13a.5.5 0 0 1 1.004.007l-1.168 7.66zM8.834 4.134c.1-.507-.08-.997-.382-1.33-.324-.314-.8-.508-1.398-.508-.684 0-1.244.239-1.651.653a.5.5 0 1 1-.72-.694c.56-.56 1.308-.891 2.237-.885.873.005 1.603.3 2.124.82.531.518.777 1.261.633 2.003a2.98 2.98 0 0 1-.93 1.834c-.487.462-1.016.816-1.599 1.079a.5.5 0 1 1-.38-.926c.504-.23.956-.53 1.32-.904.38-.372.655-.801.77-1.293z"/>
                                </svg>
                                Burn Tokens
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                </svg>
                                Mint Additional Tokens
                            </>
                        )
                    )}
                </button>
                
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes fadeIn {
                        0% { opacity: 0; transform: translateY(10px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </div>
    );
}