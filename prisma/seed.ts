import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seed() {
    await prisma.actionPrice.createMany({
        data: [
            {
                action_type: "Equip",
            },
            {
                action_type: "Unequip",
            },
        ],
    })
}

seed()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
