import { PutEventsCommand } from "@aws-sdk/client-eventbridge"
import { ActionFunction, json } from "@remix-run/node"
import crypto from "node:crypto"
import { eventbridge, makeEBCoinbaseEvent } from "~/libs/aws.server"

// const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET
// if (!COINBASE_WEBHOOK_SECRET) {
//     throw new Error("Require COINBASE_WEBHOOK_SECRET")
// }

export const action: ActionFunction = async ({ request }) => {
    // const cbSignature = request.headers.get("X-CC-Webhook-Signature")
    // if (!cbSignature) {
    //     return json(
    //         {
    //             ok: false,
    //         },
    //         {
    //             status: 401,
    //         }
    //     )
    // }
    // const hmac = crypto.createHmac("sha256", COINBASE_WEBHOOK_SECRET)
    // const signature = hmac.update(await request.clone().text()).digest("hex")
    // if (cbSignature !== signature) {
    //     return json(
    //         {
    //             ok: false,
    //         },
    //         {
    //             status: 401,
    //         }
    //     )
    // }
    // const payload = await request.json()
    // console.log("publishing cb payload", payload)
    // await eventbridge.send(
    //     new PutEventsCommand({
    //         Entries: [makeEBCoinbaseEvent(payload)],
    //     })
    // )
    // return json(
    //     {
    //         ok: true,
    //     },
    //     {
    //         status: 200,
    //     }
    // )
}
