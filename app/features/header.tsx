import { Form, Link, useSubmit } from "@remix-run/react"
import { useEffect, useState } from "react"
import { setEthAddressCookie2 } from "~/libs/cookies"
import { formatWalletAddress } from "~/libs/general"
import { EthProvider } from "~/libs/providers.client"

export function Header() {
    const [address, setAddress] = useState<string>("")
    const submit = useSubmit()

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

    return (
        <div className="flex justify-between pt-4  px-5">
            <Link to="/">
                <img src="/logo-white.png" alt="logo" width={162} />{" "}
            </Link>

            <div>
                <button className="border border-white rounded-3xl px-5 py-3">
                    {address ? formatWalletAddress(address) : "Connect Wallet"}
                </button>
            </div>
        </div>
    )
}
