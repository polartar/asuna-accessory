import { User, Wallet } from "@prisma/client"
import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node"
import { Form } from "@remix-run/react"
import { Button } from "~/components/button"
import { prisma } from "~/db.server"
import { createCharge } from "~/libs/coinbase.server"
import { requireUserId } from "~/models/session.server"
import { getUser } from "~/models/user.server"
import { getWalletByAddress } from "~/models/wallet.server"

type LoaderData = {
    user: User
    wallet: Wallet
}

export const loader: LoaderFunction = async ({ request }) => {
    const userId = await requireUserId(request)
    const user = await getUser(userId)

    const wallet = await getWalletByAddress(user.address)
    return json<LoaderData>({
        user,
        wallet,
    })
}

export const action: ActionFunction = async ({ request }) => {
    const userId = await requireUserId(request)
    const body = await request.formData()
    const amountRaw = body.get("amount")?.toString();
    if (!amountRaw) {
        throw new Error("Invalid amount")
    }
    const amount = parseInt(amountRaw)
    if (amount <= 0) {
        throw new Error("Invalid amount")
    }
    const charge = await createCharge({ amount })
    await prisma.charge.create({
        data: {
            id: charge.data.id,
            amount,
            created_at: charge.data.created_at,
            expires_at: charge.data.expires_at,
            hosted_url: charge.data.hosted_url,
            status: charge.data.timeline[charge.data.timeline.length - 1].status,
            user_id: userId,
        },
    })

    return redirect(charge.data.hosted_url)
}

export default function WalletPage() {
    return (
        <div className="p-4">
            <Form method="post">
                <p>Add Asuna credit</p>
                <input name="amount" placeholder="Credit" type="number" min={1}></input>
                <Button>Pay</Button>
            </Form>
        </div>
    )
}
