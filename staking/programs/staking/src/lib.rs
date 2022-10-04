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

    pub fn create_farm(
        ctx: Context<CreateFarm>,
        tier_duration: Vec<i64>,
        tier_rate: Vec<u64>,
        max_stake_count: u64,
        count: u64
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        let mut farm_pool = ctx.accounts.farm_pool.load_init()?;

        // rquuire!(ctx.accounts.admin.key == ADMIN.parse::<Pubkey>().unwrap(), );
        require!(global_authority.farm_count + 1 == count, StakingError::InvalidFarmCount);
        require!(tier_duration.len() == tier_rate.len(), StakingError::InvalidInput);
        farm_pool.farm_number = count;
        farm_pool.max_stake_count = max_stake_count;
        for i in 0..4 {
            msg!("Tier Duration {:?} and Rate {:?}", tier_duration[i as usize], tier_rate[i as usize]);
            farm_pool.tier_duration[i as usize] = tier_duration[i as usize];
            farm_pool.tier_rate[i as usize] = tier_rate[i as usize];
        }

        global_authority.farm_count += 1;

        Ok(())
    }

    pub fn update_farm(
        ctx: Context<UpdateFarm>,
        new_tier_duration: Vec<i64>,
        new_tier_rate: Vec<u64>,
        max_stake_count: u64,
    ) -> Result<()> {
        let mut farm_pool = ctx.accounts.farm_pool.load_mut()?;
        let global_authority = &mut ctx.accounts.global_authority;

        require!(global_authority.super_admin.key() == ctx.accounts.admin.key(), 
            StakingError::InvalidSuperOwner);

        for i in 0..4 {
            farm_pool.tier_duration[i] = new_tier_duration[i];
            farm_pool.tier_rate[i] = new_tier_rate[i];
        }

        farm_pool.max_stake_count = max_stake_count;

        Ok(())
    }

    pub fn add_whitelist(
        ctx: Context<AddWhitelist>,
        is_collection: bool
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        if global_authority.super_admin != ctx.accounts.admin.key() {
            return Err(error!(StakingError::InvalidSuperOwner));
        }
        let whitelist_proof = &mut ctx.accounts.whitelist_proof;

        whitelist_proof.whitelist_address = ctx.accounts.whitelist_address.key();
        whitelist_proof.is_collection = is_collection;
        Ok(())
    }

    pub fn remove_whitelist(
        ctx: Context<RemoveWhitelist>,
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        if global_authority.super_admin != ctx.accounts.admin.key() {
            return Err(error!(StakingError::InvalidSuperOwner));
        }
        let whitelist_proof = &mut ctx.accounts.whitelist_proof;
        require!(!whitelist_proof.to_account_info().data_is_empty(), StakingError::InvalidWhitelistAddress);

        let admin = &mut ctx.accounts.admin;
        let starting_lamports: u64 = admin.lamports();
        **admin.lamports.borrow_mut() = starting_lamports + whitelist_proof.to_account_info().lamports();
        **whitelist_proof.to_account_info().lamports.borrow_mut() = 0;
        
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


#[derive(Accounts)]
pub struct CreateFarm<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(zero)]
    pub farm_pool: AccountLoader<'info, FarmData>,
}

#[derive(Accounts)]
pub struct UpdateFarm<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,
    
    #[account(mut)]
    pub farm_pool: AccountLoader<'info, FarmData>,
}


#[derive(Accounts)]
pub struct AddWhitelist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,
    #[account(mut)]
    pub farm_pool: AccountLoader<'info, FarmData>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub whitelist_address: AccountInfo<'info>,

    #[account(
        init,
        seeds = [whitelist_address.key().as_ref(), farm_pool.key().as_ref()],
        bump,
        space = 8 + 33,
        payer = admin
    )]
    pub whitelist_proof: Account<'info, WhitelistProof>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct RemoveWhitelist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,
    #[account(mut)]
    pub farm_pool: AccountLoader<'info, FarmData>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub whitelist_address: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [whitelist_address.key().as_ref(), farm_pool.key().as_ref()],
        bump,
    )]
    pub whitelist_proof: Account<'info, WhitelistProof>,

}
