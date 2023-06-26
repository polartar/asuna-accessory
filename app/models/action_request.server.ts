import { PutEventsCommand } from "@aws-sdk/client-eventbridge"
import { ActionType, TxnState } from "@prisma/client"
import { prisma } from "~/db.server"
import { equipEquipmentsTxn, unequipEquipmentsTxn } from "~/libs/accessories_holder_hot_contract.server"
import { eventbridge, makeEBEquipmentRequest } from "~/libs/aws.server"
import { getActionPrice } from "./action_price.server"
import { getAsuna } from "./asuna.server"
import { AccessoryDTO } from "./types"
import { getWalletByAddressTx, updateWalletByAddress } from "./wallet.server"

export async function getActionRequests(input: {
    asunaId: number
    txnState?: TxnState
    actionType?: ActionType
    limit?: number
}) {
    return prisma.actionRequest.findMany({
        where: {
            asuna_id: input.asunaId,
            action_type: input.actionType,
            txn_state: input.txnState,
        },
        take: input.limit,
        orderBy: {
            created_at: "desc",
        },
    })
}

export async function createActionRequest(input: {
    actionType: ActionType
    accessoryIds: number[]
    asunaId: number
    requesterAddress: string
}) {
    const payload = await getAsuna(input.asunaId)
    if (!payload) {
        throw new Error("Asuna does not exist")
    }

    if (input.accessoryIds.length === 0) {
        throw new Error("Must select accessories")
    }

    const asunaAccesssories = payload.accessories.reduce((obj, acc) => {
        obj[acc.token_id] = acc
        return obj
    }, {} as Record<number, AccessoryDTO>)

    // 1. Reject accessory request attempts if duplicate accessories are passed
    // 2. Check all accessory metadata and see if more than one have the same type (more than one are hats) and if so, reject it.

    if (input.actionType === "Equip") {
        input.accessoryIds.forEach(accId => {
            const accessoryOnAsuna = asunaAccesssories[accId]
            if (accessoryOnAsuna) {
                throw new Error("Item is already equipped")
            }
        })
    }

    if (input.actionType === "Unequip") {
        input.accessoryIds.forEach(accId => {
            const accessoryOnAsuna = asunaAccesssories[accId]
            if (!accessoryOnAsuna) {
                throw new Error("Item is not equipped")
            }
        })
    }

    const existingRequests = await prisma.actionRequest.findMany({
        where: {
            action_type: input.actionType,
            accessory_id: {
                in: input.accessoryIds,
            },
            asuna_id: input.asunaId,
            txn_state: "Pending",
        },
        orderBy: {
            created_at: "desc",
        },
    })

    if (existingRequests.length > 0) {
        throw new Error(
            `Cannot make a new request because of pending items: ${existingRequests
                .map(r => r.accessory_id)
                .toString()}`
        )
    }

    await prisma.$transaction(
        async tx => {
            let txn: { hash: string } = { hash: "" }
            if (input.actionType === "Equip") {
                const equipPrice = await getActionPrice(tx, "Equip")
                if (equipPrice > 0) {
                    const wallet = await getWalletByAddressTx(tx, input.requesterAddress)
                    if (wallet.balance < equipPrice) {
                        throw new Error("Not enough credit")
                    }
                    await updateWalletByAddress(tx, {
                        address: input.requesterAddress,
                        direction: "decr",
                        amount: equipPrice,
                    })
                }
                txn = await equipEquipmentsTxn({
                    accessoryIds: input.accessoryIds,
                    asunaId: input.asunaId,
                    asunaOwnerAddress: input.requesterAddress,
                })
            } else if (input.actionType === "Unequip") {
                const unequipPrice = await getActionPrice(tx, "Unequip")
                if (unequipPrice > 0) {
                    const wallet = await getWalletByAddressTx(tx, input.requesterAddress)
                    if (wallet.balance < unequipPrice) {
                        throw new Error("Not enough credit")
                    }
                    await updateWalletByAddress(tx, {
                        address: input.requesterAddress,
                        direction: "decr",
                        amount: unequipPrice,
                    })
                }
                txn = await unequipEquipmentsTxn({
                    accessoryIds: input.accessoryIds,
                    asunaId: input.asunaId,
                    asunaOwnerAddress: input.requesterAddress,
                })
            }

            const reqCount = await tx.actionRequest.createMany({
                data: input.accessoryIds.map(i => {
                    return {
                        accessory_id: i,
                        action_type: input.actionType,
                        asuna_id: input.asunaId,
                        txn_state: TxnState.Pending,
                        req_address: input.requesterAddress,
                        txn_hash: txn.hash,
                    }
                }),
            })

            const requests = await tx.actionRequest.findMany({
                where: {
                    accessory_id: {
                        in: input.accessoryIds,
                    },
                    action_type: input.actionType,
                    asuna_id: input.asunaId,
                    txn_state: TxnState.Pending,
                    req_address: input.requesterAddress,
                    txn_hash: txn.hash,
                },
                take: reqCount.count,
            })

            await eventbridge.send(
                new PutEventsCommand({
                    Entries: requests.map(r => {
                        return makeEBEquipmentRequest({
                            accessoryId: r.accessory_id,
                            actionType: r.action_type,
                            asunaId: r.asuna_id,
                            requestId: r.id,
                            requestorAddress: r.req_address,
                            txnHash: r.txn_hash,
                        })
                    }),
                })
            )

            return
        },
        {
            timeout: 20000,
        }
    )
}
