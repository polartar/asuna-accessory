import { ethers } from "ethers"
import { LoaderFunction, json, ActionFunction } from "@remix-run/node"
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react"
import { EthAddressCookie, getAddressCookie } from "~/libs/cookies.server"
import { EthProvider } from "~/libs/providers.client"
import { createUser, getUser, getUserByAddress, updateUserNonce } from "~/models/user.server"
import { createUserSession } from "~/models/session.server"
import { setEthAddressCookie2 } from "~/libs/cookies"

type LoaderData = {
    message: string | null
    address: String | null
}

export const loader: LoaderFunction = async ({ request }) => {
    const address = await getAddressCookie(request)

    if (address) {
        const user = await getUserByAddress(address)
        if (user) {
            await updateUserNonce({ userId: user.id })
            const userWithNewNonce = await getUser(user.id)
            return json<LoaderData>({
                message: userWithNewNonce.nonce,
                address: userWithNewNonce.address,
            })
        }
    }

    return json<LoaderData>({
        message: null,
        address,
    })
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
    const formAction = body.get("action")?.toString()

    if (formAction === "authenticate") {
        const signature = body.get("signature")?.toString()
        if (!signature) {
            throw new Error("Sign the message")
        }
        const address = await getAddressCookie(request)
        if (!address) {
            throw new Error("Connect your wallet first")
        }
        const user = await getUserByAddress(address)
        if (!user) {
            throw new Error("Connect your wallet first")
        }
        if (!user.nonce) {
            throw new Error("Connect your wallet first")
        }
        const signedAddress = ethers.utils.verifyMessage(user.nonce, signature)
        if (signedAddress.toLowerCase() === user.address.toLowerCase()) {
            return createUserSession(user.id, "/inventory")
        }
        return json({
            error: "Invalid signature: signer address does not match user's address. Head back to the home page and refresh your inventory."
        }, {
            status: 401
        })
    }

    if (formAction === "connect") {
        console.log("connect wallet and create user if necessary")
        const address = body.get("address")
        if (!address) {
            return json<ActionData>({
                formError: {
                    address: "Require address to load your inventory",
                },
                fields: {
                    address: address?.toString(),
                },
            })
        }

        const user = await getUserByAddress(address.toString())
        if (!user) {
            await createUser({ address: address.toString() })
        } else {
            await updateUserNonce({ userId: user.id })
        }

        return new Response(null, {
            headers: {
                "Set-Cookie": await EthAddressCookie.serialize(address?.toString().toLowerCase()),
            },
        })
    }

    return null
}

export default function LoginView() {
    const actionData = useActionData()
    const { address, message } = useLoaderData<LoaderData>()
    const submit = useSubmit()

    async function onWalletConnect() {
        const account: string[] = await EthProvider.send("eth_requestAccounts", [])
        if (account[0]) {
            setEthAddressCookie2(account[0])
            submit({ address: account[0], action: "connect" }, { method: "post" })
        }
    }

    async function onLogin() {
        if (!message) {
            return
        }

        const signer = EthProvider.getSigner()
        const signature = await signer.signMessage(message)
        submit({ signature, action: "authenticate" }, { method: "post" })
    }

    return (
        <div className="flex justify-content items-center h-screen w-full">
            {!address || !message ? (
                <form className="w-full text-center">
                    <div>
                        <button type="button" onClick={onWalletConnect}>
                            Register
                        </button>
                    </div>
                </form>
            ) : (
                <form className="w-full text-center">
                    <div>
                        <button type="button" onClick={onLogin}>
                            Login
                        </button>
                    </div>
                    {actionData?.error && <p className="text-red-700">{actionData.error}</p>}
                </form>
            )}
        </div>
    )
}
