import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { AnchorProvider, Program, web3, utils } from "@coral-xyz/anchor";
import { getFaucetAuthorityPDA, getFaucetUserPDA } from "./utils/getPDA";
import idl from "./idl/solana_faucet_dapp.json";
import {MINT_ADDRESS, NETWORK } from "./constants/config";
import {Providers} from "./Providers"

import { useMemo, useCallback } from "react";


function App() {
 const wallets=useMemo(()=>[new PhantomWalletAdapter()],[]);
 const wallet=useWallet();

 const connection=new web3.Connection(NETWORK,"confirmed");

//only recreate when wallet changes
 const provider= useMemo(()=>{
  if(!wallet.publicKey) return null;
  //connect frontend to blockchain..
  return new AnchorProvider(connection,wallet as any,AnchorProvider.defaultOptions());
  
 },[wallet]);

 const program= useMemo(()=>{
     if (!provider) return null;
    return new Program(idl as any, provider);
  }, [provider]);


 const requestToken= useCallback(async ()=>{
  if(!wallet.publicKey||!program){
    alert("connect wallet first.");
    return;
  }

  try{
    const user=wallet.publicKey;
    const mint=MINT_ADDRESS;
    const [faucetUserPDA]=await getFaucetUserPDA(mint,user);
    const [faucetAuthorityPDA,faucetAuthorityBump]=getFaucetAuthorityPDA();

    const faucetTokenATA= await utils.token.associatedAddress({
      mint,
      owner:faucetAuthorityPDA,
    });
    console.log("faucet Token account",faucetTokenATA.toBase58())

    const userTokenATA=await utils.token.associatedAddress({
      mint,
      owner:user,
    });
    console.log("user Toke Account", userTokenATA.toBase58());

  const txSig= await  program.methods
      .requestToken(faucetAuthorityBump)
      .accounts({
        user,
        faucetUser:faucetUserPDA,
        faucetAuthority:faucetAuthorityPDA,
        faucetTokenAccount:faucetTokenATA,
        userTokneAccount:userTokenATA,
        mint,
        tokenProgram:utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram:utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram:web3.SystemProgram.programId,
        rent:web3.SYSVAR_RENT_PUBKEY,
        clock:web3.SYSVAR_CLOCK_PUBKEY,

      })
      .rpc({ skipPreflight: false });
      alert("✅Token successfully requested!");
      console.log("Transaction",txSig);
  }catch(err:any){
    if(err.error?.errorCode?.code==="RequesTooSoon"){
      alert("⚠️Please wait 8 hours before next request.");

    }else{
      console.error(err);
      alert("❌Transaction failed.");
    }
  }

 }, [wallet, program]);

 return (
<Providers>
  {/* Page container with full height */}
  <div className="flex flex-col min-h-screen">
    
    {/* Full-width navbar */}
    <header className="bg-gray-900 w-full">
      <div className="max-w-6xl mx-auto h-16 px-4 grid grid-cols-3 items-center">
        <div />
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold leading-none">
            Solana Token Faucet
          </h1>
        </div>
        <div className="flex justify-end items-center">
          <div className="transform scale-90 origin-right">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </header>

    {/* Main content fills remaining space */}
    <main className="flex flex-1 items-center justify-center px-4 text-center">
      <div className="max-w-6xl w-full">
        {wallet.connected ? (
          <>
            <p className="text-lg font-medium break-all mb-4">
              Connected wallet: {wallet.publicKey?.toBase58()}
            </p>

            <button
              onClick={requestToken}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Request Token
            </button>
          </>
        ) : (
          <p className="text-gray-300">Please connect your wallet.</p>
        )}
      </div>
    </main>
  </div>
</Providers>




 );

};


export default App;
