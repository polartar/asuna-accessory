import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node"
import { Link, useLoaderData, useSubmit } from "@remix-run/react"
import { useEffect, useState } from "react"
import { Button } from "~/components/button"
import { setEthAddressCookie2 } from "~/libs/cookies"
import { EthAddressCookie, getAddressCookie } from "~/libs/cookies.server"
import { EthProvider } from "~/libs/providers.client"
import { AccessoryContract, AsunaContract } from "~/libs/providers.server"
import { getOwnAccessories } from "~/models/accessory.server"
import { getOwnAsunas } from "~/models/asuna.server"
import { getUserId } from "~/models/session.server"
import { AccessoryDTO, AsunaDTO } from "~/models/types"
import { createUser, getUserByAddress } from "~/models/user.server"

type LoaderData = {
    asunas: AsunaDTO[]
    accessories: AccessoryDTO[]
}

export const loader: LoaderFunction = async ({ request }) => {
    const address = await getAddressCookie(request)
    if (!address) {
        return json<LoaderData>({
            asunas: [],
            accessories: [],
        })
    }

    const user = await getUserId(request)
    if (user) {
        return redirect("/inventory")
    }

    try {
        const data = await Promise.all([
            getOwnAsunas(AsunaContract, address, { readOnly: false }),
            getOwnAccessories(AccessoryContract, address, { readOnly: false }),
        ])
        return json<LoaderData>({
            asunas: data[0],
            accessories: data[1],
        })
    } catch (err) {
        console.error(err)
        return json<LoaderData>({
            asunas: [],
            accessories: [],
        })
    }
}

type ActionData = {
    formError?: {
        address?: string
    }
    fields: {
        address?: string
    }
}

export const action: ActionFunction = async ({ request }) => {
    const body = await request.formData()
    const action = body.get("action")

    if (action?.toString() === "connect") {
        const address = body.get("address")?.toString().toLowerCase()
        if (!address) {
            return json<ActionData>({
                formError: {
                    address: "Require address to load your inventory",
                },
                fields: {
                    address: address,
                },
            })
        }

        const user = await getUserByAddress(address)
        if (!user) {
            await createUser({ address })
        }

        // Fetch and cache any asunas and accessories the users own
        await Promise.all([
            getOwnAsunas(AsunaContract, address, { readOnly: false }),
            getOwnAccessories(AccessoryContract, address, {
                readOnly: false,
            }),
        ])

        return json<ActionData>(
            {
                fields: {},
            },
            {
                headers: {
                    "Set-Cookie": await EthAddressCookie.serialize(address),
                },
            }
        )
    }

    throw new Error("API does not support this action")
}

export function IndexView() {
    const { asunas, accessories } = useLoaderData<LoaderData>()
    const submit = useSubmit()
    const [address, setAddress] = useState<string>("")

    useEffect(() => {
        async function run() {
            const account: string[] = await EthProvider.send("eth_requestAccounts", [])
            if (account[0]) {
                setEthAddressCookie2(account[0])
                setAddress(account[0])
            }
        }

        run()
    }, [])

    async function onWalletConnect() {
        const account: string[] = await EthProvider.send("eth_requestAccounts", [])
        if (address) {
            submit({ address: address, action: "connect" }, { method: "post" })
        } else if (account[0]) {
            submit({ address: account[0], action: "connect" }, { method: "post" })
        }
    }

    return (
        <div className="  text-center">
            <h1>Welcome to your Asuna Inventory</h1>
            <p>Please refresh inventory if you've recently switched or connecting your wallet for the first time.</p>

            <form className="mt-8">
                <Button onClick={onWalletConnect}>Refresh Inventory</Button>
                <Link to="/inventory" className="ml-2">
                    <Button>Inventory</Button>
                </Link>
            </form>

            <form>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="  p-3">
                        <h2 className="text-2xl">Asunas</h2>
                        <ul className="mt-6 grid gap-2 grid-cols-3 justify-items-center">
                            {asunas.map(a => {
                                return (
                                    <li key={`asuna-${a.token_id}`}>
                                        <img
                                            className=" w-32"
                                            alt={`Asuna ${a.token_id}`}
                                            src={`https://tunes.mypinata.cloud/ipfs/${a?.metadata?.image.slice(7)}`}
                                        ></img>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                    <div className="p-3">
                        <h2 className="text-2xl">Accessories</h2>
                        <ul className="mt-6 grid gap-2 grid-cols-3 justify-items-center">
                            {accessories.map(a => {
                                return (
                                    <li key={`accessory-${a.token_id}`}>
                                        <div className="p-2 border border-black w-32 h-16">Accessory {a.token_id}</div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            </form>
        </div>
    )
}
