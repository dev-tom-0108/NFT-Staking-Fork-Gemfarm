export type Staking = {
  "version": "0.1.0",
  "name": "staking",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardToken",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializeUserPool",
      "accounts": [
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "createFarm",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tierDuration",
          "type": {
            "vec": "i64"
          }
        },
        {
          "name": "tierRate",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "maxStakeCount",
          "type": "u64"
        },
        {
          "name": "count",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateFarm",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newTierDuration",
          "type": {
            "vec": "i64"
          }
        },
        {
          "name": "newTierRate",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "maxStakeCount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addWhitelist",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "whitelistAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "whitelistProof",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isCollection",
          "type": "bool"
        }
      ]
    },
    {
      "name": "removeWhitelist",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "whitelistAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "whitelistProof",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "setStop",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isStop",
          "type": "bool"
        }
      ]
    },
    {
      "name": "stakeNftToPool",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "claimReward",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "unstakeNftFromPool",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferMintAuthority",
      "accounts": [
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "mintToAccount",
      "accounts": [
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "publicKey"
          },
          {
            "name": "rewardToken",
            "type": "publicKey"
          },
          {
            "name": "totalStakedCount",
            "type": "u64"
          },
          {
            "name": "farmCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "whitelistProof",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "whitelistAddress",
            "type": "publicKey"
          },
          {
            "name": "isCollection",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "farmData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "farmNumber",
            "type": "u64"
          },
          {
            "name": "stakedCount",
            "type": "u64"
          },
          {
            "name": "maxStakeCount",
            "type": "u64"
          },
          {
            "name": "tierDuration",
            "type": {
              "array": [
                "i64",
                4
              ]
            }
          },
          {
            "name": "tierRate",
            "type": {
              "array": [
                "u64",
                4
              ]
            }
          },
          {
            "name": "isStop",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "userPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "stakedCount",
            "type": "u64"
          },
          {
            "name": "staking",
            "type": {
              "array": [
                {
                  "defined": "StakedData"
                },
                100
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "StakedData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "farmNumber",
            "type": "u64"
          },
          {
            "name": "stakedTime",
            "type": "i64"
          },
          {
            "name": "claimedTime",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "StakingError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidSuperOwner"
          },
          {
            "name": "InvalidInput"
          },
          {
            "name": "InvalidWhitelistAddress"
          },
          {
            "name": "InvalidFarmCount"
          },
          {
            "name": "InvalidGlobalPool"
          },
          {
            "name": "InvalidUserPool"
          },
          {
            "name": "PoolStopped"
          },
          {
            "name": "ExceedMaxCount"
          },
          {
            "name": "InvalidWithdrawTime"
          },
          {
            "name": "InvalidNFTAddress"
          },
          {
            "name": "InsufficientRewardVault"
          },
          {
            "name": "InvaliedMetadata"
          },
          {
            "name": "MetadataCreatorParseError"
          },
          {
            "name": "UnkownOrNotAllowedNFTCollection"
          }
        ]
      }
    }
  ]
};

export const IDL: Staking = {
  "version": "0.1.0",
  "name": "staking",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardToken",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializeUserPool",
      "accounts": [
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "createFarm",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tierDuration",
          "type": {
            "vec": "i64"
          }
        },
        {
          "name": "tierRate",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "maxStakeCount",
          "type": "u64"
        },
        {
          "name": "count",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateFarm",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newTierDuration",
          "type": {
            "vec": "i64"
          }
        },
        {
          "name": "newTierRate",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "maxStakeCount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addWhitelist",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "whitelistAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "whitelistProof",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isCollection",
          "type": "bool"
        }
      ]
    },
    {
      "name": "removeWhitelist",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "whitelistAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "whitelistProof",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "setStop",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isStop",
          "type": "bool"
        }
      ]
    },
    {
      "name": "stakeNftToPool",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "claimReward",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "unstakeNftFromPool",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "farmPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferMintAuthority",
      "accounts": [
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "mintToAccount",
      "accounts": [
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewardMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "publicKey"
          },
          {
            "name": "rewardToken",
            "type": "publicKey"
          },
          {
            "name": "totalStakedCount",
            "type": "u64"
          },
          {
            "name": "farmCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "whitelistProof",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "whitelistAddress",
            "type": "publicKey"
          },
          {
            "name": "isCollection",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "farmData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "farmNumber",
            "type": "u64"
          },
          {
            "name": "stakedCount",
            "type": "u64"
          },
          {
            "name": "maxStakeCount",
            "type": "u64"
          },
          {
            "name": "tierDuration",
            "type": {
              "array": [
                "i64",
                4
              ]
            }
          },
          {
            "name": "tierRate",
            "type": {
              "array": [
                "u64",
                4
              ]
            }
          },
          {
            "name": "isStop",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "userPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "stakedCount",
            "type": "u64"
          },
          {
            "name": "staking",
            "type": {
              "array": [
                {
                  "defined": "StakedData"
                },
                100
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "StakedData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "farmNumber",
            "type": "u64"
          },
          {
            "name": "stakedTime",
            "type": "i64"
          },
          {
            "name": "claimedTime",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "StakingError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidSuperOwner"
          },
          {
            "name": "InvalidInput"
          },
          {
            "name": "InvalidWhitelistAddress"
          },
          {
            "name": "InvalidFarmCount"
          },
          {
            "name": "InvalidGlobalPool"
          },
          {
            "name": "InvalidUserPool"
          },
          {
            "name": "PoolStopped"
          },
          {
            "name": "ExceedMaxCount"
          },
          {
            "name": "InvalidWithdrawTime"
          },
          {
            "name": "InvalidNFTAddress"
          },
          {
            "name": "InsufficientRewardVault"
          },
          {
            "name": "InvaliedMetadata"
          },
          {
            "name": "MetadataCreatorParseError"
          },
          {
            "name": "UnkownOrNotAllowedNFTCollection"
          }
        ]
      }
    }
  ]
};
