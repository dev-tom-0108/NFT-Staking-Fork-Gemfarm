use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::*;

#[account]
#[derive(Default)]
pub struct GlobalPool {
    // 8 + 40
    pub super_admin: Pubkey,        // 32
    pub reward_token: Pubkey,       // 32
    pub total_staked_count: u64,    // 8
    pub farm_count: u64,            // 8
}

#[account]
#[derive(Default)]
pub struct WhitelistProof {
    pub whitelist_address: Pubkey,
    pub is_collection: bool,
}

#[account(zero_copy)]
pub struct FarmData {
    pub farm_number: u64,
    pub staked_count: u64,
    pub max_stake_count: u64, 
    pub tier_duration: [i64; 4],
    pub tier_rate: [u64; 4],
    pub is_stop: bool,
}

/// User PDA Layout
#[zero_copy]
#[derive(Default, PartialEq)]
#[repr(packed)]
pub struct StakedData {
    pub mint: Pubkey,               // 32
    pub farm_number: u64,           // 8
    pub staked_time: i64,           // 8
    pub claimed_time: i64,          // 8
}

#[account(zero_copy)]
pub struct UserPool {
    // 8 + 5640
    pub owner: Pubkey,                              // 32
    pub staked_count: u64,                          // 8
    pub staking: [StakedData; STAKE_MAX_COUNT],     // 56 * 100
}

impl Default for UserPool {
    #[inline]
    fn default() -> UserPool {
        UserPool {
            owner: Pubkey::default(),
            staked_count: 0,
            staking: [
                StakedData {
                    ..Default::default()
                }; STAKE_MAX_COUNT
            ],
        }
    }
}

impl UserPool {
    pub fn add_nft(
        &mut self,
        nft_pubkey: Pubkey,
        farm_number: u64,
        now: i64,
    ) {
        let idx = self.staked_count as usize;
        self.staking[idx].mint = nft_pubkey;
        self.staking[idx].farm_number = farm_number;
        self.staking[idx].staked_time = now;
        self.staking[idx].claimed_time = now;
        self.staked_count += 1;
    }
    
    pub fn remove_nft(
        &mut self,
        nft_pubkey: Pubkey,
        tier_duration: [i64; 4],
        tier_rate: [u64; 4],
        now: i64,
    ) -> Result<u64> {
        let mut withdrawn: u8 = 0;
        let mut index: usize = 0;
        let mut total_reward: u64 = 0;
        // Find NFT in pool
        for i in 0..self.staked_count {
            let idx = i as usize;
            if self.staking[idx].mint.eq(&nft_pubkey) {
                let mut duration: i64 = now - self.staking[idx].staked_time;
                let mut reward: u64 = 0;
                for j in 0..3 {
                    if duration >= tier_duration[j] {
                        reward += (tier_duration[j] as u64) * tier_rate[j];
                        duration -= tier_duration[j];

                    } else {
                        reward += (duration as u64) * tier_rate[j];
                        duration = 0;
                        break;
                    }
                }
                if duration != 0 {
                    reward += (duration as u64) * tier_rate[3];
                }

                let mut duration: i64 = self.staking[idx].claimed_time - self.staking[idx].staked_time;
                let mut virtual_reward: u64 = 0;
                for j in 0..3 {
                    if duration >= tier_duration[j] {
                        virtual_reward += (tier_duration[j] as u64) * tier_rate[j];
                        duration -= tier_duration[j];

                    } else {
                        virtual_reward += (duration as u64) * tier_rate[j];
                        duration = 0;
                        break;
                    }
                }
                if duration != 0 {
                    virtual_reward += (duration as u64) * tier_rate[3];
                }

                total_reward = reward - virtual_reward;

                index = idx;
                withdrawn = 1;
                break;
            }
        }
        require!(withdrawn == 1, StakingError::InvalidNFTAddress);
       
        // Remove NFT from pool
        let last_idx: usize = (self.staked_count - 1) as usize;
        if index != last_idx {
            self.staking[index] = self.staking[last_idx];
        }
        self.staked_count -= 1;
        Ok(total_reward)
    }

    pub fn claim_reward(
        &mut self,
        nft_pubkey: Pubkey,
        tier_duration: [i64; 4],
        tier_rate: [u64; 4],
        now: i64,
    ) -> Result<u64> {
        let mut total_reward: u64 = 0;
        // Find NFT in pool
        for i in 0..self.staked_count {
            let idx = i as usize;
            if self.staking[idx].mint.eq(&nft_pubkey) {
                let mut duration: i64 = now - self.staking[idx].staked_time;
                let mut reward: u64 = 0;
                for j in 0..3 {
                    if duration >= tier_duration[j] {
                        reward += (tier_duration[j] as u64) * tier_rate[j];
                        duration -= tier_duration[j];

                    } else {
                        reward += (duration as u64) * tier_rate[j];
                        duration = 0;
                        break;
                    }
                }
                if duration != 0 {
                    reward += (duration as u64) * tier_rate[3];
                }

                let mut duration: i64 = self.staking[idx].claimed_time - self.staking[idx].staked_time;
                let mut virtual_reward: u64 = 0;
                for j in 0..3 {
                    if duration >= tier_duration[j] {
                        virtual_reward += (tier_duration[j] as u64) * tier_rate[j];
                        duration -= tier_duration[j];

                    } else {
                        virtual_reward += (duration as u64) * tier_rate[j];
                        duration = 0;
                        break;
                    }
                }
                if duration != 0 {
                    virtual_reward += (duration as u64) * tier_rate[3];
                }

                total_reward = reward - virtual_reward;

                self.staking[idx].claimed_time = now;
                break;
            }
        }
        Ok(total_reward)
    }
}