# Custom Staking Program
This project is the staking program with minting rewards and have many farm pools which have different reward logic.

## Install Dependencies
- Install `node` and `yarn`
- Install `ts-node` as global command
- Confirm the solana wallet preparation: `/home/fury/.config/solana/id.json` in test case

### Before that in your PC solana programs have to be installed with this version
- $ solana --version
// solana-cli 1.8.16 (src:23af37fe; feat:1886190546)
- $ anchor --version
// anchor-cli 0.24.2
- $ node --version
// v16.14.0
- $ yarn --version
// 1.22.17
- $ cargo --version
// cargo 1.59.0 (49d8809dc 2022-02-10)

### Usage
- Main script source for all functionality is here: `/cli/script.ts`
- Program account types are declared here: `/cli/types.ts`
- Idl to make the JS binding easy is here: `/cli/staking.ts`


## How to deploy this program and add NFT to this pool?
First of all, you have to git clone in your PC.
In the folder `Custom-Staking-program/staking`, in the terminal 
1. `yarn`
2. `anchor build`
   In the last sentence you can see:  
```
 To deploy this program:
  $ solana program deploy /home/ubuntu/apollo/Custom-Staking-program/staking/target/deploy/staking.so
The program address will default to this keypair (override with --program-id):
  /home/ubuntu/apollo/Custom-Staking-program/staking/target/deploy/staking-keypair.json
```  
3. `solana-keygen pubkey /home/ubuntu/apollo/Custom-Staking-program/staking/target/deploy/staking-keypair.json`
4. You can get the pubkey of the program ID : ex."GiG...CytWf"
5. Please add this pubkey to the lib.rs
  `line 18: declare_id!("GiG...CytWf");`
6. Please add this pubkey to the Anchor.toml
  `line 2: ev_tier = "GiG...CytWf"`
7. Please add this pubkey to the types.ts
  `line 6: export const STAKING_PROGRAM_ID = new PublicKey("GiG...CytWf");`
8. `anchor build` again
9. `solana program deploy /home/ubuntu/apollo/Custom-Staking-program/staking/target/deploy/staking.so`
10. In backend/ directory in terminal `yarn ts-node`
11. If this error comes - `Error: Provider local is not available on browser.`, 
please run  `export BRWOSER=`
12. In backend/ directory in terminal `yarn ts-node`again.

Then you can enjoy this program.

## Usage

### As a Smart Contract Owner
For the first time use, the Smart Contract Owner should `initialize` the Smart Contract for global account allocation.
```js
/**
 * Initialize the project
 * @param userAddress The userAddress to initProject
 */
export const initProject = async (
    userAddress: PublicKey
)
```

### As the Admin
The admin can create Farm with variables with the function `createFarm`
```js
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
)
```

The admin can update the farm info with the function `updateFarm`
```js
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

)
```

The admin can add whitelist NFT mint address and collection address(first creator's address) with the function `addWhitelist`

```js
/**
 * Add Whitelist Address function
 * @param userAddress The userAddress to update the farm info
 * @param whitelistAddress The address of whitelist NFT mint or collection
 * @param farmPool Farmpool address
 * @param isCollection Check if it is collection or mint addres
 *  */
export const addWhitelist = async (
    userAddress: PublicKey,
    whitelistAddress: PublicKey,
    farmPool: PublicKey,
    isCollection: Boolean
)
```

The admin can stop/start the specific pool - `farmPool` with the function `setStop`

```js
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
)
```

The admin can change the mintAuthority from the PDA to the new Authority address
```js
/**
 * Transfer Mint Authority
 * @param userAddress The caller address
 * @param newAuthority The new Authority address
 */
export const transferMintAuth = async (
    userAddress: PublicKey,
    newAuthority: PublicKey,
) 
```

### As the Users

Users can stake NFTs to the `farmPool` with this function `stakeNFT`

```js
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
)
```

For the first time they should call the function to initialize the user pool
```js
/**
 * Initialize the user's Pool
 * @param userAddress The user's address
 */
export const initUserPool = async (
    userAddress: PublicKey
)
```

The users can claim rewards from the `farmPool` by calling the function `claimReward`
```js
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
)
```

The users can withdraw NFTs from the `farmPool` with this function
```js
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
) 
```

The users can mint reward Token to the `receiver` address with the `amount`
```js
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
)
```