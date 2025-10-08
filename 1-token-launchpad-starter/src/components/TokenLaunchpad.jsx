import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { MINT_SIZE, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export function TokenLaunchpad() {
    const wallet = useWallet();
        const connection = useConnection();

     // const name = document.getElementById('name').value;
        // const symbol = document.getElementById('symbol').value;
        // const image = document.getElementById('image').value;
        // const supply = document.getElementById('supply').value;  

   async function createToken() {
        const mintKeypair = Keypair.generate();
        const lamports = await getMinimumBalanceForRentExemptMint(connection);
        

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_2022_PROGRAM_ID

            })
        )        
       
    }



    return  <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
    }}>
                <h1>Solana Token Launchpad</h1>
        <input id="name" className='inputText' type='text' placeholder='Name'></input> <br />
        <input id="symbol" className='inputText' type='text' placeholder='Symbol'></input> <br />
        <input id="image" className='inputText' type='text' placeholder='Image URL'></input> <br />
        <input id="supply" className='inputText' type='text' placeholder='Initial Supply'></input> <br />
        <button onClick={createToken} className='btn'>Create a token</button>
    </div>
}