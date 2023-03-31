import { ActionType, Prisma } from "@prisma/client"

export async function getActionPrice(tx: Prisma.TransactionClient, action: ActionType): Promise<number> {
    return (
        (
            await tx.actionPrice.findUnique({
                where: {
                    action_type: action,
                },
            })
        )?.cost ?? 0
    )
}
