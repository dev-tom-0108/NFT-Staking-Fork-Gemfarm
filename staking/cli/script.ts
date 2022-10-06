import {
    Edition,
    MetadataProgram,
} from "@metaplex-foundation/mpl-token-metadata";
import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';

import { IDL as StakingIDL } from "./staking";
import {
    Keypair,
    PublicKey,
    Connection,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from '@solana/web3.js';
import {
    STAKING_PROGRAM_ID,
    GLOBAL_AUTHORITY_SEED,
    GlobalPool,
    USER_POOL_SIZE,
    UserPool,
    DECIMALS,
    FarmData,
    FARM_POOL_SIZE,
} from './types';
import {
    getAssociatedTokenAccount,
    getATokenAccountsNeedCreate,
    getNFTTokenAccount,
    getOwnerOfNFT,
    getMetadata,
    METAPLEX,
    isExistAccount,
    getMxMetadata,
} from './utils';
import { programs } from "@metaplex/js";

let program: Program = null;

// Address of the deployed program.
let programId = new anchor.web3.PublicKey(STAKING_PROGRAM_ID);

anchor.setProvider(anchor.AnchorProvider.local(web3.clusterApiUrl("devnet")));
const solConnection = anchor.getProvider().connection;
const payer = anchor.AnchorProvider.local().wallet;

// Generate the program client from IDL.
program = new anchor.Program(StakingIDL as anchor.Idl, programId);
console.log('ProgramId: ', program.programId.toBase58());

const main = async () => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());


};


/**
 * Initialize the project
 * @param userAddress The userAddress to initProject
 */
 export const initProject = async (
    userAddress: PublicKey
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID,
    );

    let key = Keypair.generate();
    let tx = new Transaction();
    console.log('==>Initializing Program');

    tx.add(program.instruction.initialize(
        bump, {
        accounts: {
            admin: userAddress,
            globalAuthority,
            rewardToken: key.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [key],
    }));
    const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer, key]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("txHash =", txId);
}


/**
 * Initialize the user's Pool
 * @param userAddress The user's address
 */
export const initUserPool = async (
    userAddress: PublicKey
) => {
    let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        STAKING_PROGRAM_ID,
    );
    console.log(USER_POOL_SIZE);
    let ix = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "user-pool",
        newAccountPubkey: userPoolKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(USER_POOL_SIZE),
        space: USER_POOL_SIZE,
        programId: STAKING_PROGRAM_ID,
    });

    let tx = new Transaction();
    console.log('==>initializing user PDA', userPoolKey.toBase58());
    tx.add(ix);
    tx.add(program.instruction.initializeUserPool(
        {
            accounts: {
                userPool: userPoolKey,
                owner: userAddress
            },
            instructions: [],
            signers: []
        }
    ));

    const { blockhash } = await solConnection.getRecentBlockhash('finalized');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "finalized");
    console.log("Your transaction signature", txId);
}


/**
 * Create the Farm function
 * @param userAddress The userAddress who create farm - admin address
 * @param duration The tier_duration[4]
 * @param rate The tier_rate[4]
 * @param maxCount The max stake count for the Farm Pool
 */
 export const createFarm = async (
    userAddress: PublicKey,
    duration: number[],
    rate: number[],
    maxCount: number
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID,
    );
    
    let info = await getGlobalState(program);
    let count = info.farmCount.toNumber() + 1;
    console.log("Farm count is : ", count);

    let tduration: anchor.BN[] = [];
    let trate: anchor.BN[]= [];
    for(let i = 0; i < 4; i++) { 
        tduration[i] = new anchor.BN(duration[i]);
        trate[i] = new anchor.BN(rate[i] * DECIMALS);
    }

    let farmKey = await anchor.web3.PublicKey.createWithSeed(
        userAddress,
        count.toString(),
        STAKING_PROGRAM_ID,
    );
    console.log(FARM_POOL_SIZE);
    let ix = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: count.toString(),
        newAccountPubkey: farmKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(FARM_POOL_SIZE),
        space: FARM_POOL_SIZE,
        programId: STAKING_PROGRAM_ID,
    });

    let tx = new Transaction();
    console.log('==>Creating Farm ', farmKey.toBase58());
    tx.add(ix);
    tx.add(program.instruction.createFarm(
        tduration, trate, new anchor.BN(maxCount), new anchor.BN(count), {
            accounts: {
                admin: userAddress,
                globalAuthority,
                farmPool: farmKey
            },
            instructions: [],
            signers: []
        }
    ));

    const { blockhash } = await solConnection.getRecentBlockhash('finalized');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "finalized");
    console.log("Your transaction signature", txId);
}

/**
 * Update Farm function
 * @param userAddress The userAddress to update the farm info
 * @param farmKey The farmPool's address
 * @param duration The tier_duration[4]
 * @param rate The tier_rate[4]
 * @param maxCount The available max stake count for the farm pool
 */
export const updateFarm = async (
    userAddress: PublicKey,
    farmKey: PublicKey,
    duration: number[],
    rate: number[],
    maxCount: number
) => {
    let tduration: anchor.BN[] = [];
    let trate: anchor.BN[]= [];
    for(let i = 0; i < 4; i++) { 
        tduration[i] = new anchor.BN(duration[i]);
        trate[i] = new anchor.BN(rate[i] * DECIMALS);
    }
    let tx = new Transaction();
    console.log('==>Updating Farm ', farmKey.toBase58());
    tx.add(program.instruction.updateFarm(
        tduration, trate, new anchor.BN(maxCount), {
            accounts: {
                admin: userAddress,
                farmPool: farmKey
            },
            instructions: [],
            signers: []
        }
    ));

    const { blockhash } = await solConnection.getRecentBlockhash('finalized');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "finalized");
    console.log("Your transaction signature", txId);
}

/**
 * Add Whitelist Address function
 * @param userAddress The userAddress to add the whitelist info
 * @param whitelistAddress The address of whitelist NFT mint or collection
 * @param farmPool Farmpool address
 * @param isCollection Check if it is collection or mint address
 *  */
export const addWhitelist = async (
    userAddress: PublicKey,
    whitelistAddress: PublicKey,
    farmPool: PublicKey,
    isCollection: Boolean
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID,
    );

    const [whitelistProof, wlbump] = await PublicKey.findProgramAddress(
        [whitelistAddress.toBuffer(), farmPool.toBuffer()],
        STAKING_PROGRAM_ID,
    );
    let tx = new Transaction();
    console.log('==>Adding Whitelist', whitelistAddress.toBase58());

    tx.add(program.instruction.addWhitelist(
        isCollection, {
            accounts: {
                admin: userAddress,
                globalAuthority,
                farmPool,
                whitelistAddress,
                whitelistProof,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            },
            instructions: [],
            signers: []
        }
    ));

    const { blockhash } = await solConnection.getRecentBlockhash('finalized');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "finalized");
    console.log("Your transaction signature", txId);
}


/**
 * Remove Whitelist Address function
 * @param userAddress The userAddress to remove the whitelist info
 * @param whitelistAddress The address of whitelist NFT mint or collection
 * @param farmPool Farmpool address
 *  */
 export const removeWhitelist = async (
    userAddress: PublicKey,
    whitelistAddress: PublicKey,
    farmPool: PublicKey,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID,
    );

    const [whitelistProof, wlbump] = await PublicKey.findProgramAddress(
        [whitelistAddress.toBuffer(), farmPool.toBuffer()],
        STAKING_PROGRAM_ID,
    );
    console.log(whitelistProof.toBase58());
    let tx = new Transaction();
    console.log('==>Removing Whitelist', whitelistAddress.toBase58());

    tx.add(program.instruction.removeWhitelist(
        {
            accounts: {
                admin: userAddress,
                globalAuthority,
                farmPool,
                whitelistAddress,
                whitelistProof,
            },
            instructions: [],
            signers: []
        }
    ));

    const { blockhash } = await solConnection.getRecentBlockhash('finalized');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "finalized");
    console.log("Your transaction signature", txId);
}


/**
 * Stop/Start Farm function
 * @param userAddress The function caller
 * @param farmPool The farmPool address to stop/start
 * @param isStop True: stop the farm, False: start the farm
 */
 export const setStop = async (
    userAddress: PublicKey,
    farmPool: PublicKey,
    isStop: Boolean
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID,
    );

    
    let tx = new Transaction();
    console.log('==>Stop/Start the farm', farmPool.toBase58());

    tx.add(program.instruction.setStop(
        isStop, {
            accounts: {
                admin: userAddress,
                globalAuthority,
                farmPool,
            },
            instructions: [],
            signers: []
        }
    ));

    const { blockhash } = await solConnection.getRecentBlockhash('finalized');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "finalized");
    console.log("Your transaction signature", txId);
}

/**
 * 
 * @param userAddress The caller Address
 * @param farmPool The farmPool address
 * @param nftMint NFT mint address
 * @returns 
 */
export const calculateReward = async (
    userAddress: PublicKey,
    farmPool: PublicKey,
    nftMint: PublicKey
) => {
    const globalPool: GlobalPool | null = await getGlobalState(program);
    if (globalPool === null) return 0;

    const userPool: UserPool | null = await getUserPoolState(userAddress, program);
    if (userPool === null) return 0;

    const farmData: FarmData | null = await getFarmState(farmPool, program);
    if (farmData === null) return 0;

    
    let slot = await solConnection.getSlot();
    let now = await solConnection.getBlockTime(slot);
    if (now === null) return 0;
    let reward = 0;
    
    for (let i = 0; i < userPool.stakedCount.toNumber(); i++) {
        if (userPool.staking[i].mint.toBase58() === nftMint.toBase58()) {
            let duration = now - userPool.staking[i].claimedTime.toNumber();
            for (let j = 0;  j < 3; j++){
                if (duration >= farmData.tierDuration[j].toNumber()) {
                    reward += farmData.tierDuration[j].toNumber() * farmData.tierRate[j].toNumber();
                    duration -= farmData.tierDuration[j].toNumber();
                } else {
                    reward += duration * farmData.tierRate[j].toNumber();
                    duration = 0;
                    break;
                }
            }
            if (duration != 0) {
                reward += duration * farmData.tierRate[3].toNumber();
            }
            return reward;
        }
    }
    return 0;

}

/**
 * The Stake NFT function
 * @param userAddress The caller Address
 * @param farmPool The farmPool address
 * @param mint NFT mint address
 * @returns 
 */
export const stakeNFT = async (
    userAddress: PublicKey,
    farmPool: PublicKey,
    mint: PublicKey,
) => {
    let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
        payer.publicKey,
        "user-pool",
        STAKING_PROGRAM_ID,
    );

    let poolAccount = await solConnection.getAccountInfo(userPoolKey);
    if (poolAccount === null || poolAccount.data === null) {
        await initUserPool(payer.publicKey);
    }

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID,
    );

   
    let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
    if (!await isExistAccount(userTokenAccount, solConnection)) {
        let accountOfNFT = await getNFTTokenAccount(mint, solConnection);
        if (userTokenAccount.toBase58() != accountOfNFT.toBase58()) {
            let nftOwner = await getOwnerOfNFT(mint, solConnection);
            if (nftOwner.toBase58() == userAddress.toBase58()) userTokenAccount = accountOfNFT;
            else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
                throw 'Error: Nft is not owned by user';
            }
        }
    }
    console.log("NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58())

    const metadata = await getMetadata(mint);
    console.log(metadata);
    let data = await getMxMetadata(mint, solConnection);
    let creators = data.data.creators;
    console.log(creators[0]);
    let first_creator = new PublicKey(creators[0].address);

    const [whitelistMintProof, wmbump] = await PublicKey.findProgramAddress(
        [mint.toBuffer(), farmPool.toBuffer()],
        STAKING_PROGRAM_ID,
    );
    const [whitelistCollectionProof, wcbump] = await PublicKey.findProgramAddress(
        [first_creator.toBuffer(), farmPool.toBuffer()],
        STAKING_PROGRAM_ID,
    );


    let remainingAccounts = [
        {
            pubkey: whitelistMintProof,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: whitelistCollectionProof,
            isSigner: false,
            isWritable: true,
        },
    ];

    
    let tx = new Transaction();

    if (instructions.length > 0) instructions.map((ix) => tx.add(ix));
    console.log('==>Staking ...', mint.toBase58());

    tx.add(program.instruction.stakeNftToPool(
        bump, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            farmPool,
            globalAuthority,
            userNftTokenAccount: userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            mintMetadata: metadata,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: METAPLEX,
        },
        remainingAccounts,
        instructions: [],
        signers: [],
    }));

    const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}


export const getUserPoolInfo = async (
    userAddress: PublicKey,
) => {
    const userInfo: UserPool = await getUserPoolState(userAddress, program);
    return {
        owner: userInfo.owner.toBase58(),
        stakedCount: userInfo.stakedCount.toNumber(),
        staking: userInfo.staking.map((info) => {
            return {
                mint: info.mint.toBase58(),
                farmNumber: info.farmNumber.toNumber(),
                stakedTime: info.stakedTime.toNumber(),
                claimedTime: info.claimedTime.toNumber(),
            }
        }),
    };
}


/**
 * Claim Reward function
 * @param userAddress The caller address
 * @param farmPool The farmPool address
 * @param mint The NFT mint address
 */
 export const claimReward = async (
    userAddress: PublicKey,
    farmPool: PublicKey,
    mint: PublicKey,
) => {

    let info =  await getGlobalState(program);
    let rewardMint = info.rewardToken;

    let ret = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        userAddress,
        [rewardMint]
    );

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID
    );

    let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        STAKING_PROGRAM_ID,
    );

    let tx = new Transaction();
    console.log('==> Claiming Reward ... ', mint.toBase58());
    if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
    tx.add(program.instruction.claimReward(
        bump, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            farmPool,
            globalAuthority,
            userRewardAccount: ret.destinationAccounts[0],
            rewardMint,
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    }));
    const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}

/**
 * Withdraw NFT function
 * @param userAddress The caller address
 * @param farmPool The farmPool address
 * @param mint The NFT mint address
 */
export const withdrawNft = async (
    userAddress: PublicKey,
    farmPool: PublicKey,
    mint: PublicKey,
) => {

    let info =  await getGlobalState(program);
    let rewardMint = info.rewardToken;

    let ret = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        userAddress,
        [mint, rewardMint]
    );
    let userTokenAccount = ret.destinationAccounts[0];
    console.log("User NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID
    );
    let destNftTokenAccount = await getAssociatedTokenAccount(globalAuthority, mint);

    let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        STAKING_PROGRAM_ID,
    );

    let tx = new Transaction();
    console.log('==> Withdrawing ... ', mint.toBase58());
    if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
    tx.add(program.instruction.unstakeNftFromPool(
        bump, {
        accounts: {
            owner: userAddress,
            userPool: userPoolKey,
            farmPool,
            globalAuthority,
            userNftTokenAccount: userTokenAccount,
            destNftTokenAccount,
            userRewardAccount: ret.destinationAccounts[1],
            rewardMint,
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    }));
    const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}


/**
 * Transfer Mint Authority
 * @param userAddress The caller address
 * @param newAuthority The new Authority address
 */
 export const transferMintAuth = async (
    userAddress: PublicKey,
    newAuthority: PublicKey,
) => {

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID
    );

    let info =  await getGlobalState(program);
    let rewardMint = info.rewardToken;

    let tx = new Transaction();
    console.log('==> Transfering Authority ... ');
    tx.add(program.instruction.transferMintAuthority(
        bump, {
        accounts: {
            admin: userAddress,
            globalAuthority,
            rewardMint,
            newAuthority,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    }));
    const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}


/**
 * Mint To Account
 * @param userAddress The caller address
 * @param receiver The receiver Address
 * @param amount The amount to mint to the specific account
 */
 export const mintToAccount = async (
    userAddress: PublicKey,
    receiver: PublicKey,
    amount: number
) => {

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID
    );

    let info =  await getGlobalState(program);
    let rewardMint = info.rewardToken;

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        solConnection,
        userAddress,
        receiver,
        [rewardMint]
    );

    let tx = new Transaction();
    console.log('==> Minting To Account ... ');
    if (instructions.length > 0) instructions.map((ix) => tx.add(ix));
    tx.add(program.instruction.mintToAccount(
        bump, new anchor.BN(amount*DECIMALS), {
        accounts: {
            admin: userAddress,
            globalAuthority,
            rewardMint,
            userRewardAccount: destinationAccounts[0],
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    }));
    const { blockhash } = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}


export const getGlobalInfo = async () => {
    const globalPool: GlobalPool = await getGlobalState(program);
    const result = {
        admin: globalPool.superAdmin.toBase58(),
        rewardToken: globalPool.rewardToken.toBase58(),
        totalStakedCount: globalPool.totalStakedCount.toNumber(),
        farmCount: globalPool.farmCount.toNumber()
    };

    return result;
}

export const getAllNFTs = async (rpc?: string) => {
    return await getAllStakedNFTs(solConnection, rpc);
}


export const getGlobalState = async (
    program: anchor.Program,
): Promise<GlobalPool | null> => {
    const [globalAuthority, _] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        STAKING_PROGRAM_ID
    );
    try {
        let globalState = await program.account.globalPool.fetch(globalAuthority);
        return globalState as unknown as GlobalPool;
    } catch {
        return null;
    }
}

export const getUserPoolState = async (
    userAddress: PublicKey,
    program: anchor.Program,
): Promise<UserPool | null> => {
    let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
        userAddress,
        "user-pool",
        STAKING_PROGRAM_ID,
    );
    try {
        let userPoolState = await program.account.userPool.fetch(userPoolKey);
        return userPoolState as unknown as UserPool;
    } catch {
        return null;
    }
}


export const getFarmState = async (
    farmPool: PublicKey,
    program: anchor.Program,
): Promise<FarmData | null> => {
    
    try {
        let farmState = await program.account.farmData.fetch(farmPool);
        return farmState as unknown as FarmData;
    } catch {
        return null;
    }
}


export const getAllStakedNFTs = async (connection: Connection, rpcUrl: string | undefined) => {
    let solConnection = connection;

    if (rpcUrl) {
        solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
    }

    let poolAccounts = await solConnection.getProgramAccounts(
        STAKING_PROGRAM_ID,
        {
            filters: [
                {
                    dataSize: USER_POOL_SIZE,
                },
            ]
        }
    );

    console.log(`Encounter ${poolAccounts.length} NFT Data Accounts`);

    let result: UserPool[] = [];

    try {
        for (let idx = 0; idx < poolAccounts.length; idx++) {
            let data = poolAccounts[idx].account.data;
            const owner = new PublicKey(data.slice(8, 40));

            let buf = data.slice(40, 48).reverse();
            const stakedCount = new anchor.BN(buf);

            let staking = [];
            for (let i = 0; i < stakedCount.toNumber(); i++) {
                const mint = new PublicKey(data.slice(i * 56 + 48, i * 56 + 80));

                buf = data.slice(i * 56 + 80, i * 56 + 88).reverse();
                const farmNumber = new anchor.BN(buf);
                buf = data.slice(i * 56 + 88, i * 56 + 96).reverse();
                const stakedTime = new anchor.BN(buf);
                buf = data.slice(i * 56 + 96, i * 56 + 104).reverse();
                const claimedTime = new anchor.BN(buf);

                staking.push({
                    mint,
                    farmNumber,
                    stakedTime,
                    claimedTime,
                })
            }

            result.push({
                owner,
                stakedCount,
                staking,
            });
        }
    } catch (e) {
        console.log(e);
        return {};
    }

    return {
        count: result.length,
        data: result.map((info: UserPool) => {
            return {
                owner: info.owner.toBase58(),
                stakedCount: info.stakedCount.toNumber(),
                staking: info.staking.map((info) => {
                    return {
                        mint: info.mint.toBase58(),
                        farmNumber: info.farmNumber.toNumber(),
                        stakedTime: info.stakedTime.toNumber(),
                        claimedTime: info.claimedTime.toNumber(),
                    }
                }),
            }
        })
    }
};

main();