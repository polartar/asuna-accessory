import { KMSClient } from "@aws-sdk/client-kms"
import { EventBridgeClient, PutEventsRequestEntry } from "@aws-sdk/client-eventbridge"
import { SQSClient } from "@aws-sdk/client-sqs"
import { ActionType } from "@prisma/client"

export const kms = new KMSClient({ region: "us-east-1" })
export const eventbridge = new EventBridgeClient({ region: "us-east-1" })
export const sqs = new SQSClient({ region: "us-east-1" })

export function makeEBEquipmentRequest(input: {
    requestId: number
    accessoryId: number
    asunaId: number
    requestorAddress: string
    actionType: ActionType
    txnHash: string
}): PutEventsRequestEntry {
    if (!process.env.EVENT_BUS_NAME) {
        throw new Error("Require process.env.EVENT_BUS_NAME")
    }

    return {
        Source: "asuna.remix",
        Detail: JSON.stringify({
            id: input.requestId,
            accessory_id: input.accessoryId,
            asuna_id: input.asunaId,
            req_address: input.requestorAddress,
            action_type: input.actionType,
            txn_hash: input.txnHash,
        }),
        EventBusName: process.env.EVENT_BUS_NAME,
        DetailType: "Equipment Transaction Request",
    }
}

export function makeEBCoinbaseEvent(payload: JSON): PutEventsRequestEntry {
    if (!process.env.EVENT_BUS_NAME) {
        throw new Error("Require process.env.EVENT_BUS_NAME")
    }

    return {
        Source: "asuna.remix",
        Detail: JSON.stringify(payload),
        EventBusName: process.env.EVENT_BUS_NAME,
        DetailType: "Coinbase Event",
    }
}
