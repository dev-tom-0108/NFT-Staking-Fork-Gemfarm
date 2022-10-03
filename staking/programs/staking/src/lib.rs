use anchor_lang::{
    prelude::*,
};
use solana_program::program::{invoke_signed};
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer, MintTo, SetAuthority },
};
use metaplex_token_metadata::state::Metadata;

pub mod account;
pub mod error;
pub mod constants;

use account::*;
use error::*;
use constants::*;

declare_id!("3nJ33QN3CnVuqUVJc9URnRDVbSMSSp14sb45p4PVUyE9");

#[program]
pub mod staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, _global_bump: u8) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        global_authority.super_admin = ctx.accounts.admin.key();
        global_authority.reward_token = ctx.accounts.reward_token.key();
        Ok(())
    }

    pub fn initialize_user_pool(
        ctx: Context<InitializeUserPool>
    ) -> Result<()> {
        let mut user_pool = ctx.accounts.user_pool.load_init()?;
        user_pool.owner = ctx.accounts.owner.key();
        Ok(())
    }
}


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
        space = 8 + 80,
        payer = admin
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(
        init, 
        payer = admin, 
        mint::decimals = 9, 
        mint::authority = global_authority, 
        mint::freeze_authority = global_authority
    )]
    pub reward_token: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct InitializeUserPool<'info> {
    #[account(zero)]
    pub user_pool: AccountLoader<'info, UserPool>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

