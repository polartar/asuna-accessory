import { ActionRequest, Wallet } from "@prisma/client"
import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { Button } from "~/components/button"
import { prisma } from "~/db.server"
import { getUnequippedAccessories } from "~/models/accessory.server"
import { createActionRequest, getActionRequests } from "~/models/action_request.server"
import { getAsuna } from "~/models/asuna.server"
import { requireUserId } from "~/models/session.server"
import { AccessoryDTO, AsunaDTO } from "~/models/types"
import { getUser } from "~/models/user.server"

type LoaderData = {
    asuna: AsunaDTO
    equippedAccessories: AccessoryDTO[]
    unequippedAccessories: AccessoryDTO[]
    actionRequests: ActionRequest[]
    wallet: Wallet | null
    prices: {
        equip: number
        unequip: number
    }
}

export const loader: LoaderFunction = async ({ request, params }) => {
    const userId = await requireUserId(request)
    const user = await getUser(userId)
    const asunaId = parseInt(params.asuna_id ?? "")
    if (isNaN(asunaId)) {
        return redirect("/404")
    }

    const asunaPayload = await getAsuna(asunaId)
    if (!asunaPayload) {
        return redirect("/404")
    }

    const unequippedAccessories = await getUnequippedAccessories({
        ownerAddress: user.address,
    })

    const actionRequests = await getActionRequests({
        asunaId,
        limit: 30,
    })

    const actionRequestsMap = actionRequests.reduce((acc, next) => {
        if (next.txn_state === "Pending") {
            acc[next.accessory_id] = next
        }
        return acc
    }, {} as Record<number, ActionRequest>)

    const equippedAccessoriesNonpending = asunaPayload.accessories.filter(a => {
        return !actionRequestsMap[a.token_id]
    })

    const unequippedAccessoriesNonpending = unequippedAccessories.filter(a => {
        return !actionRequestsMap[a.token_id]
    })

    return json<LoaderData>({
        asuna: asunaPayload.asuna,
        equippedAccessories: equippedAccessoriesNonpending,
        unequippedAccessories: unequippedAccessoriesNonpending,
        actionRequests,
        wallet: await prisma.wallet.findUnique({ where: { user_id: userId } }),
        prices: {
            equip:
                (
                    await prisma.actionPrice.findUnique({
                        where: { action_type: "Equip" },
                    })
                )?.cost ?? 0,
            unequip:
                (
                    await prisma.actionPrice.findUnique({
                        where: { action_type: "Unequip" },
                    })
                )?.cost ?? 0,
        },
    })
}

export const action: ActionFunction = async ({ request, params }) => {
    const userId = await requireUserId(request)
    const body = await request.formData()
    const action = body.get("action")?.toString()
    const asunaId = parseInt(params.asuna_id ?? "")
    const accessoryIds = body.getAll("accessory_ids").map(v => parseInt(v.toString()))

    const user = await getUser(userId)

    if (action === "unequip") {
        await createActionRequest({
            accessoryIds,
            actionType: "Unequip",
            asunaId: asunaId,
            requesterAddress: user.address,
        })
    } else if (action === "equip") {
        await createActionRequest({
            accessoryIds,
            actionType: "Equip",
            asunaId: asunaId,
            requesterAddress: user.address,
        })
    }

    return null
}

export default function InventoryAsunaView() {
    const {
        asuna,
        equippedAccessories,
        unequippedAccessories: availableAccessories,
        actionRequests,
        prices,
        wallet,
    } = useLoaderData<LoaderData>()

    return (
        <div className="p-4">
            <div className="flex items-center gap-2">
                <Link to="/inventory">
                    <Button>Inventory</Button>
                </Link>
                <Link to="/wallet">
                    <Button>Wallet</Button>
                </Link>
            </div>

            <div className="mt-2">
                <p>Balance ${wallet?.balance ?? 0}</p>
            </div>

            <div className="grid md:grid-cols-2 mt-4 gap-3 text-center md:text-left">
                <div>
                    <div className="flex items-center flex-col md:block">
                        <p>Asuna {asuna.token_id}</p>
                        <img
                            className="w-24"
                            alt={`Asuna ${asuna.token_id}`}
                            src={`https://tunes.mypinata.cloud/ipfs/${asuna?.metadata?.image.slice(7)}`}
                        ></img>
                    </div>

                    <p className="font-bold">Equipments</p>
                    <form method="post">
                        <div>
                            <p>on mac, cmd + click to select multiple options</p>
                            <button
                                name="action"
                                value="unequip"
                                className="px-4 py-2 mt-1   text-sm font-medium rounded-3xl bg-[#818cf8] hover:bg-[#6366f1] shadow-sm"
                            >
                                Unequip
                                {prices.unequip > 0}
                                <span> (Cost ${prices.unequip})</span>
                            </button>
                        </div>
                        <select
                            name="accessory_ids"
                            size={equippedAccessories.length}
                            multiple
                            className="w-full mt-2 max-w-md text-white bg-transparent border border-gray-400 rounded"
                        >
                            {equippedAccessories.map(acc => {
                                return (
                                    <option key={`unequip-${acc.token_id}`} value={acc.token_id}>
                                        Accessory {acc.token_id}
                                    </option>
                                )
                            })}
                        </select>
                    </form>
                </div>

                <div className="mt-8 md:mt-0">
                    <p className="font-bold">Unequipped Items</p>
                    <form method="post">
                        <div>
                            <p>on mac, cmd + click to select multiple options</p>
                            <button
                                name="action"
                                value="equip"
                                className="px-4 py-2 mt-1   text-sm font-medium rounded-3xl bg-[#818cf8] hover:bg-[#6366f1] shadow-sm"
                            >
                                Equip
                                {prices.equip > 0}
                                <span> (Cost ${prices.equip})</span>
                            </button>
                        </div>
                        <select
                            name="accessory_ids"
                            size={availableAccessories.length}
                            multiple
                            className="w-full mt-2 max-w-md text-white bg-transparent border border-gray-400 rounded"
                        >
                            {availableAccessories.map(acc => {
                                return (
                                    <option key={`equip-${acc.token_id}`} value={acc.token_id}>
                                        Accessory {acc.token_id}
                                    </option>
                                )
                            })}
                        </select>
                    </form>
                </div>
            </div>

            <div className="mt-8 text-center md:text-left">
                <h2 className="font-bold">Actions</h2>
                <ul>
                    {actionRequests.map(r => {
                        return (
                            <li key={r.id}>
                                {new Date(r.created_at).toDateString()} {new Date(r.created_at).toLocaleTimeString()}:{" "}
                                <span className="font-semibold">Accessory {r.accessory_id}</span> {r.action_type} -{" "}
                                {r.txn_state}
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}
