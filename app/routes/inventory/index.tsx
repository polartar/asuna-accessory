import { User } from "@prisma/client"
import { ActionFunction, json, LoaderFunction } from "@remix-run/node"
import { Form, Link, useLoaderData } from "@remix-run/react"
import { AccessoryContract, AsunaContract } from "~/libs/providers.server"
import { getOwnAccessories } from "~/models/accessory.server"
import { getOwnAsunas } from "~/models/asuna.server"
import { logout, requireUserId } from "~/models/session.server"
import { AccessoryDTO, AsunaDTO } from "~/models/types"
import { getUser } from "~/models/user.server"

export type LoaderData = {
    user: User
    asunas: AsunaDTO[]
    accessories: AccessoryDTO[]
}

export const loader: LoaderFunction = async ({ request }) => {
    const userId = await requireUserId(request, request.url)
    const user = await getUser(userId)

    try {
        const data = await Promise.all([
            getOwnAsunas(AsunaContract, user.address, { readOnly: false }),
            getOwnAccessories(AccessoryContract, user.address, { readOnly: false }),
        ])

        return json<LoaderData>({
            user,
            asunas: data[0],
            accessories: data[1],
        })
    } catch (err) {
        return json<LoaderData>({
            user,
            asunas: [],
            accessories: [],
        })
    }
}

export const action: ActionFunction = async ({ request }) => {
    return logout(request)
}

export default function InventoryView() {
    const { user, accessories, asunas } = useLoaderData<LoaderData>()

    return (
        <div className="p-2">
            <div className="mt-8 flex justify-end">
                <Form method="post">
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm"
                    >
                        logout
                    </button>
                </Form>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-8">
                <div>
                    <h2 className="text-2xl">Asunas</h2>
                    <ul className="mt-6 grid gap-2 grid-cols-3 justify-items-center">
                        {asunas.map(a => {
                            return (
                                <li key={`asuna-${a.token_id}`}>
                                    <Link to={`/inventory/${a.token_id}`}>
                                        <img
                                            className="w-32 hover:mt-[-2px] rounded-md"
                                            alt={`Asuna ${a.token_id}`}
                                            src={`https://tunes.mypinata.cloud/ipfs/${a?.metadata?.image.slice(7)}`}
                                        ></img>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </div>
                <div>
                    <h2 className="text-2xl">Inventory</h2>
                    <ul className="mt-6 grid gap-6 grid-cols-3 justify-items-center">
                        {accessories.map(a => {
                            return (
                                <li key={`accessory-${a.token_id}`}>
                                    <div className="p-2 border border-black w-32 h-16">Accessory {a.token_id}</div>
                                    {/* <div>Amount: {a.amount}</div> */}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div>
    )
}
