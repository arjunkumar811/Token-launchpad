import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

export function TokenHistory({ tokenData, network }) {
    const { connection } = useConnection();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [historyFetched, setHistoryFetched] = useState(false);

    // Disable automatic transaction history fetching to prevent wallet prompts
    useEffect(() => {
        // We'll let the user manually fetch transaction history instead of doing it automatically
        // This prevents repeated wallet prompts
        // if (tokenData?.mintAddress) {
        //     fetchTransactionHistory();
        // }
    }, [tokenData?.mintAddress, network]);

    async function fetchTransactionHistory() {
        if (!tokenData?.mintAddress) return;

        setIsLoading(true);
        setError("");
        
        try {
            // Mark history as fetched to show the refresh button later
            setHistoryFetched(true);
            
            const mintAddress = new PublicKey(tokenData.mintAddress);
            // Use a lower limit to reduce chance of timeouts
            const signatures = await connection.getSignaturesForAddress(mintAddress, { limit: 5 });
            
            if (!signatures.length) {
                setTransactions([]);
                setIsLoading(false);
                return;
            }

            const txsPromises = signatures.map(async sig => {
                try {
                    const tx = await connection.getTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0
                    });
                    
                    return {
                        signature: sig.signature,
                        blockTime: sig.blockTime ? new Date(sig.blockTime * 1000) : null,
                        status: tx?.meta?.err ? 'Failed' : 'Success',
                        type: determineTransactionType(tx),
                        fee: tx?.meta?.fee ? (tx.meta.fee / 1000000000).toFixed(6) : '0'
                    };
                } catch (err) {
                    console.error("Error fetching transaction:", err);
                    return null;
                }
            });

            const txsData = (await Promise.all(txsPromises)).filter(Boolean);
            setTransactions(txsData);
            
        } catch (err) {
            console.error("Error fetching transaction history:", err);
            setError("Failed to load transaction history");
        } finally {
            setIsLoading(false);
        }
    }

    function determineTransactionType(tx) {
        if (!tx) return 'Unknown';
        
        // This is a simplified way to determine tx type
        // In a real app, we would decode the transaction data and instructions
        const logMessages = tx.meta?.logMessages || [];
        const logString = logMessages.join(' ');
        
        if (logString.includes('InitializeMint')) return 'Create Token';
        if (logString.includes('MintTo')) return 'Mint';
        if (logString.includes('Burn')) return 'Burn';
        if (logString.includes('Transfer')) return 'Transfer';
        
        return 'Other';
    }

    const formatDate = (date) => {
        if (!date) return 'Unknown';
        return date.toLocaleString();
    };

    if (!tokenData || !tokenData.mintAddress) {
        return null;
    }

    return (
        <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <h3 style={{ 
                marginTop: 0, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                color: '#333', 
                borderBottom: '2px solid #3a6ea5', 
                paddingBottom: '10px'
            }}>
                <span>Transaction History</span>
                {historyFetched && (
                    <button
                        onClick={fetchTransactionHistory}
                        disabled={isLoading}
                        style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            background: 'transparent',
                            border: '1px solid #3a6ea5',
                            borderRadius: '4px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.6 : 1,
                            color: '#3a6ea5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                        </svg>
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                )}
            </h3>
            
            {!historyFetched && !isLoading ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '30px 20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #eee'
                }}>
                    <div style={{ marginBottom: '15px', color: '#555' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#888" viewBox="0 0 16 16" style={{ marginBottom: '10px' }}>
                            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        <p>Transaction history not loaded to prevent repeated wallet prompts.</p>
                    </div>
                    <button
                        onClick={() => {
                            setHistoryFetched(true);
                            fetchTransactionHistory();
                        }}
                        style={{ 
                            padding: '10px 20px', 
                            margin: '10px 0',
                            backgroundColor: '#3a6ea5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.757 1.071a.5.5 0 0 1 .172.686L3.383 6h9.234a.5.5 0 0 1 .394.813l-4 4.5a.5.5 0 0 1-.848-.53L10.71 6H1.476a.5.5 0 0 1-.394-.813l4-4.5a.5.5 0 0 1 .686-.172z"/>
                        </svg>
                        View Transaction History
                    </button>
                </div>
            ) : isLoading ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '30px 20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    color: '#555'
                }}>
                    <div style={{ display: 'inline-block', animation: 'spin 2s linear infinite', marginBottom: '15px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#3a6ea5" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                        </svg>
                    </div>
                    <div>Loading transaction history...</div>
                </div>
            ) : error ? (
                <div style={{ 
                    color: '#d32f2f',
                    backgroundColor: '#ffebee',
                    padding: '15px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    border: '1px solid #ffcdd2'
                }}>
                    <strong>Error: </strong>{error}
                </div>
            ) : transactions.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '30px 20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    color: '#555'
                }}>
                    <div style={{ marginBottom: '15px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#888" viewBox="0 0 16 16">
                            <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6v7zm1.5.5A.5.5 0 0 1 1 13V6a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-13z"/>
                        </svg>
                    </div>
                    <p>No transactions found for this token.</p>
                    <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
                        Transactions will appear here after you perform operations with your token.
                    </p>
                </div>
            ) : (
                <div style={{ 
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    padding: '5px',
                    overflowX: 'auto'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#555', fontWeight: '600' }}>Time</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#555', fontWeight: '600' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#555', fontWeight: '600' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#555', fontWeight: '600' }}>Fee (SOL)</th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', color: '#555', fontWeight: '600' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.signature} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>{formatDate(tx.blockTime)}</td>
                                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '3px 8px',
                                            backgroundColor: tx.type === 'Transfer' ? '#e8f5e9' : 
                                                          tx.type === 'Mint' ? '#e3f2fd' :
                                                          tx.type === 'Burn' ? '#ffebee' : '#f5f5f5',
                                            color: tx.type === 'Transfer' ? '#2e7d32' :
                                                 tx.type === 'Mint' ? '#1565c0' :
                                                 tx.type === 'Burn' ? '#c62828' : '#333',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                                        <span style={{
                                            color: tx.status === 'Success' ? '#2e7d32' : '#c62828',
                                            fontWeight: '500'
                                        }}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>{tx.fee}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                        <a
                                            href={`https://explorer.solana.com/tx/${tx.signature}?cluster=${network.id === 'mainnet' ? 'mainnet-beta' : network.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: 'white',
                                                backgroundColor: '#3a6ea5',
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                textDecoration: 'none',
                                                fontSize: '13px',
                                                display: 'inline-block'
                                            }}
                                        >
                                            View
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Add keyframes for spinning animation */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}