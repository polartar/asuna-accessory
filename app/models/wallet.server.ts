import { Prisma, Wallet } from "@prisma/client"
import { prisma } from "~/db.server"
import { getUserByAddress, getUserByAddresTx as getUserByAddressTx } from "./user.server"

export async function getWalletByAddress(address: string): Promise<Wallet> {
    const user = await getUserByAddress(address)
    const wallet = await prisma.wallet.findUnique({
        where: {
            user_id: user?.id,
        },
    })

    if (!wallet) {
        throw new Error("User is missing wallet")
    }

    return wallet
}

export async function getWalletByAddressTx(tx: Prisma.TransactionClient, address: string): Promise<Wallet> {
    const user = await getUserByAddress(address)
    const wallet = await tx.wallet.findUnique({
        where: {
            user_id: user?.id,
        },
    })

    if (!wallet) {
        throw new Error("User is missing wallet")
    }

    return wallet
}

export async function updateWalletByAddress(
    tx: Prisma.TransactionClient,
    input: {
        address: string
        direction: "inc" | "decr"
        amount: number
    }
): Promise<void> {
    const user = await getUserByAddressTx(tx, input.address)

    if (input.direction === "inc") {
        await tx.wallet.update({
            data: {
                balance: {
                    increment: input.amount,
                },
            },
            where: {
                user_id: user?.id,
            },
        })
    } else if (input.direction === "decr") {
        await tx.wallet.update({
            data: {
                balance: {
                    decrement: input.amount,
                },
            },
            where: {
                user_id: user?.id,
            },
        })
    }
}
