import { v4 as uuidv4 } from "uuid"
import { Prisma, User } from "@prisma/client"
import { prisma } from "~/db.server"

export async function getUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        throw new Error("No user")
    }
    return user
}

export async function createUser(input: { address: string; nonce?: string }): Promise<User> {
    const user = prisma.$transaction(async tx => {
        const user = await tx.user.create({
            data: {
                address: input.address,
                nonce: input.nonce,
            },
        })
        await tx.wallet.create({
            data: {
                user_id: user.id,
            },
        })
        return user
    })
    return user
}

export async function getUserByAddress(address: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { address } })
}

export async function getUserByAddresTx(tx: Prisma.TransactionClient, address: string): Promise<User | null> {
    return tx.user.findUnique({ where: { address } })
}

export async function updateUserNonce(input: { userId: string }): Promise<void> {
    const nonce = `Please verify your wallet ownership. \n${uuidv4()}`
    await prisma.user.update({
        data: {
            nonce,
        },
        where: {
            id: input.userId,
        },
    })
}
