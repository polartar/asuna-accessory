import { ActionRequest } from "@prisma/client"
import { request as gqlRequest, gql } from "graphql-request"
import mysql2 from "mysql2"
import { ACCESSORY_SUBGRAPH } from "~/libs/providers.server"

if (!process.env.DATABASE_URL) {
    throw new Error("Require process.env.DATABASE_URL")
}

const pool = mysql2.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

export const main = async () => {
    const queried = await pool.promise().query("select * from action_requests where txn_state='Pending'")
    const rows = queried[0] as ActionRequest[]

    console.log(`reconciling ${rows.length} pending requests`)

    const requestPromises = rows.map(async r => {
        console.log("reconciling ", r)

        try {
            const actionConfirmed = await gqlRequest<
                {
                    request: {
                        transaction: string
                    } | null
                },
                {
                    requestId: string
                }
            >(
                ACCESSORY_SUBGRAPH,
                gql`
                    query getRequest($requestId: String!) {
                        request(id: $requestId) {
                            transaction
                        }
                    }
                `,
                {
                    requestId: `req-${r.txn_hash}`,
                }
            )

            console.log("fetched subgraph request", actionConfirmed)

            if (actionConfirmed.request) {
                await pool.promise().query("update action_requests set txn_state='Success' where id=?", [r.id])

                console.log(`request=${r.id}, hash=${r.txn_hash} is complete`)
            }
        } catch (err) {
            console.error("failed to handle request", err)
        }
    })

    await Promise.all(requestPromises)
}
