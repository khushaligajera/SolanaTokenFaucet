import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { SolanaFaucetDapp } from "../target/types/solana_faucet_dapp";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { expect } from "chai";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
 import { mintTo } from "@solana/spl-token";



describe("solana_faucet_dapp", () => {
  const provider = anchor.AnchorProvider.env();
  console.log("Wallet public key:", provider.wallet.publicKey.toBase58());
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaFaucetDapp as Program<SolanaFaucetDapp>;

  const MINT_ADDRESS = new PublicKey("9vBfoeuyYbNVfF6hEZ7Cu6aEWbBkNd6GV6aaiPoXwKcg");

  let user = anchor.web3.Keypair.generate();
  let _bump: number;
  const PROGRAM_ID = new PublicKey("Cq3wB5ZYpCqPiBWEgb1CNHgmjLS4nLgKnr2n6zebCGXr");
  let userTokenAccount: PublicKey;
  let faucetTokenAccount: PublicKey;
  let faucetUser: anchor.web3.PublicKey;
  let faucetAuthority: PublicKey;
  let faucetBump: number;

  before(async () => {
    // Creating faucet authority PDA
    [faucetAuthority, faucetBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      program.programId
    );
    console.log("faucetAuthority address", faucetAuthority);


    /*
    this code is used to just get PDA for set as Authority
      it("create new Authority as PDA",async()=>{
      const pda = PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      PROGRAM_ID
    );
    
    console.log(pda[0].toBase58())
      })*/

    //this do both if not created then creates and get also 
    //Create and get ATA(associated token account) for faucet token
    const faucetTokenAccountInfo = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,      //  keypair who pays for the creation
      MINT_ADDRESS,       //  token's mint address
      faucetAuthority,   // The PDA who will own the account
      true               // allowOwnerOffCurve = true, because faucetAuthority is a PDA
    );
    faucetTokenAccount = faucetTokenAccountInfo.address;
    console.log("created faucetTokenAccount", faucetTokenAccount);


    // Only use it when you don't hit daily request limit else will give error .
       let before = await provider.connection.getBalance(user.publicKey);
      console.log("After airdrop balance:", before / 1e9, "SOL");
        const latestBlockhash=await provider.connection.getLatestBlockhash();
        const sig=await provider.connection.requestAirdrop(user.publicKey,1e9);//Drop 1 SOL and returns signature
        await provider.connection.confirmTransaction({
          signature:sig,
          blockhash:latestBlockhash.blockhash,
          lastValidBlockHeight:latestBlockhash.lastValidBlockHeight,
        });
      console.log("Airdrop signature",sig);
      let after = await provider.connection.getBalance(user.publicKey);
      console.log("After airdrop balance:", after / 1e9, "SOL");
      

    //Create User's token account
    const ata = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      MINT_ADDRESS,
      user.publicKey
    );
    userTokenAccount = ata.address;
    console.log("User token Account", userTokenAccount)


    // Derive the faucet user PDA
  const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), MINT_ADDRESS.toBuffer()],
      program.programId
    );
    faucetUser=pda;
    console.log("faucetUser:", faucetUser.toBase58());

  });

 

it("Mints tokens to the faucet token account via program", async () => {
  const tx = await program.methods
    .mintToFaucet(new anchor.BN(500_000_000_000)) // Mint 500 tokens 
    .accounts({
      mint: MINT_ADDRESS,
      faucetAuthority: faucetAuthority,
      faucetTokenAccount: faucetTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    }as any)
    .rpc();

  console.log("✅ mintToFaucet tx:", tx);

  const faucetAccount = await getAccount(provider.connection, faucetTokenAccount);
  console.log("Faucet Token Amount:", Number(faucetAccount.amount));

  // ✅ Optional Assertion: Check if tokens were added
  expect(Number(faucetAccount.amount)).to.be.greaterThan(1_000_000_000); // Previous amount was 1_000_000_000_000
});


  it("Calls requestTokens() using derived faucet_authority PDA", async () => {
    const tx = await program.methods
      .requestToken(faucetBump)
      .accounts(
        {
          user: user.publicKey,
          faucetUser:faucetUser,
          mint: MINT_ADDRESS,
          faucetAuthority,
          faucetTokenAccount,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
        }as any )
      .signers([user])
      .rpc();
    console.log("tx: ", tx);
    const faucetUserAccount = await program.account.faucetUser.fetch(faucetUser);
    console.log("Last request:", faucetUserAccount.lastRequest.toString());

    const now = Math.floor(Date.now() / 1000);
    // expect(Math.abs(faucetUserAccount.lastRequest.toNumber() - now)).to.be.lessThan(10);

    // expect(faucetUserAccount.requestCount).to.equal(1);


    const account = await getAccount(provider.connection, userTokenAccount);
    console.log("User token amout ", Number(account.amount));
    expect(Number(account.amount)).to.be.greaterThan(0);


  })


});
