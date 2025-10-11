import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export function TokenDisplay({ tokenData }) {
    const { connection } = useConnection();
    const [balance, setBalance] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    

    useEffect(() => {
        if (tokenData?.mintAddress && tokenData?.associatedToken) {
            fetchBalance();

            const intervalId = setInterval(() => {
                if (tokenData?.mintAddress && tokenData?.associatedToken) {
                    fetchBalance();
                }
            }, 3000);
            
            return () => clearInterval(intervalId);
        }
    }, [tokenData?.mintAddress, tokenData?.associatedToken, tokenData]);
    
    async function fetchBalance() {
        if (!tokenData || !tokenData.mintAddress || !tokenData.associatedToken) {
            setBalance(null);
            return;
        }
        
        if (tokenData._forceUpdate && balance !== null) {
            setIsLoading(true);
            
            if (tokenData._lastAction) {
                const { type, amount } = tokenData._lastAction;
                const numAmount = parseFloat(amount) || 0;
                
                if (type === 'burn' || type === 'transfer') {
                    setBalance(prevBalance => Math.max(0, (prevBalance || 0) - numAmount));
                } else if (type === 'mint') {
                    setBalance(prevBalance => (prevBalance || 0) + numAmount);
                }
            }
            
            setTimeout(() => setIsLoading(false), 100);
        }
        
        try {
            const tokenAccountPubkey = new PublicKey(tokenData.associatedToken);
            
            const balancePromise = connection.getTokenAccountBalance(tokenAccountPubkey, "processed");
            
            const timeoutPromise = new Promise(resolve => {
                setTimeout(() => {
                    if (balance !== null) {
                        setIsLoading(false);
                    }
                    resolve(null);
                }, 500);
            });
            
            const result = await Promise.race([balancePromise, timeoutPromise]);
            
            if (result && result.value) {
                const balanceValue = result.value.uiAmount;
                setBalance(balanceValue);
            } else if (!result && balance === null) {
                // Only set default if we don't have a balance yet
                setBalance(tokenData.supply || 0);
            }
        } catch (error) {
            console.error("Error fetching token balance:", error);
            setBalance(balance !== null ? balance : (tokenData.supply || 0));
        } finally {
            setIsLoading(false);
        }
    }

    if (!tokenData || !tokenData.mintAddress) {
        return null;
    }

    return (
        <div style={{
            marginTop: '30px',
            padding: '25px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '3px solid #2196f3',
            boxShadow: '0 6px 16px rgba(33, 150, 243, 0.25)'
        }}>
            <h3 style={{ 
                marginTop: 0, 
                color: '#000000', 
                borderBottom: '3px solid #2196f3', 
                paddingBottom: '12px',
                fontSize: '24px',
                fontWeight: '700'
            }}>
                Token Details
            </h3>
            
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '25px',
                padding: '20px',
                backgroundColor: '#f8fcff',
                borderRadius: '10px',
                border: '2px solid #2196f3',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
            }}>
                {/* Token logo/placeholder */}
                <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '20px',
                    overflow: 'hidden',
                    border: '3px solid #2196f3',
                    boxShadow: '0 4px 8px rgba(33, 150, 243, 0.2)'
                }}>
                    {tokenData.image ? (
                        <img 
                            src={tokenData.image} 
                            alt={`${tokenData.name || 'Token'} logo`} 
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%3E%3Ctext%20x%3D%2232%22%20y%3D%2232%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20font-size%3D%2224%22%20fill%3D%22%234caf50%22%3E%24%3C%2Ftext%3E%3C%2Fsvg%3E';
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: '24px', color: '#4caf50' }}>$</span>
                    )}
                </div>
                
                {/* Token primary info */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        {tokenData.name || 'Unnamed Token'}
                    </h2>
                    <div style={{ 
                        backgroundColor: '#4caf50', 
                        color: 'white', 
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}>
                        {tokenData.symbol || '???'}
                    </div>
                </div>
            </div>
            
            {/* Token details */}
            <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #eee'
            }}>
                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    Token Information
                </h4>
                
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '10px 20px',
                    fontSize: '15px'
                }}>
                    <div style={{ fontWeight: 'bold', color: '#555' }}>Token Name:</div>
                    <div>{tokenData.name || 'N/A'}</div>
                    
                    <div style={{ fontWeight: 'bold', color: '#555' }}>Symbol:</div>
                    <div>{tokenData.symbol || 'N/A'}</div>
                    
                    <div style={{ fontWeight: 'bold', color: '#555' }}>Decimals:</div>
                    <div>{tokenData.decimals !== undefined ? tokenData.decimals : 'N/A'}</div>
                    
                    <div style={{ fontWeight: 'bold', color: '#555' }}>Initial Supply:</div>
                    <div>{tokenData.supply || '0'}</div>
                    
                    <div style={{ fontWeight: 'bold', color: '#555' }}>Current Balance:</div>
                    <div>
                        {isLoading ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <div className="balance-spinner"></div>
                                <span style={{ color: '#2196f3', fontWeight: '500' }}>Updating...</span>
                            </div>
                        ) : balance !== null ? (
                            <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{balance}</span>
                        ) : (
                            <span style={{ color: '#888' }}>No balance data</span>
                        )}
                    </div>
                    
                    {tokenData.description && (
                        <>
                            <div style={{ fontWeight: 'bold', color: '#555' }}>Description:</div>
                            <div>{tokenData.description}</div>
                        </>
                    )}
                    
                    {tokenData.website && (
                        <>
                            <div style={{ fontWeight: 'bold', color: '#555' }}>Website:</div>
                            <div>
                                <a 
                                    href={tokenData.website.startsWith('http') ? tokenData.website : `https://${tokenData.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#3a6ea5', textDecoration: 'none' }}
                                >
                                    {tokenData.website}
                                </a>
                            </div>
                        </>
                    )}
                    
                    {tokenData.timestamp && (
                        <>
                            <div style={{ fontWeight: 'bold', color: '#555' }}>Created:</div>
                            <div>{new Date(tokenData.timestamp).toLocaleString()}</div>
                        </>
                    )}
                </div>
            </div>
            
            {/* Token Addresses */}
            <div style={{ 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #eee'
            }}>
                <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    Token Addresses
                </h4>
                
                <div style={{ fontSize: '14px', wordBreak: 'break-all' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <strong style={{ color: '#555' }}>Mint Address:</strong>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(tokenData.mintAddress);
                                    alert("Mint address copied to clipboard!");
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#3a6ea5',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                }}
                            >
                                Copy
                            </button>
                        </div>
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '10px', 
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            color: '#333'
                        }}>
                            {tokenData.mintAddress}
                        </div>
                    </div>
                    
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <strong style={{ color: '#555' }}>Token Account:</strong>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(tokenData.associatedToken);
                                    alert("Token account address copied to clipboard!");
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#3a6ea5',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                }}
                            >
                                Copy
                            </button>
                        </div>
                        <div style={{ 
                            backgroundColor: '#f5f5f5', 
                            padding: '10px', 
                            borderRadius: '4px',
                            border: '1px solid #e0e0e0',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            color: '#333'
                        }}>
                            {tokenData.associatedToken}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Actions */}
            <div style={{ 
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                marginTop: '20px'
            }}>
                <button 
                    onClick={fetchBalance}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1,
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                    disabled={isLoading}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                        <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                    </svg>
                    {isLoading ? 'Refreshing...' : 'Refresh Balance'}
                </button>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <a 
                        href={`https://explorer.solana.com/address/${tokenData.mintAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 20px',
                            backgroundColor: '#3a6ea5',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontWeight: '500'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                            <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                        </svg>
                        View in Explorer
                    </a>
                </div>
            </div>
        </div>
    );
}