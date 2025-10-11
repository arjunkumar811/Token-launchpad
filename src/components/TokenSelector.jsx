import { useState } from 'react';

// This is a helper component to manage token history
export function TokenSelector({ allTokens, currentToken, onSelectToken, onRemoveToken }) {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [tokenToRemove, setTokenToRemove] = useState(null);

    const handleRemoveClick = (token, e) => {
        e.stopPropagation(); // Prevent triggering the parent button click
        setTokenToRemove(token);
        setShowConfirmation(true);
    };

    const confirmRemove = () => {
        if (tokenToRemove) {
            onRemoveToken(tokenToRemove);
        }
        setShowConfirmation(false);
        setTokenToRemove(null);
    };

    const cancelRemove = () => {
        setShowConfirmation(false);
        setTokenToRemove(null);
    };

    // If there are no tokens or only one token, don't show the selector
    if (allTokens.length <= 1) {
        return null;
    }

    return (
        <div style={{ 
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #2196f3',
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)'
        }}>
            <h3 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '18px',
                color: '#1565c0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px' 
            }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 3zm4 8a4 4 0 0 1-8 0V5a4 4 0 1 1 8 0v6zM8 0a5 5 0 0 0-5 5v6a5 5 0 0 0 10 0V5a5 5 0 0 0-5-5z"/>
                </svg>
                Your Tokens
            </h3>
            <p style={{ 
                margin: '0 0 15px 0', 
                fontSize: '14px',
                color: '#666'
            }}>
                Select a token from your previously created tokens:
            </p>
            <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                {allTokens.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((token) => (
                    <div key={token.mintAddress} style={{ position: 'relative' }}>
                        <button
                            onClick={() => onSelectToken(token)}
                            style={{
                                padding: '10px 15px',
                                paddingRight: '30px', // Space for the remove button
                                backgroundColor: currentToken.mintAddress === token.mintAddress ? '#2196f3' : '#e3f2fd',
                                color: currentToken.mintAddress === token.mintAddress ? '#fff' : '#1565c0',
                                border: '1px solid #bbdefb',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: currentToken.mintAddress === token.mintAddress ? '600' : '400',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {currentToken.mintAddress === token.mintAddress && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
                                </svg>
                            )}
                            {token.name} ({token.symbol})
                        </button>
                        <button
                            onClick={(e) => handleRemoveClick(token, e)}
                            style={{
                                position: 'absolute',
                                right: '5px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: currentToken.mintAddress === token.mintAddress ? '#fff' : '#f44336',
                                cursor: 'pointer',
                                padding: '0',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                height: '20px',
                                opacity: '0.7',
                            }}
                            title="Remove this token"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Confirmation Dialog */}
            {showConfirmation && tokenToRemove && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Remove Token</h3>
                        <p>Are you sure you want to remove "{tokenToRemove.name} ({tokenToRemove.symbol})" from your list?</p>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                            This will only remove it from your local list. The token will still exist on the blockchain.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={cancelRemove}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#e0e0e0',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemove}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}