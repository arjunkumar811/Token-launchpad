import { useConnection } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";

export function NetworkSelector({ selectedNetwork, setSelectedNetwork }) {
    const networks = [
        { id: "mainnet", name: "Mainnet", endpoint: clusterApiUrl("mainnet-beta") },
        { id: "testnet", name: "Testnet", endpoint: clusterApiUrl("testnet") },
        { id: "devnet", name: "Devnet", endpoint: clusterApiUrl("devnet") }
    ];

    function handleNetworkChange(networkId) {
        const network = networks.find(n => n.id === networkId);
        if (network) {
            setSelectedNetwork(network);
        }
    }

    return (
        <div style={{ marginBottom: '15px' }}>
            <div style={{ 
                display: 'flex',
                background: '#f0f0f0',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                {networks.map(network => (
                    <button 
                        key={network.id}
                        onClick={() => handleNetworkChange(network.id)}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: 'none',
                            background: selectedNetwork.id === network.id ? '#3a6ea5' : 'transparent',
                            color: selectedNetwork.id === network.id ? 'white' : '#333',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {network.name}
                    </button>
                ))}
            </div>
            <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                textAlign: 'center',
                marginTop: '5px' 
            }}>
                {selectedNetwork.id === 'mainnet' ? (
                    <span style={{ color: '#e53935' }}>Warning: You're using Mainnet. Real SOL will be spent.</span>
                ) : (
                    <span>Using {selectedNetwork.name} network</span>
                )}
            </div>
        </div>
    );
}