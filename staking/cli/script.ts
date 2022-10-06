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