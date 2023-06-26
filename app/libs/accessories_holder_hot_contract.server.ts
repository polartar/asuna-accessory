import { ethers } from "ethers"
import { AccessoriesHolderHotContract } from "./hot_wallet.server"

export async function equipEquipmentsTxn(input: {
    accessoryIds: number[]
    asunaId: number
    asunaOwnerAddress: string
}) {
    const txn = await AccessoriesHolderHotContract.equipAccessories(
        input.asunaId,
        input.accessoryIds,
        input.accessoryIds.map(() => 1),
        input.asunaOwnerAddress,
        {
            gasPrice: ethers.utils.parseUnits("50", "gwei"),
        }
    )

    return txn
}

export async function unequipEquipmentsTxn(input: {
    accessoryIds: number[]
    asunaId: number
    asunaOwnerAddress: string
}) {
    const txn = await AccessoriesHolderHotContract.unequipAccessories(
        input.asunaId,
        input.accessoryIds,
        input.accessoryIds.map(() => 1),
        input.asunaOwnerAddress,
        {
            gasPrice: ethers.utils.parseUnits("50", "gwei"),
        }
    )

    return txn
}
