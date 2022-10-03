use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("Invalid Super Owner")]
    InvalidSuperOwner,
    #[msg("Invalid Input Data")]
    InvalidInput,
    #[msg("Invalid Whitelist Address")]
    InvalidWhitelistAddress,
    #[msg("Invalid Farm Count")]
    InvalidFarmCount,
    #[msg("Invalid Global Pool Address")]
    InvalidGlobalPool,
    #[msg("Invalid User Pool Owner Address")]
    InvalidUserPool,
    #[msg("This Farm Pool is Stopped")]
    PoolStopped,
    #[msg("Exceed the Max Count of this Pool")]
    ExceedMaxCount,

    #[msg("Invalid Withdraw Time")]
    InvalidWithdrawTime,
    #[msg("Not Found Staked Mint")]
    InvalidNFTAddress,

    #[msg("Insufficient Reward Token Balance")]
    InsufficientRewardVault,

    #[msg("Invalid Metadata Address")]
    InvaliedMetadata,
    #[msg("Can't Parse The NFT's Creators")]
    MetadataCreatorParseError,
    #[msg("Unknown Collection Or The Collection Is Not Allowed")]
    UnkownOrNotAllowedNFTCollection,
}