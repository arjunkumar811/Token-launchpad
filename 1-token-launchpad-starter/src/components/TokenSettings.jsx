import { useState } from "react";

export function TokenSettings({ settings, setSettings, walletPublicKey }) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const handleSettingChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <div 
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ 
                    cursor: 'pointer',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <span>Advanced Settings</span>
                <span>{showAdvanced ? '▲' : '▼'}</span>
            </div>
            
            {showAdvanced && (
                <div style={{ padding: '10px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Maximum Supply:
                            <input 
                                name="maxSupply"
                                className='inputText'
                                type='number'
                                placeholder='Leave empty for unlimited'
                                value={settings.maxSupply}
                                onChange={handleSettingChange}
                            />
                        </label>
                        <small style={{ color: '#666' }}>Set maximum token supply (leave empty for unlimited)</small>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                            <input 
                                name="disableMinting"
                                type='checkbox'
                                checked={settings.disableMinting}
                                onChange={handleSettingChange}
                                style={{ marginRight: '8px' }}
                            />
                            Disable future minting
                        </label>
                        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                            If checked, no more tokens can be minted after initial supply
                        </small>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Mint Authority:
                            <input 
                                name="mintAuthority"
                                className='inputText'
                                type='text'
                                placeholder={walletPublicKey?.toBase58() || 'Connect wallet first'}
                                value={settings.mintAuthority}
                                onChange={handleSettingChange}
                            />
                        </label>
                        <small style={{ color: '#666' }}>Address that can mint new tokens (default: your wallet)</small>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Freeze Authority:
                            <input 
                                name="freezeAuthority"
                                className='inputText'
                                type='text'
                                placeholder={walletPublicKey?.toBase58() || 'Connect wallet first'}
                                value={settings.freezeAuthority}
                                onChange={handleSettingChange}
                            />
                        </label>
                        <small style={{ color: '#666' }}>Address that can freeze token accounts (default: your wallet)</small>
                    </div>
                </div>
            )}
        </div>
    );
}