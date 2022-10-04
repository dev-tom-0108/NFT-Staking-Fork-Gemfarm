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

    pub fn set_stop(
        ctx: Context<SetStop>,
        is_stop: bool
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        if global_authority.super_admin != ctx.accounts.admin.key() {
            return Err(error!(StakingError::InvalidSuperOwner));
        }
        let mut farm_pool = ctx.accounts.farm_pool.load_mut()?;
        farm_pool.is_stop = is_stop;
        Ok(())
    }

    #[access_control(user(&ctx.accounts.user_pool, &ctx.accounts.owner))]
    pub fn stake_nft_to_pool(
        ctx: Context<StakeNftToPool>,
        _global_bump: u8,
    ) -> Result<()> {
        let mut farm_pool = ctx.accounts.farm_pool.load_mut()?;
        let mut user_pool = ctx.accounts.user_pool.load_mut()?;
        let mut staked_farm_count: u64 = 0;
        for i in 0..user_pool.staked_count {
            if user_pool.staking[i as usize].farm_number == farm_pool.farm_number {
                staked_farm_count +=1;
            }
        }
        require!(farm_pool.max_stake_count > staked_farm_count, StakingError::ExceedMaxCount);
        require!(farm_pool.is_stop == false, StakingError::PoolStopped);

        let mint_metadata = &mut &ctx.accounts.mint_metadata;
        let mut _collection : Pubkey = Pubkey::default();

        msg!("Metadata Account: {:?}", ctx.accounts.mint_metadata.key());
        let (metadata, _) = Pubkey::find_program_address(
            &[
                metaplex_token_metadata::state::PREFIX.as_bytes(),
                metaplex_token_metadata::id().as_ref(),
                ctx.accounts.nft_mint.key().as_ref(),
            ],
            &metaplex_token_metadata::id(),
        );
        require!(metadata == mint_metadata.key(), StakingError::InvaliedMetadata);

        // verify metadata is legit
        let nft_metadata = Metadata::from_account_info(mint_metadata)?;

        if let Some(creators) = nft_metadata.data.creators {
            _collection = creators[0].address;
            
            msg!("Collection= {:?}", _collection);
        } else {
            return Err(error!(StakingError::MetadataCreatorParseError));
        };

        let remaining_accs = &mut ctx.remaining_accounts.iter();
        let wl_mint_proof = next_account_info(remaining_accs)?;
        let wl_collection_proof = next_account_info(remaining_accs)?;

        let (wl_mint_address, _bump) = Pubkey::find_program_address(
            &[
                ctx.accounts.nft_mint.key().as_ref(),
                ctx.accounts.farm_pool.key().as_ref(),
            ],
            &staking::ID,
        );
        let (wl_collection_address, _bump) = Pubkey::find_program_address(
            &[
                _collection.key().as_ref(),
                ctx.accounts.farm_pool.key().as_ref(),
            ],
            &staking::ID,
        );
        
        require!(wl_mint_address.key() == wl_mint_proof.key(), 
            StakingError::InvalidWhitelistAddress);
        require!(wl_collection_address.key() == wl_collection_proof.key(), 
            StakingError::InvalidWhitelistAddress);

        require!(!wl_mint_proof.to_account_info().data_is_empty()
                     || !wl_collection_proof.to_account_info().data_is_empty(),  
        StakingError::InvalidWhitelistAddress);



        msg!("Stake Mint: {:?}", ctx.accounts.nft_mint.key());
        let timestamp = Clock::get()?.unix_timestamp;
        user_pool.add_nft(ctx.accounts.nft_mint.key(), farm_pool.farm_number, timestamp);
        msg!("Staked Time: {}", timestamp);
        ctx.accounts.global_authority.total_staked_count += 1;
        farm_pool.staked_count += 1;

        let token_account_info = &mut &ctx.accounts.user_nft_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;

        let cpi_accounts = Transfer {
            from: token_account_info.to_account_info().clone(),
            to: dest_token_account_info.to_account_info().clone(),
            authority: ctx.accounts.owner.to_account_info().clone()
        };
        token::transfer(
            CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
            1
        )?;
        
        Ok(())
    }

    
    #[access_control(user(&ctx.accounts.user_pool, &ctx.accounts.owner))]
    pub fn unstake_nft_from_pool(
        ctx: Context<UnstakeNftFromPool>,
        global_bump: u8,
    ) -> Result<()> {
        let mut user_pool = ctx.accounts.user_pool.load_mut()?;
        msg!("Staked Mint: {:?}", ctx.accounts.nft_mint.key());
        let mut farm_pool = ctx.accounts.farm_pool.load_mut()?;
        let global_authority = &mut ctx.accounts.global_authority;

        let timestamp = Clock::get()?.unix_timestamp;
        let reward: u64 = user_pool.remove_nft(ctx.accounts.nft_mint.key(), farm_pool.tier_duration, farm_pool.tier_rate, timestamp)?;
        msg!("Reward: {:?} Unstaked Time: {}", reward, timestamp);
        global_authority.total_staked_count -= 1;

        let token_account_info = &mut &ctx.accounts.user_nft_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: dest_token_account_info.to_account_info().clone(),
            to: token_account_info.to_account_info().clone(),
            authority: global_authority.to_account_info()
        };
        token::transfer(
            CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
            1
        )?;

        farm_pool.staked_count -= 1;

        // TODO
        // let token_program = &mut &ctx.accounts.token_program;
        // let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        // let signer = &[&seeds[..]];

        // let cpi_accounts = MintTo {
        //     mint: ctx.accounts.reward_mint.to_account_info().clone(),
        //     to: ctx.accounts.user_reward_account.to_account_info().clone(),
        //     authority: global_authority.to_account_info().clone(),
        // };
        // token::mint_to(
        //     CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
        //     reward
        // )?;

        invoke_signed(
            &spl_token::instruction::close_account(
                token_program.key,
                &dest_token_account_info.key(),
                ctx.accounts.owner.key,
                &ctx.accounts.global_authority.key(),
                &[],
            )?,
            &[
                token_program.clone().to_account_info(),
                dest_token_account_info.to_account_info().clone(),
                ctx.accounts.owner.to_account_info().clone(),
                ctx.accounts.global_authority.to_account_info().clone(),
            ],
            signer,
        )?;
        
        Ok(())
    }

    #[access_control(user(&ctx.accounts.user_pool, &ctx.accounts.owner))]
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        global_bump: u8
    ) -> Result<()> {
        let farm_pool = ctx.accounts.farm_pool.load_mut()?;
        require!(farm_pool.is_stop == false, StakingError::PoolStopped);
        
        let mut user_pool = ctx.accounts.user_pool.load_mut()?;
        msg!("Staked Mint: {:?}", ctx.accounts.nft_mint.key());

        let global_authority = &mut ctx.accounts.global_authority;

        let timestamp = Clock::get()?.unix_timestamp;
        let reward: u64 = user_pool.claim_reward(ctx.accounts.nft_mint.key(), farm_pool.tier_duration, farm_pool.tier_rate, timestamp)?;
        msg!("Reward: {:?} Unstaked Time: {}", reward, timestamp);

        // TODO
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.reward_mint.to_account_info().clone(),
            to: ctx.accounts.user_reward_account.to_account_info().clone(),
            authority: global_authority.to_account_info().clone(),
        };
        token::mint_to(
            CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
            reward
        )?;

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


#[derive(Accounts)]
pub struct SetStop<'info> {
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
#[instruction(bump: u8)]
pub struct StakeNftToPool<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub user_pool: AccountLoader<'info, UserPool>,

    #[account(mut)]
    pub farm_pool: AccountLoader<'info, FarmData>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,
    
    #[account(
        mut,
        constraint = user_nft_token_account.mint == nft_mint.key(),
        constraint = user_nft_token_account.owner == *owner.key,
        constraint = user_nft_token_account.amount == 1,
    )]
    pub user_nft_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = dest_nft_token_account.mint == nft_mint.key(),
        constraint = dest_nft_token_account.owner == global_authority.key(),
    )]
    pub dest_nft_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    /// the mint metadata
    #[account(
        mut,
        constraint = mint_metadata.owner == &metaplex_token_metadata::ID
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub mint_metadata: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(constraint = token_metadata_program.key == &metaplex_token_metadata::ID)]
    pub token_metadata_program: AccountInfo<'info>,
}


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct UnstakeNftFromPool<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub user_pool: AccountLoader<'info, UserPool>,

    #[account(mut)]
    pub farm_pool: AccountLoader<'info, FarmData>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,
    
    #[account(
        mut,
        constraint = user_nft_token_account.mint == nft_mint.key(),
        constraint = user_nft_token_account.owner == *owner.key,
    )]
    pub user_nft_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = dest_nft_token_account.mint == nft_mint.key(),
        constraint = dest_nft_token_account.owner == global_authority.key(),
        constraint = dest_nft_token_account.amount == 1,
    )]
    pub dest_nft_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_reward_account.mint == reward_mint.key(),
        constraint = user_reward_account.owner == *owner.key,
    )]
    pub user_reward_account: Box<Account<'info, TokenAccount>>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub reward_mint: AccountInfo<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
 
    #[account(mut)]
    pub user_pool: AccountLoader<'info, UserPool>,

    #[account(mut)]
    pub farm_pool: AccountLoader<'info, FarmData>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        constraint = user_reward_account.mint == *reward_mint.key,
        constraint = user_reward_account.owner == *owner.key,
    )]
    pub user_reward_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub reward_mint: AccountInfo<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}