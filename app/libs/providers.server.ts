// Lives of Asuna https://etherscan.io/address/0xaf615b61448691fc3e4c61ae4f015d6e77b6cca8

import { ethers } from "ethers"
import AsunasAbiJson from "./asunas_abi.json"
import AccessoriesAbiJson from "./accessories_abi.json"
import AccessoriesHolderAbiJson from "./accessories_holder_abi.json"

// Update with latest contract addresses.
export const ASUNA_ADDR = "0xC5B8758773a69ae33B8D8B95f75de2f626498C29"
export const ACCESSORY_ADDR = "0xB43c8A75A8869fAA8F111facb16E7f1514aAd894"
export const ACCESSORY_HOLDER_ADDR = "0xfdC1f085a3bf0DbE115650633d7A163953C49327"

// Abis are copied from project root /artifacts/contracts after hardhat compilation.
export const AsunasAbi = AsunasAbiJson.abi
export const AccessoriesAbi = AccessoriesAbiJson.abi
export const AccessoriesHolderAbi = AccessoriesHolderAbiJson.abi

// Subgraph
export const ACCESSORY_SUBGRAPH = "https://api.thegraph.com/subgraphs/name/polartar/asuna"

export const GoerlibyProvider = new ethers.providers.JsonRpcProvider(
    `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
)

export const MumbaiProvider = new ethers.providers.JsonRpcProvider(
    "https://polygon-mumbai.g.alchemy.com/v2/xFY_QD03fCJBIyG-BqAkLD0HWI8dsymm"
)

// https://rinkeby.etherscan.io/address/0x12D35409f526D54FaDef3C79E009CB3Fb9a8044E
export const AsunaContract = new ethers.Contract(ASUNA_ADDR, AsunasAbi, GoerlibyProvider)

// https://mumbai.polygonscan.com/address/0xB43c8A75A8869fAA8F111facb16E7f1514aAd894
export const AccessoryContract = new ethers.Contract(ACCESSORY_ADDR, AccessoriesAbi, MumbaiProvider)
