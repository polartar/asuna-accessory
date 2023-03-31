import { SQSHandler } from "aws-lambda"
import mysql2 from "mysql2"
import { sqs } from "~/libs/aws.server"
import { DeleteMessageCommand } from "@aws-sdk/client-sqs"
import { ChargeStatus, CoinbaseCharge } from "~/models/types"

if (!process.env.DATABASE_URL) {
    throw new Error("Require process.env.DATABASE_URL")
}

const CREDIT_PER_DOLLAR = 25

const connection = mysql2.createConnection(process.env.DATABASE_URL)

export const main: SQSHandler = async event => {
    const records = event.Records
    for (const rec of records) {
        console.log(rec)

        const body = rec.body
        try {
            if (!body) {
                throw new Error("Record missing body")
            }
            const parsedBody = JSON.parse(body)
            const coinbasePayload: CoinbaseCharge = parsedBody.detail
            console.log("coinbase commerce payload", coinbasePayload)
            console.log("processing charge ", coinbasePayload.event.data.id)
            if (!coinbasePayload.event || coinbasePayload.event.resource !== "event") {
                throw new Error("Not an event")
            }
            await handleCoinbaseCharge(connection, coinbasePayload)
        } catch (err) {
            console.error(err)
        } finally {
            await sqs.send(
                new DeleteMessageCommand({
                    QueueUrl: process.env.QUEUE_URL,
                    ReceiptHandle: rec.receiptHandle,
                })
            )
        }
    }
}

async function handleCoinbaseCharge(conn: mysql2.Connection, payload: CoinbaseCharge) {
    const chargeType = payload.event.type
    const query = await conn.promise().query("select * from charges where id = ? limit 1", [payload.event.data.id])
    const rows = query[0] as ChargeDb[]
    const charge = rows?.[0]

    if (!charge) {
        throw new Error(`Unable to find charge ${payload.event.data.id}`)
    }

    if (chargeType === "charge:confirmed") {
        await conn.promise().query("begin;")
        await conn.promise().query("update charges set status='COMPLETED' where id=?;", [charge.id])
        await conn
            .promise()
            .query("update wallets set balance = balance + ? where user_id=?", [
                charge.amount * CREDIT_PER_DOLLAR,
                charge.user_id,
            ])
        await conn.promise().query("commit;")
    } else if (chargeType === "charge:pending") {
        await conn.promise().query("update charges set status='PENDING' where id=?", [charge.id])
    } else if (chargeType === "charge:failed") {
        await conn.promise().query("update charges set status='FAILED' where id=?", [charge.id])
    }
}

type ChargeDb = {
    id: string
    amount: number
    status: ChargeStatus | "FAILED"
    hosted_url: string
    expires_at: Date
    created_at: Date
    updated_at: Date
    user_id: string
}
