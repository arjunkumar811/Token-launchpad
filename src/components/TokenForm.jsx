import { useState } from "react";

export function TokenForm({ formData, setFormData, errors, handleSubmit, isLoading, walletConnected }) {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div style={{
            backgroundColor: '#fff',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: '1px solid #eee'
        }}>
            <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                color: '#333',
                fontWeight: '600',
                borderBottom: '2px solid #f0f4fa',
                paddingBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1976d2" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Token Information
            </h3>
            
            {errors.general && (
                <div style={{
                    color: '#d32f2f',
                    backgroundColor: '#ffebee',
                    padding: '12px 15px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    border: '1px solid #ffcdd2',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                    </svg>
                    {errors.general}
                </div>
            )}
            
            <div style={{ marginBottom: '18px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#555',
                    fontWeight: '500',
                    fontSize: '14px'
                }}>Token Name</label>
                <input 
                    name="name"
                    type='text' 
                    placeholder='e.g., Solana Gold' 
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{ 
                        width: '100%',
                        padding: '12px',
                        border: errors.name ? '1px solid #e53935' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff'
                    }}
                />
                {errors.name && <div style={{ color: '#e53935', fontSize: '13px', marginTop: '5px' }}>{errors.name}</div>}
            </div>
            
            <div style={{ marginBottom: '18px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#555',
                    fontWeight: '500',
                    fontSize: '14px'
                }}>Token Symbol</label>
                <input 
                    name="symbol"
                    type='text' 
                    placeholder='e.g., GOLD (2-6 characters)' 
                    value={formData.symbol}
                    onChange={handleInputChange}
                    style={{ 
                        width: '100%',
                        padding: '12px',
                        border: errors.symbol ? '1px solid #e53935' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        textTransform: 'uppercase',
                        backgroundColor: '#fff'
                    }}
                />
                {errors.symbol && <div style={{ color: '#e53935', fontSize: '13px', marginTop: '5px' }}>{errors.symbol}</div>}
            </div>
            
            <div style={{ marginBottom: '18px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#555',
                    fontWeight: '500',
                    fontSize: '14px'
                }}>Decimals</label>
                <input 
                    name="decimals"
                    type='number'
                    min="0"
                    max="9"
                    placeholder='Decimal places (0-9)'
                    value={formData.decimals}
                    onChange={handleInputChange}
                    style={{ 
                        width: '100%',
                        padding: '12px',
                        border: errors.decimals ? '1px solid #e53935' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff'
                    }}
                />
                {errors.decimals && <div style={{ color: '#e53935', fontSize: '13px', marginTop: '5px' }}>{errors.decimals}</div>}
                <div style={{ color: '#757575', fontSize: '13px', marginTop: '5px' }}>Number of decimal places for your token (e.g. 9 = 0.000000001)</div>
            </div>
            
            <div style={{ marginBottom: '18px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#555',
                    fontWeight: '500',
                    fontSize: '14px'
                }}>Initial Supply</label>
                <input 
                    name="supply"
                    type='number' 
                    placeholder='Amount of tokens to create initially' 
                    value={formData.supply}
                    onChange={handleInputChange}
                    style={{ 
                        width: '100%',
                        padding: '12px',
                        border: errors.supply ? '1px solid #e53935' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        backgroundColor: '#fff'
                    }}
                />
                {errors.supply && <div style={{ color: '#e53935', fontSize: '13px', marginTop: '5px' }}>{errors.supply}</div>}
            </div>
            
            <div style={{ 
                padding: '15px', 
                backgroundColor: '#f5f7fa',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h4 style={{ 
                    margin: '0 0 10px 0',
                    fontSize: '16px',
                    color: '#555',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                    </svg>
                    Optional Information
                </h4>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: '#555',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>Token Logo URL</label>
                    <input 
                        name="image"
                        type='text' 
                        placeholder='URL to your token logo image' 
                        value={formData.image}
                        onChange={handleInputChange}
                        style={{ 
                            width: '100%',
                            padding: '12px',
                            border: errors.image ? '1px solid #e53935' : '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                            backgroundColor: '#fff'
                        }}
                    />
                    {errors.image && <div style={{ color: '#e53935', fontSize: '13px', marginTop: '5px' }}>{errors.image}</div>}
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: '#555',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>Description</label>
                    <textarea 
                        name="description"
                        placeholder='Brief description of your token' 
                        value={formData.description}
                        onChange={handleInputChange}
                        style={{ 
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                            backgroundColor: '#fff',
                            minHeight: '80px',
                            resize: 'vertical'
                        }}
                    />
                </div>
                
                <div style={{ marginBottom: '0' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: '#555',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>Website URL</label>
                    <input 
                        name="website"
                        type='text' 
                        placeholder='https://yourwebsite.com' 
                        value={formData.website}
                        onChange={handleInputChange}
                        style={{ 
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                            backgroundColor: '#fff'
                        }}
                    />
                </div>
            </div>
            
            <button 
                onClick={handleSubmit} 
                disabled={isLoading || !walletConnected}
                style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: isLoading || !walletConnected ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !walletConnected ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => !isLoading && walletConnected && (e.currentTarget.style.backgroundColor = '#1565c0')}
                onMouseOut={(e) => !isLoading && walletConnected && (e.currentTarget.style.backgroundColor = '#1976d2')}
            >
                {isLoading ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style={{ animation: 'spin 2s linear infinite' }}>
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                        </svg>
                        Creating Token...
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        Create Token
                    </>
                )}
            </button>
            
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            
            {!walletConnected && (
                <p style={{ color: '#666', marginTop: '10px' }}>
                    Please connect your wallet to create a token
                </p>
            )}
        </div>
    );
}