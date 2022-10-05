import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export const GLOBAL_AUTHORITY_SEED = "global-authority";

export const STAKING_PROGRAM_ID = new PublicKey("3nJ33QN3CnVuqUVJc9URnRDVbSMSSp14sb45p4PVUyE9");
export const DECIMALS = 1000000000;
export const USER_POOL_SIZE = 5648;     // 8 + 5640
export const FARM_POOL_SIZE = 104;

export interface GlobalPool {
    // 8 + 40
    superAdmin: PublicKey,              // 32
    rewardToken: PublicKey,            // 32
    totalStakedCount: anchor.BN,        // 8
    farmCount: anchor.BN,              // 8
}

export interface WhitelistProof {
    whitelistAddress: PublicKey,            // 32
    isCollection: Boolean,                  // 1
}

export interface FarmData {
    // 8 + 40
    farmNumber: anchor.BN,
    stakedCount: anchor.BN,
    maxStakeCount: anchor.BN,
    tierDuration: anchor.BN[],
    tierRate: anchor.BN[],
    isStop: Boolean,
}


export interface StakedData {
    mint: PublicKey,            // 32
    farmNumber: anchor.BN,      // 8
    stakedTime: anchor.BN,      // 8
    claimedTime: anchor.BN,     // 8
}

export interface UserPool {
    // 8 + 5640
    owner: PublicKey,               // 32
    stakedCount: anchor.BN,         // 8
    staking: StakedData[],          // 56 * 100
}