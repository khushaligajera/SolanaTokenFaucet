use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self,Token, Transfer, Mint, MintTo, TokenAccount,transfer,mint_to};
use anchor_lang::solana_program::clock::Clock;




declare_id!("Cq3wB5ZYpCqPiBWEgb1CNHgmjLS4nLgKnr2n6zebCGXr");

#[program]
pub mod solana_faucet_dapp {
    use super::*;

    pub fn request_token(ctx: Context<RequestToken>,faucet_authority_bump: u8) -> Result<()> {
        let faucet_user=&mut ctx.accounts.faucet_user;
        let clock=ctx.accounts.clock.unix_timestamp;
        let one_day_seconds=8*60*60;

        let amount=2000_000_000;//5 tokens per request
        
        if clock-faucet_user.last_request<one_day_seconds{
            return err!(FaucetErr::RequestTooSoon);
        }
        //in CPI provide faucet_seed and signer to simulate PDA signing for transfer token
        let signer_seeds:&[&[u8]]=&[b"authority",&[faucet_authority_bump],];
        let signer = &[&signer_seeds[..]]; // final type: &[&[&[u8]]]

        let cpi_accounts=Transfer{
            from:ctx.accounts.faucet_token_account.to_account_info(),
            to:ctx.accounts.user_token_account.to_account_info(),
            authority:ctx.accounts.faucet_authority.to_account_info(),
           
        }; 

        let cpi_program=ctx.accounts.token_program.to_account_info();
        // let cpi_ctx=CpiContext::new(cpi_program,cpi_accounts);
         //actual token transfer
        let cpi_ctx= CpiContext::new_with_signer(
            cpi_program, cpi_accounts, signer,
           
        );
        transfer(cpi_ctx,amount)?;
    // let expected_pda = Pubkey::create_program_address(&[b"authority", &[faucet_authority_bump]], ctx.program_id)
    // .map_err(|_| error!(FaucetErr::InvalidAuthority))?;
    //     require_keys_eq!(expected_pda, ctx.accounts.faucet_authority.key(), FaucetErr::InvalidAuthority);

        faucet_user.last_request=clock;
        faucet_user.request_count+=1;

        Ok(())


}


pub fn mint_to_faucet(ctx: Context<MintToFaucet>, amount: u64) -> Result<()> {
    let faucet_bump = ctx.bumps.faucet_authority;
    let signer_seeds: &[&[u8]] = &[b"authority", &[faucet_bump]];
    let signer = &[&signer_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.faucet_token_account.to_account_info(),
            authority: ctx.accounts.faucet_authority.to_account_info(),
        },
        signer,
    );

    mint_to(cpi_ctx, amount)?;
    Ok(())
}


}

#[derive(Accounts)]
pub struct RequestToken<'info>{
    #[account(mut)]
    pub user:Signer<'info>,

    #[account(
        init_if_needed,
        payer=user,
        seeds=[b"user",mint.key().as_ref(),user.key().as_ref()],
        bump,
        space=8+8+1,
 
    )]
    pub faucet_user:Account<'info,FaucetUser>,

    /// CHECK: PDA authority, validated by seeds and bump
    #[account(
        seeds=[b"authority"],
        bump
    )]
    pub faucet_authority:UncheckedAccount<'info>,
/*Use associated_token::mint and associated_token::authority when:

You are dealing with standard ATAs.

You want simplicity and safety.

You want to auto-create ATAs if they don’t exist. */
    #[account(  
        init_if_needed,
        payer=user,
        associated_token::mint=mint,
        associated_token::authority=faucet_authority,
    )]
    pub faucet_token_account:Account<'info,TokenAccount>,

    #[account(
        init_if_needed,
        payer=user,
        associated_token::mint=mint,
        associated_token::authority=user,
    )]
    pub user_token_account:Account<'info,TokenAccount>,

    pub mint:Account<'info,Mint>,
    pub token_program:Program<'info,Token>,
    pub system_program:Program<'info,System>,
    pub associated_token_program:Program<'info,AssociatedToken>,
    pub rent:Sysvar<'info,Rent>,
    pub clock:Sysvar<'info,Clock>,
    // REQUIRED to access PDA bumps in v0.31.1
    // pub bumps: Bumps,
}

#[derive(Accounts)]
pub struct MintToFaucet<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub faucet_token_account: Account<'info, TokenAccount>, // ATA owned by PDA

    /// CHECK: This is the PDA mint authority
    #[account(
        seeds = [b"authority"],  // or use any seed you used for PDA
        bump
    )]
    pub faucet_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}


#[account]
pub struct FaucetUser{
    pub last_request:i64,
    pub request_count:i8,
}

#[error_code]
pub enum FaucetErr {
    #[msg("You must wait for 8 hours between requests")]
    RequestTooSoon,
    #[msg("Invalid faucet authority PDA")]
    InvalidAuthority,
}

