import { PrismaClient } from "@prisma/client"

export async function getAccessoryAssignment(
    prisma: PrismaClient,
    input: {
        accessoryId: number
        asunaId: number
    }
) {
    return prisma.accessoryToAsuna.findFirst({
        where: {
            accessory_id: input.accessoryId,
            asuna_id: input.asunaId,
        },
    })
}

export async function equipAccessory(
    prisma: PrismaClient,
    input: {
        accessoryId: number
        asunaId: number
    }
) {
    await prisma.accessoryToAsuna.upsert({
        create: {
            accessory_id: input.accessoryId,
            asuna_id: input.asunaId,
        },
        update: {
            asuna_id: input.asunaId,
        },
        where: {
            accessory_id: input.accessoryId,
        },
    })
}

export async function unequipAccessory(prisma: PrismaClient, input: { accessoryId: number }) {
    await prisma.accessoryToAsuna.update({
        where: {
            accessory_id: input.accessoryId,
        },
        data: {
            asuna_id: null,
        },
    })
}
