import { ethers } from "ethers"

const mumbaiProvider = new ethers.providers.JsonRpcProvider(
    "https://polygon-mumbai.g.alchemy.com/v2/xFY_QD03fCJBIyG-BqAkLD0HWI8dsymm"
)

export const EthProvider = new ethers.providers.Web3Provider(window.ethereum ?? mumbaiProvider)
